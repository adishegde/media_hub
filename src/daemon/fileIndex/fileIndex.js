/* Periodically updating file index. Search results are provided from this
 * index */

import logger from "../utils/log.js";
import * as Fs from "fs";
import * as Util from "util";
import * as Path from "path";

// Promisify API's
const readdir = Util.promisify(Fs.readdir);
const lstat = Util.promisify(Fs.lstat);

// TODO: Improve datastructure for index after considering storage of metadata
// TODO: Index only when needed. Check mtime and ctime through lstat.
export class FileIndex {
    // Params:
    // - dirs: Array of dirs that should be indexed. Only directories are
    // indexed.
    //
    // - indexInterval: The interval between each indexing in milli seconds
    constructor(dirs, indexInterval) {
        logger.info("Initializing FileIndex...");

        // Filter out directories from array of paths
        this.dirs = dirs.filter(path => {
            try {
                // Synchronous since this is initialization
                // Initial setup should be completed before accetpting requests
                let stat = Fs.lstatSync(path);
                if (!stat.isDirectory()) {
                    logger.error(
                        `${path} will not be indexed since it is not a directory.`
                    );

                    return false;
                }
            } catch (error) {
                // If error is thrown then dir at path does not exist
                logger.error(
                    `${path} will not be indexed since it does not exist.`
                );
                return false;
            }

            return true;
        });

        this.interval = indexInterval;

        // files is the array of indexed files
        // Assigned an empty array to avoid null/undefined errors
        this.files = [];

        this.index();
        // Start indexing periodically
        // However start initially waits till time period is over before
        // indexing first
        this.start();
    }

    // Periodically index files
    start() {
        logger.info("Starting periodic file indexing...");

        // Store timer id so that it can be cancelled afterwards if needed
        this.indexTimerId = setInterval(this.index.bind(this), this.interval);
    }

    // Stop indexing files
    stop() {
        clearInterval(this.indexTimerId);

        logger.info("Stopped periodic file indexing.");
    }

    // Index files in dirs.
    // Return Value:
    //  A promise that is resolved when the index is successfully completed
    index() {
        logger.info("Starting to index files...");

        let dirsIndexes = this.dirs.map(path => this.indexDir(path));

        return Promise.all(dirsIndexes).then(indexes => {
            // Merge all file paths from all directories into one array
            // and update index
            this.files = indexes.reduce((acc, index) => acc.concat(index), []);
        });
    }

    // Index a directory.
    // Params:
    // - dir: The absolute path of the directory to be indexed
    //
    // Return Value:
    //  A promise that is resolved to array of paths of each file in the
    //  directory and its subdirectories
    async indexDir(dir) {
        let currDirIndex = [];

        logger.info(`Indexing ${dir} ...`);

        try {
            // Get content of directory asynchronously
            let fileNames = await readdir(dir);
            let filePaths = fileNames.map(fileName => Path.join(dir, fileName));

            // Call lstat asynchronously for each path to check if its a
            // directory
            let statList = filePaths.map(path => lstat(path));
            // Continue when stat for all paths have been recieved
            statList = await Promise.all(statList);

            let recursiveIndex = [];

            // Recursively index and add promises to recursiveIndex
            statList.forEach((stat, ind) => {
                if (stat.isDirectory()) {
                    recursiveIndex.push(this.indexDir(filePaths[ind]));
                }

                if (stat.isFile() || stat.isDirectory()) {
                    // Add path to index if it is a file or directory
                    currDirIndex.push(filePaths[ind]);
                }
            });

            // If a promise is rejected, empty array is returned. No need of
            // error handling here
            recursiveIndex = await Promise.all(recursiveIndex);

            recursiveIndex.forEach(index => {
                currDirIndex.push(...index);
            });

            logger.info(`Finished indexing ${dir}`);

            return currDirIndex;
        } catch (error) {
            logger.error(`Error occured while indexing ${dir}: ${error}`);
            logger.error(`Aborting indexing of ${dir}`);

            // Return empty array
            return [];
        }
    }
}
