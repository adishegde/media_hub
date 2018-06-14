/* Logging functionality for daemon. Exports a logger. */

import * as Winston from "winston";

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
