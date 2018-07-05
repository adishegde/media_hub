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
import { isChild } from "../../utils/functions";

const logger = Winston.loggers.get("daemon");

export default class SearchHandler {
    // Params:
    //  - metaDataHandler: Object of class MetaData
    //  - An object having the following properties:
    //    - maxResults [optional]: Number of results to return. If less than 0 all results
    //  will be returned else specified number
    //    - share: Array of shared directories
    constructor(
        metaDataHandler,
        { maxResults = DEFAULT.maxResults, share, ignore = DEFAULT.ignore }
    ) {
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
        if (!Array.isArray(ignore)) {
            logger.error(
                `SearchHandler: ignore is not an array. It's value is ${ignore}`
            );
            throw Error("Ignore is not an array");
        }

        this.metaData = metaDataHandler;
        this.maxResults = maxResults;
        this.share = share;
        this.ignore = ignore.map(exp => new RegExp(exp));
    }

    // Weighted fuzzy search on multiple properties
    // Params:
    //  - search: Search string
    search(search, param = "default", page = 1) {
        // Name of file is given a weightage of 70% and its tag a weightage of
        // 30%
        // Options for matching both tags and name
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

        // In case of different params change options appropriately
        if (param === "tag") {
            options.keys = ["tags"];
        } else if (param === "name") {
            options.keys = ["name"];
        }

        return this.metaData.getFileList().then(files => {
            let fuse = new Fuse(files, options);
            let results = this._filterSearches(fuse.search(search));

            if (this.maxResults < 0) return results;
            // Return correct page
            else
                return results.slice(
                    (page - 1) * this.maxResults,
                    page * this.maxResults
                );
        });
    }

    _filterSearches(results) {
        // Additional check to ensure that only those paths that are
        // shared should be returned. Else invalid search results will served
        // by UDP service
        results = results.filter(result => {
            return isChild(result.path, this.share);
        });

        // Remove results that match even one ignore pattern
        results = results.filter(
            result => !this.ignore.some(re => re.test(result.path))
        );

        return results;
    }
}
