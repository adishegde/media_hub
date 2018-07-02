import Program from "commander";
import * as Ps from "process";
import Winston from "winston";
import Progress from "cli-progress";
import Table from "cli-table";

import Client from "../core/client/client";
import { addConsoleLog } from "../core/utils/log";
import {
    DEFAULT_CLIENT as DEFAULT,
    DEFAULT_NETWORK,
    DEFAULT_HTTP_PORT,
    DEFAULT_UDP_PORT
} from "../core/utils/constants";

const logger = Winston.loggers.get("client");

Program.version("0.3.0")
    .usage("[options] <command> [<args>]")
    .option(
        "-p, --clientPort <port>",
        "Client port for UDP broadcast.",
        val => parseInt(val),
        DEFAULT.port
    )
    .option(
        "-u, --udpPort <port>",
        "Server UDP port.",
        val => parseInt(val),
        DEFAULT_UDP_PORT
    )
    .option(
        "-h, --httpPort <port>",
        "Server HTTP port.",
        val => parseInd(val),
        DEFAULT_HTTP_PORT
    )
    .option(
        "-n, --network <name>",
        "Name of network to which request will be made.",
        DEFAULT_NETWORK
    )
    .option(
        "-b, --broadcastIp <name>",
        "Broadcast IP address for UDP search requests.",
        DEFAULT.broadcastIp
    )
    .option(
        "-t, --timeout <time>",
        "Time to wait for UDP broadcast responses in milliseconds.",
        val => parseInt(val),
        DEFAULT.timeout
    )
    .option("-i, --incoming <path>", "Default download directory.")
    .option("-d, --debug", "Enable debug messages.");

Program.command("search <query> [param]")
    .description(
        "Search for files having [param] matching <query>. [param] can be tags/name. Default matches both."
    )
    .action((query, param) => {
        let options = setup();

        const ct = new Client(options);
        console.log(
            `Searching for files with ${param ||
                "names and tags"} as "${query}"\n`
        );

        // Display results
        ct.search(query, param)
            .then(data => {
                if (data.length === 0) {
                    console.log("No results found.");
                } else {
                    let table = new Table({
                        head: ["Name", "URL"]
                    });

                    // Add rows to table. With capitalized columns
                    data.forEach(res => {
                        table.push([res.name, res.url]);
                    });
                    console.log(table.toString());
                }
            })
            .catch(err => {
                console.log(`${err}`);
                logger.debug(`index.js: ${err.stack}`);
            });
    });

Program.command("download <url> [path]")
    .description(
        "Download file/directory at <url> to [path]. Defaults to --incoming."
    )
    .action((url, path) => {
        let options = setup();

        let ct = new Client(options);
        let pb;
        let downMap = {};
        let totalSize = 0;

        return ct
            .download(url, path, (downloaded, size, path, root) => {
                if (pb) {
                    let delta = downMap[path] || 0;
                    delta = downloaded - delta;
                    downMap[path] = downloaded;

                    pb.increment(delta);
                } else {
                    pb = new Progress.Bar(
                        {
                            format:
                                "Downloading: [{bar}] {percentage}% | ETA: {eta}s | {value}/{total} bytes"
                        },
                        Progress.Presets.shades_classic
                    );
                    pb.start(size);
                    totalSize = size;
                }
            })
            .then(path => {
                pb.update(totalSize);
                pb.stop();
                console.log(`\nFile/Directory downloaded to ${path}`);
            })
            .catch(err => {
                console.log(`${err}`);
                logger.debug(`index.js: ${err.stack}`);
            });
    });

// Takes size in bytes and returns string with right units to make it more
// readable
function formatBytes(bytes) {
    let suf = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];

    if (bytes === 0) {
        return `0 ${suf[0]}`;
    }

    let place = Math.floor(Math.log2(bytes) / 10);
    let num = (bytes / Math.pow(1024, place)).toFixed(2);

    return `${num} ${suf[place]}`;
}

Program.command("info <url>")
    .description("Get meta data of file/directory at <url>.")
    .action(url => {
        let options = setup();

        let ct = new Client(options);

        return ct
            .getMeta(url)
            .then(meta => {
                let table = new Table();

                if (meta.tags.length === 0) meta.tags = "-";

                table.push(
                    { Name: meta.name },
                    { Type: meta.type },
                    { Tags: meta.tags },
                    { Downloads: meta.downloads },
                    { Description: meta.description || "-" },
                    { Size: formatBytes(meta.size) }
                );

                console.log(table.toString());
            })
            .catch(err => {
                console.log(`${err}`);
                logger.debug(`index.js: ${err.stack}`);
            });
    });

Program.command("list <url>")
    .description("List contents of directory at <url>.")
    .action(url => {
        let options = setup();

        let ct = new Client(options);
        return ct
            .getDirectoryInfo(url)
            .then(data => {
                let table = new Table({
                    head: ["", "Type", "URL"]
                });

                data.children.forEach(child => {
                    table.push({
                        [child.name]: [child.url, child.type]
                    });
                });

                console.log(table.toString());
            })
            .catch(err => {
                console.log(`${err}`);
                logger.debug(`index.js: ${err.stack}`);
            });
    });

// Sets up app based on cli options
// Returns client options
function setup() {
    let logLevel = "error";
    if (Program.debug) {
        // This is a small hack. There is no logging of level above debug in
        // Client class. Thus we set to error level to disable logging and set
        // it to debug to enable logging.
        logLevel = "debug";
    }
    addConsoleLog("client", logLevel);

    // Extrack necessary properties
    let {
        clientPort,
        udpPort,
        httpPort,
        network,
        broadcastIp,
        timeout,
        incoming
    } = Program;

    return {
        clientPort,
        udpPort,
        httpPort,
        network,
        broadcastIp,
        timeout,
        incoming
    };
}

Program.parse(process.argv);
