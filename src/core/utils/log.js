/* Logging functionality for daemon. Exports a logger. */

import * as Winston from "winston";
import * as Path from "path";
import * as Fs from "fs";

Winston.loggers.add("daemon", Winston.createLogger());
Winston.loggers.add("client", Winston.createLogger());

export function addConsoleLog(name, level) {
    let logger = Winston.loggers.get(name);

    let trans = new Winston.transports.Console({
        name: "console",
        json: false,
        colorize: true,
        format: Winston.format.simple(),
        level: level || "info"
    });

    logger.add(trans);
}

export function addLogFile(name, filename, level) {
    let logger = Winston.loggers.get(name);

    // Convert relative paths to absolute paths
    filename = Path.resolve(filename);

    // Synchronous file system operations since we are initializing.
    try {
        if (Fs.existsSync(filename)) {
            Fs.accessSync(filename, Fs.constants.W_OK);
        } else Fs.accessSync(Path.dirname(filename), Fs.constants.W_OK);
    } catch (err) {
        logger.error(`Util.Log: ${err}`);
        return;
    }

    let conf = {
        filename,
        format: Winston.format.combine(
            Winston.format.timestamp(),
            Winston.format.json()
        ),
        level: level || "info"
    };

    logger.add(new Winston.transports.File(conf));
}
