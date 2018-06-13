/* Logging functionality for daemon. Exports a logger. */

import * as Winston from "winston";

export const logger = Winston.createLogger({
    transports: [
        new Winston.transports.Console({
            json: false,
            colorize: true,
            format: Winston.format.simple(),
            level: "debug"
        })
    ]
});

export function addLogFile(filename, level) {
    let conf = {
        filename,
        format: Winston.format.combine(
            Winston.format.timestamp(),
            Winston.format.json()
        )
    };

    if (level) {
        conf.level = level;
    }

    logger.add(new Winston.transports.File(conf));
}

export default logger;
