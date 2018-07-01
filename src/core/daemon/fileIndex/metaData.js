/* Maintaining meta data for indexed files. */

import * as Fs from "fs";
import * as Util from "util";
import * as Path from "path";
import uuid from "uuid/v5";
import Winston from "winston";

import {
    UUID_NAMESPACE,
    DEFAULT_SERVER as DEFAULT
} from "../../utils/constants";

const logger = Winston.loggers.get("daemon");

let writeFile = Util.promisify(Fs.writeFile);
let fstat = Util.promisify(Fs.stat);
let readdir = Util.promisify(Fs.readdir);

/* Each path has the following data:
 * - name: Name of directory or file.
 * - downloads: In case of a file, the number of times it has been downloaded.
 *   and in case of a directory, the maximum of downloads of it's children.
 * - description: Description of file/directory.
 * - tags: Tags classifying the file or directory.
 * - type: File or Directory.
 * - path: Path to directory or file.
 * - size: Size of file or directory
 * - id: The uuid for corresponding to the path
*/

export default class MetaData {
    // Params
    // - An object having params:
    //   - db [optional]: A level db instance
    constructor(db) {
        if (!db) {
            logger.error("MetaData: No db instance passed.");
            throw Error("No db instance passed.");
        }

        this.db = db;

        // Bind methods to avoid unexpected binding errors
        this.getData = this.getData.bind(this);
        this.getFileList = this.getFileList.bind(this);
        this.getPathFromId = this.getPathFromId.bind(this);
        this.hasFile = this.hasFile.bind(this);
        this.remove = this.remove.bind(this);
        this.update = this.update.bind(this);
        this.updateDownload = this.updateDownload.bind(this);
    }

    // Update data of path.
    // Params:
    // - path: Path whose meta data is to be updated
    //
    // Return Value:
    //  A promise that is resolved when the update is complete
    async update(path) {
        try {
            let stat = await fstat(path);

            let name = Path.basename(path);
            let downloads = 0;
            let description = "";
            let tags = [];
            let type = "file";
            let id = uuid(path, UUID_NAMESPACE);
            let size = stat.size;

            try {
                // Extract old values if they exist
                ({ downloads, tags, description } = await this.db.get(id));
            } catch (err) {
                // If error occured for a reason other than key not beign
                // present then rethrow error
                if (!err.notFound) throw err;
            }

            // Set downloads value to max of children if directory
            if (stat.isDirectory()) {
                type = "dir";
                size = 0;

                let children = await readdir(path);
                children = children.map(child => Path.join(path, child));

                // Calculate size of directory and max downloads.
                let childData = await Promise.all(
                    children.map(child =>
                        this.db
                            .get(uuid(child, UUID_NAMESPACE))
                            .then(({ downloads, size }) => ({
                                downloads,
                                size
                            }))
                            .catch(err => {
                                // error shouldn't stop the update. Just return
                                // defaults
                                // Silly level because error occurs for all
                                // ignored files
                                logger.silly(
                                    `MetaData.update: Error fetching child data for ${child}: ${err}`
                                );
                                return {
                                    downloads: 0,
                                    size: 0
                                };
                            })
                    )
                );

                // Compute directory's download and size
                childData.forEach(child => {
                    let chdownloads = child.downloads;
                    downloads =
                        downloads > chdownloads ? downloads : chdownloads;
                    size += child.size;
                });
            }

            // Update meta data
            return this.db.put(id, {
                name,
                description,
                downloads,
                tags,
                type,
                path,
                size,
                id
            });
        } catch (err) {
            logger.error(`MetaData.update: ${err}`);
            logger.debug(`MetaData.update: ${err.stack}`);
        }
    }

    getPathFromId(id) {
        return this.db.get(id).then(({ path }) => path);
    }

    // Get meta data of path
    // Params:
    // - path: Path for which meta data is to be obtained
    //
    // Return Value:
    //  Meta data i.e. JS object
    getData(path) {
        return this.db.get(uuid(path, UUID_NAMESPACE));
    }

    // Returns true if metaData for path is present
    hasFile(path) {
        return this.db
            .get(uuid(path, UUID_NAMESPACE))
            .then(() => true, () => false);
    }

    // Increase downloads by delta for path
    // Params:
    // - path: Path for which downloads has to be increased.
    // - delta [optional]: Amount by which to increase download. Default is 1.
    updateDownload(path, delta = 1) {
        let id = uuid(path, UUID_NAMESPACE);

        return this.db.get(id).then(data => {
            data.downloads += delta;
            return this.db.put(id, data);
        });
    }

    // Remove path's meta data
    // Params:
    // - path: Path for which data is to be removed
    //
    // Return value:
    //  True if removal was successful
    remove(path) {
        return this.db.del(uuid(path, UUID_NAMESPACE));
    }

    // Get array of meta data objects
    // Return Value:
    //  Array of meta data objects for each file that is indexed
    getFileList() {
        let dataList = [];

        return new Promise((resolve, reject) => {
            // db creates a readstream of values
            // We extract values and place it into an array
            this.db
                .createValueStream()
                .on("data", data => {
                    dataList.push(data);
                })
                .on("end", () => {
                    resolve(dataList);
                })
                .on("error", () => {
                    logger.debug(`MetaData.FileList: ${err}`);
                    resolve(dataList);
                });
        });
    }
}
