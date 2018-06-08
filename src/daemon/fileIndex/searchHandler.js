/* SearchHandler provides methods to query over meta data. It provides an
 * abstraction over how the data is represented in MetaData. Thus this class is
 * strongly coupled with MetaData.
 *
 * SearchHandler uses fuzzy search to search among the meta data.
 */

import Fuse from "fuse.js";

export default class SearchHandler {
    // Params:
    //  - metaDataHandler: Object of class MetaData
    //  - maxResults: Number of results to return. If less than 0 all results
    //  will be returned else specified number
    constructor(metaDataHandler, maxResults = 10) {
        if (!metaDataHandler) {
            logger.error(
                "MetaData object not passed to FileIndex constructor."
            );
            throw Error("MetaData object not passed to FileIndex constructor.");
        }

        this.metaData = metaDataHandler;
        this.maxResults = maxResults;
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

        let result = fuse.search(search);

        if (this.maxResults < 0) return results;
        return result.splice(0, this.maxResults);
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

        let result = fuse.search(search);

        if (this.maxResults < 0) return results;
        return result.splice(0, this.maxResults);
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

        let result = fuse.search(search);

        if (this.maxResults < 0) return result;
        return result.splice(0, this.maxResults);
    }
}
