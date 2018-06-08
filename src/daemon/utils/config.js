/* Manage read and write of config files. */

import { readFileSync, writeFile } from "fs";

import logger from "./log.js";

// The keys to be retrieved from config file
const CONFIGKEYS = [
    "shared" // Array of directories that are to be shared
];

export class Config {
    constructor(filename) {
        this.filename = filename;

        let fileData;
        try {
            fileData = JSON.parse(readFileSync(filename));
        } catch (e) {
            // Log and rethrow error
            logger.error(e);
            throw e;
        }

        for (let key of CONFIGKEYS) {
            this[key] = fileData[key];
        }

        logger.info(`Loaded config data from ${filename} successfully.`);
    }

    // Write config to file and return promise for the action
    write() {
        let config = {};
        for (let key of CONFIGKEYS) {
            config[key] = this[key];
        }

        // Return Promise that resolve when write file has been executed
        return new Promise((resolve, reject) => {
            // Resolve or reject promise in callback to writeFile
            writeFile(this.filename, JSON.stringify(config), err => {
                if (err) reject();
                else resolve();
            });
        }).then(
            () => {
                logger.info(
                    `Wrote to config file ${this.filename} successfully.`
                );
            },
            e => {
                // Log error
                logger.error(
                    `Error while writing config to ${this.filename}: ${e}`
                );
            }
        );
    }
}
