/* Maintaining meta data for indexed files. Currently meta data is stored as a
 * json file */

import * as Fs from "fs";
import * as Util from "util";
import * as Path from "path";
import uuid from "uuid/v5";

import logger from "../../utils/log";
import { UUID_NAMESPACE } from "../../utils/constants";

let writeFile = Util.promisify(Fs.writeFile);
let lstat = Util.promisify(Fs.lstat);
let readdir = Util.promisify(Fs.readdir);

/* Each path has the following data:
 * - name: Name of directory or file.
 * - downloads: In case of a file, the number of times it has been downloaded.
 *   and in case of a directory, the maximum of downloads of it's children.
 * - description: Description of file/directory.
 * - tags: Tags classifying the file or directory.
 * - type: File or Directory.
 * - path: Path to directory or file.
 * - id: The uuid for corresponding to the path
*/

export default class MetaData {
    // Params
    // - dbPath: Path to database (json file) (default: ./meta.json).
    // - writeInterval: Interval between consecutive writes (default: 10 sec)
    constructor(dbPath = "./meta.json", writeInterval = 10000) {
        this.dbPath = dbPath;

        // Synchronous functions used here since we need initialized data
        try {
            if (Fs.existsSync(dbPath)) {
                try {
                    this.data = JSON.parse(Fs.readFileSync(dbPath));
                } catch (error) {
                    logger.error(
                        `${dbPath} does not contain JSON compatible data. Clearing file...`
                    );

                    this.data = {};
                    Fs.closeSync(Fs.openSync(dbPath, "w"));
                }
            } else {
                this.data = {};
                Fs.closeSync(Fs.openSync(dbPath, "w"));
            }
        } catch (error) {
            logger.error(error);
            throw error;
        }

        // Create hash to path mapping
        this.hashMap = {};
        Object.keys(this.data).forEach(path => {
            this.hashMap[uuid(path, UUID_NAMESPACE)] = path;
        });

        // Bind methods to avoid unexpected binding errors
        this.getData = this.getData.bind(this);
        this.incrementDownload = this.incrementDownload.bind(this);
        this.remove = this.remove.bind(this);
        this.update = this.update.bind(this);
        this.write = this.write.bind(this);

        // Set last write as current time
        this.lastWrite = new Date();
        this.writeInterval = writeInterval;

        logger.info(`Loaded meta data from ${dbPath} successfully.`);
    }

    // Update data of path.
    // Params:
    // - path: Path whose meta data is to be updated
    //
    // Return Value:
    //  A promise that is resolved when the update is complete
    async update(path) {
        let stat = await lstat(path);

        let name = Path.basename(path);
        let downloads = 0;
        let description = "";
        let tags = [];
        let type = "file";
        let id = uuid(path, UUID_NAMESPACE);

        if (this.data[path]) {
            // Get previous value if available
            ({ downloads, tags, description } = this.data[path]);
        }

        // Set downloads value to max of children if directory
        if (stat.isDirectory()) {
            type = "dir";

            let children = await readdir(path);
            children = children.map(child => Path.join(path, child));

            let downloadsChildren = children.map(child => {
                if (this.data[child]) return this.data[child].downloads;
                return 0;
            });

            downloads = downloadsChildren.reduce(
                (acc, val) => (acc > val ? acc : val),
                0
            );
        }

        // Update meta data
        this.data[path] = {
            name,
            description,
            downloads,
            tags,
            type,
            path,
            id
        };

        this.hashMap[id] = path;
    }

    getPathFromId(id) {
        return this.hashMap[id];
    }

    // Get meta data of path
    // Params:
    // - path: Path for which meta data is to be obtained
    //
    // Return Value:
    //  Meta data i.e. JS object
    getData(path) {
        return this.data[path];
    }

    // Returns true if metaData for path is present
    hasFile(path) {
        return this.data.hasOwnProperty(path);
    }

    // Increase downloads by 1 for path
    // Params:
    // - path: Path for which downloads has to be increased.
    incrementDownload(path) {
        this.data[path].downloads += 1;
        this.write();
    }

    // Remove path's meta data
    // Params:
    // - path: Path for which data is to be removed
    //
    // Return value:
    //  True if removal was successful
    remove(path) {
        return delete this.data[path];
    }

    // Write data to db (json file) only if last write was a certain time ago
    // Return Value:
    //  Promise resolved to true if write performed else Promise resolved to
    //  false
    write() {
        let currentTime = new Date();

        logger.silly(
            `Request to write meta data to ${
                this.dbPath
            }. Time elapsed after last write: ${currentTime -
                this.lastWrite} milliseconds`
        );

        if (currentTime - this.lastWrite > this.writeInterval) {
            return writeFile(this.dbPath, JSON.stringify(this.data)).then(
                () => {
                    logger.silly(
                        `Wrote meta data to ${this.dbPath} successfully.`
                    );

                    // Update last write
                    this.lastWrite = new Date();
                    return true;
                },
                error => {
                    logger.error(
                        `Error while writing meta data to ${
                            this.dbPath
                        }: ${error}`
                    );
                }
            );
        }

        return Promise.resolve(false);
    }

    // Get array of meta data objects
    // Return Value:
    //  Array of meta data objects for each file that is indexed
    getFileList() {
        return Object.values(this.data);
    }
}
