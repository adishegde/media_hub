/* Entry point of daemon */

import clargsParser from "minimist";
import * as ps from "process";
import { addLogFile, logger as log } from "./utils/log.js";

function commandLineOptions() {
    log.info("Parsing command line options.");

    let options = clargsParser(ps.argv.slice(2));

    if (options["log"]) {
        addLogFile(options["log"]);
        log.info(`Logging to "${options["log"]}".`);
    }

    if (options["error-log"]) {
        addLogFile(options["error-log"], "error");
        log.info(`Logging errors to "${options["error-log"]}".`);
    }

    log.info("Done parsing command line options.");
}

// Initial setup on start up
function init() {
    // Parse cl options and setup app
    commandLineOptions();

    log.info("Starting Server...");
}

// Initialize on startup
init();
