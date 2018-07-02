/* Manage read and write of config files. */

import { readFileSync, writeFile } from "fs";
import Winston from "winston";

export default class Config {
    // Params:
    //  - filename: config file to parse
    constructor(filename) {
        if (typeof filename !== "string") {
            throw Error("Config: Valid filename not passed");
        }

        this.filename = filename;

        let fileData;
        try {
            fileData = JSON.parse(readFileSync(filename));
        } catch (e) {
            // In case of error assign empty object
            fileData = {};
        }

        this._ = fileData;
    }

    // Write config to file and return promise for the action
    write() {
        // Return Promise that resolve when write file has been executed
        return new Promise((resolve, reject) => {
            // Resolve or reject promise in callback to writeFile
            writeFile(this.filename, JSON.stringify(this._), err => {
                if (err) reject();
                else resolve();
            });
        });
    }
}
