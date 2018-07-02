/* Entry point of daemon */

import Program from "commander";
import * as Ps from "process";
import Winston from "winston";
import NodeCleanup from "node-cleanup";

import Server from "../core/daemon/server";
import { addLogFile, addConsoleLog } from "../core/utils/log";
import Config from "../core/utils/config";
import {
    DEFAULT_SERVER as DEFAULT,
    DEFAULT_NETWORK,
    DEFAULT_HTTP_PORT,
    DEFAULT_MULTICAST,
    DEFAULT_UDP_PORT
} from "../core/utils/constants";

const logger = Winston.loggers.get("daemon");
// Shared directories through cli. Paths pushed via Program.options
const share = [];
const ignore = [...DEFAULT.ignore];

Program.version("0.3.0")
    .usage("[options]")
    .option(
        "-u, --udpPort <port>",
        "Port for UDP service.",
        val => parseInt(val),
        DEFAULT_UDP_PORT
    )
    .option(
        "-h, --httpPort <port>",
        "Port for HTTP service.",
        val => parseInt(val),
        DEFAULT_HTTP_PORT
    )
    .option(
        "-n, --network <name>",
        "Name of network for which response UDP response will be sent.",
        DEFAULT_NETWORK
    )
    .option(
        "--pollingInterval <time>",
        "Polling interval for file indexing in milliseconds.",
        val => parseInt(val),
        DEFAULT.pollingInterval
    )
    .option("--db <path>", "Path to meta data file.", DEFAULT.db)
    .option(
        "--dbwriteInterval <time>",
        "Time between consecutive writes to db in milliseconds.",
        DEFAULT.dbWriteInterval
    )
    .option(
        "--maxResults <number>",
        "Maximum number of results to send in response",
        DEFAULT.maxResults
    )
    .option(
        "-s, --share <path>",
        "Repeatable option to share a directory at <path>.",
        path => {
            share.push(path);
            return share;
        }
    )
    .option("--log <path>", "Path to log file. Logs are appended.")
    .option("--errorLog <path>", "Path to error log. Logs are appended.")
    .option(
        "--logLevel <silly|debug|info|warn|error>",
        "Severity of logs in stdout and --log.",
        /^(silly|debug|info|warn|error)$/i,
        "info"
    )
    .option(
        "-c, --config <path>",
        "Path to config file. Config file is a JSON file which can have values for options."
    )
    .option(
        "--ignore <pattern>",
        "All paths matching <pattern> will be ignored. Option can be repeated to provide multiple patterns.",
        pattern => {
            ignore.push(pattern);
            return ignore;
        },
        DEFAULT.ignore
    )
    .option("--selfRespond", "Respond to search requests from same machine.")
    .option(
        "--mcAddr <ip>",
        "Multicast address to which daemon will subscribe. IP should belong to IPv4 family.",
        DEFAULT_MULTICAST
    )
    .option(
        "--ip <ip>",
        "Multicast interface for subscribing to multicast address. If not provided a random IPv4 external IP is guessed."
    )
    .parse(process.argv);

const SERVEROPTS = [
    "udpPort",
    "httpPort",
    "network",
    "share",
    "pollingInterval",
    "db",
    "dbwriteInterval",
    "maxResults",
    "ignore",
    "selfRespond",
    "mcAddr",
    "ip"
];

// Final options, i.e. combination of those in command line and config file
let finalOpts;

let server = null;

function readConfigFile() {
    let configHandler = {};

    if (Program.config) {
        configHandler = new Config(Program.config);
    }

    // Unpack configHandler followed by Program. This ensures that finalOpts
    // contains both set of properties but command line options overrides
    // config file
    finalOpts = {
        ...configHandler._,
        ...Program
    };
}

function setup() {
    // Add console log
    addConsoleLog("daemon", finalOpts["logLevel"]);

    if (finalOpts["log"]) {
        addLogFile("daemon", finalOpts["log"], finalOpts["logLevel"]);
    }
    if (finalOpts["errorLog"]) {
        addLogFile("daemon", finalOpts["errorLog"], "error");
    }

    const serverOpts = {};
    SERVEROPTS.forEach(key => {
        if (finalOpts[key]) serverOpts[key] = finalOpts[key];
    });

    // Default share is empty list. If user hasn't passed share path we should
    // send undefined
    if (serverOpts.share && serverOpts.share.length === 0) {
        serverOpts.share = undefined;
    }

    server = new Server(serverOpts.db, serverOpts);
    server.start();
}

// Initial setup on start up
function init() {
    try {
        readConfigFile();
    } catch (err) {
        console.debug(`index.js: ${err}`);
        return;
    }

    try {
        // Use options to setup resources and start server
        setup();
    } catch (err) {
        logger.error(`index.js: ${err}`);
        logger.debug(`index.js: ${err.stack}`);
    }
}

// Elegantly free resources on process exit
NodeCleanup((code, signal) => {
    logger.info(`index.js: Starting cleanup.`);
    if (server) {
        let stopped = Object.values(server.stop());
        Promise.all(stopped)
            .then(
                val => {
                    logger.info(
                        "index.js: Cleaned all resources. Shutting down."
                    );
                },
                err => {
                    logger.error(`index.js: ${err}`);
                }
            )
            .then(() => {
                process.kill(process.pid, signal);
            });
        NodeCleanup.uninstall();
        return false;
    }
});

// Initialize on startup
init();
