import * as winston from "winston";

export const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            json: false,
            colorize: true,
            format: winston.format.simple()
        })
    ]
});

export function addLogFile(filename, level) {
    let conf = {
        filename,
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        )
    };

    if (level) {
        conf.level = level;
    }

    logger.add(new winston.transports.File(conf));
}

export default logger;
