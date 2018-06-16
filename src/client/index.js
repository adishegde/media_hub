import Program from "commander";
import * as Ps from "process";
import Winston from "winston";
import Progress from "cli-progress";

import Client from "./client";
import { addConsoleLog } from "../utils/log";

Program.version("1.0")
    .usage("[options] <command> [<args>]")
    .option(
        "-p, --clientPort <port>",
        "Client port for UDP broadcast.",
        parseInt
    )
    .option("-u, --udpPort <port>", "Server UDP port.", parseInt)
    .option("-h, --httpPort <port>", "Server HTTP port.", parseInt)
    .option(
        "-n, --network <name>",
        "Name of network to which request will be made."
    )
    .option(
        "-b, --broadcastIp <name>",
        "Broadcast IP address for UDP search requests."
    )
    .option(
        "-t, --timeout <time>",
        "Time to wait for UDP broadcast responses.",
        parseInt
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
        ct
            .search(query, param)
            .then(data => {
                if (data.length === 0) {
                    console.log("No results found.");
                } else {
                    let disp = [];
                    // Add rows to table. With capitalized columns
                    data.forEach(res => {
                        disp.push({
                            Name: res.name,
                            URL: res.url
                        });
                    });
                    console.table(disp);
                }
            })
            .catch(err => {
                console.log(`${err}`);
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
            });
    });

Program.command("info <url>")
    .description("Get meta data of file/directory at <url>.")
    .action(url => {
        let options = setup();

        let ct = new Client(options);

        return ct
            .getMeta(url)
            .then(meta => {
                delete meta.id;
                console.table(meta);
            })
            .catch(err => {
                console.log(`${err}`);
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
                let table = {};

                data.children.forEach(child => {
                    table[child.name] = {
                        URL: child.url,
                        Type: child.type
                    };
                });

                console.table(table);
            })
            .catch(err => {
                console.log(`${err}`);
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
