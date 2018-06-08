/* Periodically updating file index. Search results are provided from this
 * index */

import logger from "../utils/log.js";
import * as Fs from "fs";
import * as Util from "util";
import * as Path from "path";

// Promisify API's
const readdir = Util.promisify(Fs.readdir);
const lstat = Util.promisify(Fs.lstat);

// Every node in the tree is an object of the form { path, files, dirs, ctime }
// - path: Path of directory or file (in case of leaf)
// - files: List of files the directory contains (empty in case of leaf)
// - dirs: List of subdirectories in directory (empty in case of leaf)
// - ctime: Change time as returned by lstat. Used to check if update is
// required.
class FileTree {
    // Path of root directory of tree
    constructor(rootDir) {
        logger.debug(`Constructing FileTree rooted at ${rootDir}...`);

        this.root = {
            path: rootDir,
            files: [],
            dirs: [],
            ctime: 0
        };

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
        logger.debug(`Upadting FileTree rooted at ${this.root}...`);
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
        logger.debug(`Starting traversal of ${rootNode.path}`);

        try {
            let stat = await lstat(rootNode.path);
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
                let statList = currChildrenList.map(child => lstat(child));
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

            logger.debug(`Completed traversing subtree at ${rootNode.path}`);

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
    // - dirs: Array of dirs that should be indexed. Only directories are
    // indexed.
    // - pollingInterval: The interval between each indexing in milli seconds
    // - metaData: Object of class MetaData.
    constructor(dirs, metaData, pollingInterval = 4000) {
        logger.info("Initializing FileIndex...");

        if (!dirs) {
            logger.error("Array of dirs not passed to FileIndex constructor.");
            throw new Error(
                "Array of dir not passed to FileIndex constructor."
            );
        }
        if (!metaData) {
            logger.error(
                "MetaData object not passed to FileIndex constructor."
            );
            throw new Error(
                "MetaData object not passed to FileIndex constructor."
            );
        }

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

        // Bind methods to avoid unexpected binding errors
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.index = this.index.bind(this);

        this.interval = pollingInterval;
        this.meta = metaData;

        // Forest of FileTrees corresponding to each direcotry in dirs
        this.forest = this.dirs.map(dir => new FileTree(dir));

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
        logger.debug("Starting to index files...");
        var currTime = new Date();

        let treeUpdates = this.forest.map(tree =>
            tree.update(this.meta.update, this.meta.remove)
        );

        return Promise.all(treeUpdates)
            .then(() => {
                this.meta.write();
                logger.debug(
                    `Done with indexing which was started at ${currTime}`
                );
            })
            .catch(error => {
                logger.error(`An error occurred while indexing: ${error}`);
            });
    }
}
