import clargsParser from "minimist";
import * as Ps from "process";
import Winston from "winston";
import Progress from "cli-progress";

import Client from "./client";
import { addLogFile, addConsoleLog } from "../utils/log";

const logger = Winston.loggers.get("client");

const CLIENTOPTS = [
    "clientPort",
    "udpPort",
    "httpPort",
    "network",
    "broadcastIp",
    "timeout",
    "incoming"
];

const options = {};
let command;

function commandLineOptions() {
    let cargs = clargsParser(Ps.argv.slice(2));

    if (cargs["config"]) {
        let configHandler = new Config(cargs["config"]);
        CLIENTOPTS.forEach(key => {
            if (configHandler[key]) options[key] = configHandler[key];
        });
    }

    CLIENTOPTS.forEach(key => {
        if (cargs[key]) options[key] = cargs[key];
    });

    // debug enables logging. Checked for seperately since it isn't passed to
    // client instance
    if (cargs.debug) options.debug = cargs.debug;

    // Extract non keyargs to command
    command = cargs._;
}

// Returns promise for executed command
function run() {
    // Add console transport
    let logLevel = "error";
    if (options.debug) {
        // This is a small hack. There is no logging of level above debug in
        // Client class. Thus we set to error level to disable logging and set
        // it to debug to enable logging.
        logLevel = "debug";
    }
    addConsoleLog("client", logLevel);

    // Take different actions depending on command
    switch (command[0]) {
        case "search":
            return search();

        case "download":
            return download();

        case "info":
            return info();

        case "list":
            return list();

        case "usage":
            return usage();

        default:
            console.log("Unknown command.\n");
            return usage();
    }
}

function search() {
    // Check if search string is provided
    if (!command[1]) Promise.reject("No search string provided.");

    const ct = new Client(options);
    console.log(
        `Searching for files with ${command[2] || "names and tags"} as "${
            command[1]
        }"\n`
    );

    // Display results
    // command[2] denotes the param
    return ct.search(command[1], command[2]).then(data => {
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
    });
}

function download() {
    let url = command[1];
    if (!url) return Promise.reject("URL not given.");

    let ct = new Client({ incoming: options.incoming });
    let pb;
    let downMap = {};
    let totalSize = 0;

    return ct
        .download(url, command[2], (downloaded, size, path, root) => {
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
        });
}

function info() {
    let url = command[1];
    if (!url) return Promise.reject("URL not given.");

    let ct = new Client({});

    return ct.getMeta(url).then(meta => {
        delete meta.id;
        console.table(meta);
    });
}

function list() {
    let url = command[1];
    if (!url) return Promise.reject("URL not given.");

    let ct = new Client({});
    return ct.getDirectoryInfo(url).then(data => {
        let table = {};

        data.children.forEach(child => {
            table[child.name] = {
                URL: child.url,
                Type: child.type
            };
        });

        console.table(table);
    });
}

function usage() {
    const usageInfo = {
        search: {
            command: "search <search string> [param]",
            description:
                "Search for files having names and tags 'param' as <search string>. Default match param and tag"
        },
        download: {
            command: "download <url> [dpath]",
            description:
                "Download file or directory to 'dpath' where 'dpath' can be new directory/file name or parent directory's name"
        },
        info: {
            command: "info <url>",
            description: "View meta information about file or directory."
        },
        list: {
            command: "list <url>",
            description: "View subfiles of a directory."
        },
        usage: {
            command: "usage",
            description: "View this message."
        },
        options: {
            command: "--<option>",
            description:
                "Options given to command.\n - clientPort: Port for making UDP requests on client (default 31342).\n - udpPort: Server's UDP port to which client should make a request (default 31340).\n - httpPort: Server's HTTP port to which client should make a request (default 31340).\n - network: The network to which request should be made (default 'Media_Hub').\n - broadcastIp: The broadcast IP address (default '255.255.255.255')\n - timeout: Time to wait for UDP responses (default 3000ms)\n - incoming: Default directory for downloads.\n - debug: Enable detailed logging.\n - config: JSON file which can contain any of the above properties."
        }
    };

    console.log("Usage:");
    for (let opt of Object.keys(usageInfo)) {
        console.log(usageInfo[opt].command);
        console.log(usageInfo[opt].description);
        console.log("\n");
    }

    return Promise.resolve();
}

function main() {
    try {
        // Parse cl options
        commandLineOptions();
    } catch (err) {
        console.log(err);
    }

    // Execute given command
    run().catch(err => {
        console.log(`${err}`);
        logger.debug(`Media_Hub.Client: ${err.stack}`);
    });
}

main();
