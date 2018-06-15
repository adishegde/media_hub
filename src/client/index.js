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

        case "default":
            return Promise.reject("Unknown command.");
    }
}

function download() {
    let url = command[1];
    if (!url) return Promise.reject("URL not given.");

    let ct = new Client({ incoming: options.incoming });
    let pb;
    return ct
        .downloadFile(url, command[2], (downloaded, size) => {
            if (!pb) {
                pb = new Progress.Bar(
                    {
                        format:
                            "Downloading: [{bar}] {percentage}% | ETA: {eta}s | {value}/{total} bytes"
                    },
                    Progress.Presets.shades_classic
                );
                pb.start(size, downloaded);
            }
            pb.update(downloaded);
        })
        .then(path => {
            pb.stop();
            console.log(`\nFile downloaded to ${path}`);
        });
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
    });
}

main();
