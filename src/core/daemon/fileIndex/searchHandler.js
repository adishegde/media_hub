/* SearchHandler provides methods to query over meta data. It provides an
 * abstraction over how the data is represented in MetaData. Thus this class is
 * strongly coupled with MetaData.
 *
 * SearchHandler uses fuzzy search to search among the meta data.
 */

import Fuse from "fuse.js";
import * as Path from "path";
import Winston from "winston";

import {
    DEFAULT_SERVER as DEFAULT,
    SEARCH_PARAMS
} from "../../utils/constants";
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
    search(search, param = SEARCH_PARAMS.names, page = 1) {
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
            minMatchCharLength: 1
        };

        // Invalid values are ignored and names is assumed
        if (param !== SEARCH_PARAMS.tags) param = SEARCH_PARAMS.names;

        return this.metaData.getIndexList(param).then(list => {
            let fuse = new Fuse(list, options);

            // The metadata now maintains an index in memory which is refreshed
            // whenever the server restarts. This means we don't need to check
            // for validity of the file paths.
            let results = fuse.search(search);

            // fuse.search returns an array of indices. We need to map it to
            // the items
            results = results.map(ind => list[ind]);

            if (this.maxResults < 0)
                return this.metaData.getDataFromIndex(results, param);
            // Return correct page
            else
                return this.metaData.getDataFromIndex(
                    results,
                    param,
                    this.maxResults,
                    page
                );
        });
    }
}
