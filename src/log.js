import * as winston from "winston";

export const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

export function addLogFile(filename, level) {
    let conf = { filename };
    if (level) {
        conf.level = level;
    }

    logger.add(new winston.transports.File(conf));
}

export default logger;
