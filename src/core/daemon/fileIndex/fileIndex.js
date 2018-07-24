/* Periodically updating file index. Search results are provided from this
 * index */

import Winston from "winston";
import Chokidar from "chokidar";

import { DEFAULT_SERVER as DEFAULT } from "../../utils/constants";

const logger = Winston.loggers.get("daemon");

export default class FileIndex {
    // Params:
    // - metaData: Object of class MetaData.
    // - An object having properties:
    //   - share: Array of dirs that should be indexed. Assumes that only
    //   directories are passed. May result in unexpected error otherwise.
    constructor(metaData, { share: dirs, ignore = DEFAULT.ignore }) {
        logger.info("Initializing FileIndex...");

        if (!dirs) {
            logger.error("FileIndex: Array of dirs not passed");
            throw new Error(
                "Array of dir not passed to FileIndex constructor."
            );
        }
        if (!metaData) {
            logger.error("FileIndex: MetaData object not passed.");
            throw new Error(
                "MetaData object not passed to FileIndex constructor."
            );
        }
        if (!Array.isArray(ignore)) {
            logger.error(
                `FileIndex: ignore is not an array. It's value is ${ignore}`
            );
            throw Error("Ignore is not an array");
        }

        // Bind methods to avoid unexpected binding errors
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);

        this.dirs = dirs;
        this.meta = metaData;
        this.ignore = ignore.map(exp => new RegExp(exp));
    }

    // Periodically index files
    start() {
        logger.info("Starting periodic file indexing...");

        // Start only if not already running
        if (!this.running) {
            this.running = true;

            this.watcher = Chokidar.watch(this.dirs, {
                ignored: path => this.ignore.some(re => re.test(path)),
                awaitWriteFinish: true,
                ignoreInitial: true
            })
                .on("add", this.meta.update)
                .on("addDir", this.meta.update)
                .on("change", this.meta.update)
                .on("unlink", this.meta.remove)
                .on("unlinkDir", this.meta.remove)
                .on("error", err => {
                    logger.info(`FileIndex: ${err}`);
                })
                .on("ready", () => {
                    logger.info("FileIndex ready");
                    this.meta.initialize(this.watcher.getWatched()).then(() => {
                        logger.info("Meta data initialized");
                    });
                });

            // Return true if server was actually started
            return Promise.resolve(true);
        }

        return Promise.resolve(false);
    }

    // Stop indexing files
    stop() {
        if (this.running) {
            this.running = false;

            this.watcher.close();

            logger.info("Stopped periodic file indexing.");
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    }
}
