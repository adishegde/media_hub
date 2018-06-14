/* Entry point of daemon */

import clargsParser from "minimist";
import * as Ps from "process";
import Winston from "winston";

import Server from "./server";
import { addLogFile, addConsoleLog } from "../utils/log";
import Config from "../utils/config";
import { CONFIGKEYS } from "../utils/constants";

const logger = Winston.loggers.get("daemon");

// Options from CONFIGKEYS to be passed to server
const SERVEROPTS = [
    "udpPort",
    "httpPort",
    "networkName",
    "shared",
    "pollingInterval",
    "dbPath",
    "dbwriteInterval",
    "maxResults"
];

// Options passed to server
const options = {};
let server = null;

function commandLineOptions() {
    let cargs = clargsParser(Ps.argv.slice(2));

    if (cargs["config"]) {
        let configHandler = new Config(cargs["config"]);
        CONFIGKEYS.forEach(key => {
            if (configHandler[key]) options[key] = configHandler[key];
        });
    }

    CONFIGKEYS.forEach(key => {
        if (cargs[key]) options[key] = cargs[key];
    });
}

function setup() {
    // Add console log
    addConsoleLog("daemon", options["logLevel"]);

    if (options["log"]) {
        addLogFile("daemon", options["log"], options["logLevel"]);
    }
    if (options["errorLog"]) {
        addLogFile("daemon", options["errorLog"], "error");
    }

    const serverOpts = {};
    SERVEROPTS.forEach(key => {
        if (options[key]) serverOpts[key] = options[key];
    });

    server = new Server(serverOpts);
    server.start();
}

// Initial setup on start up
function init() {
    try {
        // Parse cl options and setup app
        commandLineOptions();

        // Use options to setup resources and start server
        setup();
    } catch (err) {
        logger.error(`index.js: ${err}`);
        logger.debug(`index.js: ${err.stack}`);
    }
}

// Initialize on startup
init();
