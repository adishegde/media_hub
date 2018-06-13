/* Entry point of daemon */

import clargsParser from "minimist";
import * as Ps from "process";

import Server from "./server";
import { addLogFile, logger as log } from "../utils/log";
import Config from "../utils/config";
import { CONFIGKEYS } from "../utils/constants";

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
    log.info("Parsing command line options.");

    let cargs = clargsParser(Ps.argv.slice(2));

    if (cargs["config"]) {
        log.info("Config file specified, parsing config file options.");

        let configHandler = new Config(cargs["config"]);
        CONFIGKEYS.forEach(key => {
            if (configHandler[key]) options[key] = configHandler[key];
        });
    }

    CONFIGKEYS.forEach(key => {
        if (cargs[key]) options[key] = cargs[key];
    });

    log.info("Done parsing command line options.");
}

function setup() {
    if (options["log"]) {
        addLogFile(options["log"], "info");
    }
    if (options["errorLog"]) {
        addLogFile(options["errorLog"], "error");
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
        log.error(`index.js: ${err}`);
        log.debug(`index.js: ${err.stack}`);
    }
}

// Initialize on startup
init();
