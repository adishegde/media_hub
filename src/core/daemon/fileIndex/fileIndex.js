/* Periodically updating file index. Search results are provided from this
 * index */

import * as Fs from "fs";
import * as Util from "util";
import * as Path from "path";
import Winston from "winston";

import { DEFAULT_SERVER as DEFAULT } from "../../utils/constants";

const logger = Winston.loggers.get("daemon");

// Promisify API's
const readdir = Util.promisify(Fs.readdir);
const fstat = Util.promisify(Fs.stat);

// Every node in the tree is an object of the form { path, files, dirs, ctime }
// - path: Path of directory or file (in case of leaf)
// - files: List of files the directory contains (empty in case of leaf)
// - dirs: List of subdirectories in directory (empty in case of leaf)
// - ctime: Change time as returned by fstat. Used to check if update is
// required.
class FileTree {
    // Path of root directory of tree and array of RegExp objects for matching
    // files to ignore
    constructor(rootDir, ignore) {
        logger.silly(`Constructing FileTree rooted at ${rootDir}...`);

        this.root = {
            path: rootDir,
            files: [],
            dirs: [],
            ctime: 0
        };
        this.ignore = ignore;

        // Bind methods to avoid unexpected binding errors
        this.update = this.update.bind(this);
        this.traverse = this.traverse.bind(this);
    }

    // Visits all files and directories that have been modified i.e. ctime
    // has been changed
    // Params:
    // - update: Function that is called when we find new/modified file/dir
    // - remove: Function that is called when we find removed file/dir
    update(update, remove) {
        logger.silly(`Upadting FileTree rooted at ${this.root}...`);
        this.traverse(this.root, update, remove);
    }

    // Traverses through subtree at node and calls visit for modified
    // directories and files
    // Params:
    // - node: Node to be tarversed
    // -update, remove: same as update methods params
    //
    // Return Value:
    //  A promise that is resolved when the subtree has been traversed. Promise
    //  is resolved to true if no error occurred, false otherwise
    async traverse(rootNode, update, remove) {
        logger.silly(`Starting traversal of ${rootNode.path}`);

        try {
            let stat = await fstat(rootNode.path);
            if (rootNode.ctime - stat.ctime !== 0) {
                // Directory contents have been modified
                logger.debug(`${rootNode.path} modified. Updating subtree...`);

                // Set of path of old children
                let oldChildren = new Set([
                    ...rootNode.files.map(file => file.path),
                    ...rootNode.dirs.map(dir => dir.path)
                ]);
                // Array of paths of new/current children
                let currChildrenList = (await readdir(rootNode.path)).map(
                    child => {
                        return Path.join(rootNode.path, child);
                    }
                );
                // Ignore those files whose name matches even one ignore
                // pattern
                currChildrenList = currChildrenList.filter(
                    child => !this.ignore.some(re => re.test(child))
                );
                // Set of paths of new/current children
                let currChildren = new Set(currChildrenList);

                // We do not care about modification in content of files. Thus
                // we call "update" if we find a new file and "remove" if we
                // find removed file. Renaming is one removal and one addition.

                // New children
                currChildren.forEach(child => {
                    if (!oldChildren.has(child)) update(child);
                });

                // Removed children
                oldChildren.forEach(child => {
                    if (!currChildren.has(child)) remove(child);
                });

                // Update ctime
                rootNode.ctime = stat.ctime;

                // Get stats for new children to check if they are files or
                // directories
                let statList = currChildrenList.map(child => fstat(child));
                statList = await Promise.all(statList);

                // Update file list
                let files = currChildrenList.filter((child, ind) =>
                    statList[ind].isFile()
                );
                rootNode.files = files.map(file => ({
                    path: file
                }));

                // Keep non removed dir from previous list
                let dirNodes = rootNode.dirs.filter(node =>
                    currChildren.has(node.path)
                );
                // Get new directories
                let newDirs = currChildrenList.filter(
                    (child, ind) =>
                        statList[ind].isDirectory() && !oldChildren.has(child)
                );
                // Updating dir is not as trivial as updating files since we
                // have to persist files, dirs list and ctime for subdirs
                rootNode.dirs = [
                    ...dirNodes,
                    ...newDirs.map(dir => ({
                        path: dir,
                        files: [],
                        dirs: [],
                        ctime: 0 // New dir have to udpated
                    }))
                ];
            }

            // Call traverse for all sub directories
            let subdirTrav = rootNode.dirs.map(dir => {
                return this.traverse(dir, update, remove);
            });
            await Promise.all(subdirTrav);

            update(rootNode.path);

            logger.silly(`Completed traversing subtree at ${rootNode.path}`);

            return true;
        } catch (error) {
            logger.error(`Error while traversing ${rootNode.path}: ${error}`);
            logger.error(error.stack);
            return false;
        }
    }
}

export default class FileIndex {
    // Params:
    // - metaData: Object of class MetaData.
    // - An object having properties:
    //   - share: Array of dirs that should be indexed. Assumes that only
    //   directories are passed. May result in unexpected error otherwise.
    //   - pollingInterval [optional]: The interval between each indexing in milli seconds
    constructor(
        metaData,
        {
            share: dirs,
            pollingInterval = DEFAULT.pollingInterval,
            ignore = DEFAULT.ignore
        }
    ) {
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
        this.index = this.index.bind(this);

        this.dirs = dirs;
        this.interval = pollingInterval;
        this.meta = metaData;
        this.ignore = ignore.map(exp => new RegExp(exp));

        // Forest of FileTrees corresponding to each direcotry in dirs
        this.forest = this.dirs.map(dir => new FileTree(dir, this.ignore));

        // Index once
        this.index();
    }

    // Periodically index files
    start() {
        logger.info("Starting periodic file indexing...");

        // Store timer id so that it can be cancelled afterwards if needed
        this.indexTimerId = setInterval(this.index, this.interval);
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
        logger.silly("Starting to index files...");
        var currTime = new Date();

        let treeUpdates = this.forest.map(tree =>
            tree.update(this.meta.update, this.meta.remove)
        );

        return Promise.all(treeUpdates)
            .then(() => {
                logger.silly(
                    `Done with indexing which was started at ${currTime}`
                );
            })
            .catch(error => {
                logger.error(`An error occurred while indexing: ${error}`);
            });
    }
}
