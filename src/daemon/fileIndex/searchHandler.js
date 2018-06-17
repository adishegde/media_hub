/* SearchHandler provides methods to query over meta data. It provides an
 * abstraction over how the data is represented in MetaData. Thus this class is
 * strongly coupled with MetaData.
 *
 * SearchHandler uses fuzzy search to search among the meta data.
 */

import Fuse from "fuse.js";
import * as Path from "path";
import Winston from "winston";

import { DEFAULT_SERVER as DEFAULT } from "../../utils/constants";

const logger = Winston.loggers.get("daemon");

// Returns true if path is descendent of any directory in dirList
function isChild(path, dirList) {
    return dirList.some(dir => {
        let relative = Path.relative(dir, path);

        return (
            !!relative &&
            !relative.startsWith("..") &&
            !Path.isAbsolute(relative)
        );
    });
}
export default class SearchHandler {
    // Params:
    //  - metaDataHandler: Object of class MetaData
    //  - An object having the following properties:
    //    - maxResults [optional]: Number of results to return. If less than 0 all results
    //  will be returned else specified number
    //    - share: Array of shared directories
    constructor(metaDataHandler, { maxResults = DEFAULT.maxResults, share }) {
        if (!metaDataHandler) {
            logger.error(
                "MetaData object not passed to FileIndex constructor."
            );
            throw Error("MetaData object not passed to FileIndex constructor.");
        }
        if (!share) {
            logger.error("SearchHandler: share not passed.");
            throw Error("Share not passed to SearchHandler.");
        }

        this.metaData = metaDataHandler;
        this.maxResults = maxResults;
        this.share = share;
    }

    // Fuzzy search on name of files
    // Params:
    //  - search: Search string
    searchByName(search) {
        // Options for fuzzy search
        // Many of the values are defaults picked up from the site since they
        // perform well for tested meta data.
        let options = {
            shouldSort: true,
            includeScore: false,
            threshold: 0.6,
            location: 0,
            distance: 100,
            maxPatternLength: 32,
            minMatchCharLength: 1,
            keys: ["name"]
        };

        let fuse = new Fuse(this.metaData.getFileList(), options);
        return this._filterSearches(fuse.search(search));
    }

    // Fuzzy search on tags of files
    // Params:
    //  - search: Search string
    searchByTag(search) {
        let options = {
            shouldSort: true,
            includeScore: false,
            threshold: 0.6,
            location: 0,
            distance: 100,
            maxPatternLength: 32,
            minMatchCharLength: 1,
            keys: ["tag"]
        };

        let fuse = new Fuse(this.metaData.getFileList(), options);
        return this._filterSearches(fuse.search(search));
    }

    // Weighted fuzzy search on multiple properties
    // Params:
    //  - search: Search string
    search(search) {
        // Name of file is given a weightage of 70% and its tag a weightage of
        // 30%
        let options = {
            shouldSort: true,
            includeScore: false,
            threshold: 0.6,
            location: 0,
            distance: 100,
            maxPatternLength: 32,
            minMatchCharLength: 1,
            keys: [
                {
                    name: "name",
                    weight: 0.7
                },
                {
                    name: "tags",
                    weight: 0.3
                }
            ]
        };

        let fuse = new Fuse(this.metaData.getFileList(), options);
        return this._filterSearches(fuse.search(search));
    }

    _filterSearches(results) {
        // Additional check to ensure that only those paths that are
        // shared should be returned. Else invalid search results will served
        // by UDP service
        results = results.filter(result => {
            return isChild(result.path, this.share);
        });

        if (this.maxResults < 0) return results;
        return results.slice(0, this.maxResults);
    }
}
