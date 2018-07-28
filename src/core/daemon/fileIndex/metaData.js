/* Maintaining meta data for indexed files. */

import * as Fs from "fs";
import * as Util from "util";
import * as Path from "path";
import uuid from "uuid/v5";
import Winston from "winston";

import {
    UUID_NAMESPACE,
    DEFAULT_SERVER as DEFAULT,
    SEARCH_PARAMS
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
    constructor(db, { ignore = DEFAULT.ignore }) {
        if (!db) {
            logger.error("MetaData: No db instance passed.");
            throw Error("No db instance passed.");
        }
        if (!Array.isArray(ignore)) {
            logger.error(
                `MetaData: ignore is not an array. It's value is ${ignore}`
            );
            throw Error("Ignore is not an array");
        }

        this.db = db;
        this.ignore = ignore.map(exp => new RegExp(exp));

        // We index ids based on names and their tags
        //
        // Using Object.create(null) creates an object with an empty prototype.
        // This means that functions like "toString" and "valueOf" will not be
        // present. Thus it's a pure dictionary.
        //
        // This will avoid any errors due to some file names or tags
        // colliding with the properties.
        this.names = Object.create(null);
        this.tags = Object.create(null);

        // Bind methods to avoid unexpected binding errors
        // Since meta data is used in other classes heavily
        this.getDataFromId = this.getDataFromId.bind(this);
        this.getDataFromPath = this.getDataFromPath.bind(this);
        this.getIndexList = this.getIndexList.bind(this);
        this.remove = this.remove.bind(this);
        this.update = this.update.bind(this);
        this.updateDownload = this.updateDownload.bind(this);
        this._updatePath = this._updatePath.bind(this);
        this.initialize = this.initialize.bind(this);
        this.getDataFromIndex = this.getDataFromIndex.bind(this);
    }

    // Initializes db with the list of watched files.
    // Calling update when chokidar is initialized takes a toll on
    // performance. We thus use this to initialize database only.
    //
    // Param:
    //  - watched: The object returned by chokidar's getWatched.
    initialize(watched) {
        // Update the contents single directory
        let initDir = (path, children) => {
            // First update all children
            let promises = children.map(child =>
                this._updatePath(Path.join(path, child))
            );

            // Return a promise that is resolved when all children have
            // been updated. This promise can't be rejected since
            // _updatePath doesn't propogate errors
            return Promise.all(promises);
        };

        // The keys of watched are the list of all directories being wathced
        let dirList = Object.keys(watched);

        // We want the list of directories to ordered from inner most to outermost.
        // Since each path is an absolute path (dependency on chokidar returns watched)
        // it is enough to order it by decreasing key length
        dirList.sort((a, b) => b.length - a.length);

        // We initialize each directory after the previous initialization
        // has completed
        return dirList.reduce(
            (prev, dir) =>
                prev.then(() => {
                    return initDir(dir, watched[dir]);
                }),
            Promise.resolve() // Initial value is a resolved promise
        );
    }

    // Update data of path. Also traverses up the file tree to update parents
    // Params:
    // - path: Path whose meta data is to be updated
    //
    // Return Value:
    //  A promise that is resolved when the update is complete
    async update(path) {
        await this._updatePath(path);

        let parentPath = Path.dirname(path);

        try {
            let data = await this.db.get(uuid(parentPath, UUID_NAMESPACE));

            // Update parent directory. i.e. we traverse up the tree
            // Fileindexer calls udpate for the specific path changed. This
            // means that we are responsible for updating parents.
            //
            // NOTE: Updating parents shouldn't take a toll on performance.
            // If it does we can optimize it by sending the child that was
            // updated as a parameter.
            await this.update(parentPath);
        } catch (err) {
            // Err occurs if there is an error updating parentPath
            // or if parentPath is not there in db. In both cases
            // ignore
        }
    }

    // Updates data of a given path
    //
    // Param:
    //  - path: The path of the file/dir whose data is to be updated
    //
    // Return Value:
    //  A promise that is resolved when the db has been updated or rejected
    //  if an error occurred.
    async _updatePath(path) {
        try {
            let stat = await fstat(path);

            let parsedPath = Path.parse(path);

            let name = parsedPath.base;
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
                // If error occured for a reason other than key not being
                // present then rethrow error
                if (!err.notFound) throw err;
            }

            // Set downloads value to max of children if directory and also
            // Calculate size of directory
            if (stat.isDirectory()) {
                type = "dir";
                size = 0;

                let children = await readdir(path);
                children = children.map(child => Path.join(path, child));
                // Filter out all children which should be ignored. This leads
                // to fewer negatives on db get
                children = children.filter(
                    child => !this.ignore.some(re => re.test(child))
                );

                // Each db get returns a Promise. We collect all these in an
                // array and then wait for all of them to resolve.
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

            // Add path to index
            if (!this.names[parsedPath.name])
                this.names[parsedPath.name] = new Set();
            this.names[parsedPath.name].add(id);

            tags.forEach(tag => {
                if (!this.tags[tag]) this.tags[tag] = new Set();
                this.tags[tag].add(id);
            });

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
            logger.error(`MetaData._updatePath: ${err}`);
            logger.debug(`MetaData._updatePath: ${err.stack}`);
        }
    }

    getDataFromId(id) {
        return this.db.get(id);
    }

    // Get meta data of path
    // Params:
    // - path: Path for which meta data is to be obtained
    //
    // Return Value:
    //  A promise that resolves to the data. Promise is rejected if it doesn't
    //  exist.
    getDataFromPath(path) {
        return this.db.get(uuid(path, UUID_NAMESPACE));
    }

    // Increase downloads by delta for path
    // Params:
    // - path: Path for which downloads has to be increased.
    // - delta [optional]: Amount by which to increase download. Default is 1.
    updateDownload(path, delta = 1) {
        let id = uuid(path, UUID_NAMESPACE);

        return this.db
            .get(id)
            .then(data => {
                data.downloads += delta;
                return this.db.put(id, data);
            })
            .then(retVal => {
                // We also need to update parent's download value.
                // NOTE: If this is might cause perfomance problems.
                let parentPath = Path.dirname(path);
                this.db
                    .get(uuid(parentPath, UUID_NAMESPACE))
                    .then(() => {
                        this.update(parentPath);
                    })
                    .catch(() => {
                        // Ignore error. If parent path is not there in db then ignore
                    });
            });
    }

    // Remove path's meta data
    // Params:
    // - path: Path for which data is to be removed
    //
    // Return value:
    //  A promise that resolve true if it was successful
    remove(path) {
        let id = uuid(path, UUID_NAMESPACE);

        return this.db
            .get(id)
            .then(({ tags }) => {
                let name = Path.parse(path).name;

                //First remove from index

                // There shoudn't be a case where the file is not indexed but a
                // remove event is emitted but having a check gives safety
                // nevertheless
                if (this.names[name]) this.names[name].delete(id);
                tags.forEach(tag => {
                    if (this.tags[tag]) this.tags[tag].delete(id);
                });

                return this.db.del(id);
            })
            .then(
                () => true,
                err => {
                    // Ignore any error. Their mostly caused by the key not
                    // existing.
                    logger.debug(`MetaData.remove: ${err}`);
                    return false;
                }
            );
    }

    // Get array of all unique index values
    //
    // Param:
    //  - param: A valid search param as exported by utils/constants
    //
    // Return Value:
    //  Array of file names (without extensions)
    getIndexList(param) {
        // A promise is not required here but wrapping it in one allows us to
        // easily modify it later if needed
        let list = this.names;
        if (param === SEARCH_PARAMS.tags) list = this.tags;

        return Promise.resolve(Object.keys(list));
    }

    // Get the list of meta data from array of items (as returned by
    // getNameList or getTagList). The first `limit` items will be returned
    // in the order of the items provided in `list`.
    //
    // Param:
    //  - names: Array of names for which meta data will be provided
    //  - index: Either 'names' or 'tags'. The index against which data will be
    //  retrieved. Invalid options default to name
    //  - limit [optional]: Number of items to retrieve. If not given all items are returned
    //  - page [optional]: Multiple of limit to retrieve
    //
    // Return Value:
    //  - Promise that is resolved to array of meta data objects
    getDataFromIndex(list, index, limit, page = 1) {
        if (!list || list.length === 0) return Promise.resolve([]);

        // Convert the index name to index list
        if (index === SEARCH_PARAMS.tags) index = this.tags;
        else index = this.names;

        // List of id's for which data should be retrieved
        let idlist = [];

        if (!limit) {
            // Add all ids incase limit is not defined
            list.forEach(item => {
                idlist.push(...index[item]);
            });
        } else {
            // The item number (not index) from which we have to start adding
            let start = (page - 1) * limit + 1;

            let current = 0; // Keep track of how many elements are over
            let i = 0; // Used for iteration

            while (i < list.length && current < start) {
                current += index[list[i++]].size;
            }

            // Page is greater than number of results
            // Return empty array
            if (current < start) return Promise.resolve([]);

            // current is greater than start which means a few elements from
            // i - 1 might have to be added
            idlist.push(...index[list[i - 1]]);
            // Retain items from number "start"
            idlist = idlist.splice(idlist.length - current + start - 1);

            // Add next limit elements
            while (i < list.length && idlist.length < limit) {
                idlist.push(...index[list[i++]]);
            }

            // If idlist has less than limit elements then then the list is not
            // affected
            idlist = idlist.splice(0, limit);
        }

        // Get list of meta data objects. If it doesn't exist then return false
        // If it doesn't exist then the result might have less than limit
        // values but the expected behaviour is that it contains all ids.
        return Promise.all(
            idlist.map(id => this.db.get(id).catch(() => false))
        ).then(mdlist => mdlist.filter(data => data));
    }
}
