/* Exports search related action creators */
import Client from "core/client/client";
import { remote } from "electron";

// config data is exported by main process
const config = remote.getGlobal("config");

export const START_SEARCH = "START_SEARCH";
export const RECEIVE_RESULTS = "RECEIVE_RESULTS";
export const ERROR_SEARCH = "ERROR_SEARCH";

// Used to denote the beginning of a search query
// query contains search, param and page
function startSearch(query) {
    return {
        type: START_SEARCH,
        query
    };
}

// Used to denote the end of search query
// query contains search, param and page
function receiveResults(query, results) {
    return {
        type: RECEIVE_RESULTS,
        query,
        results
    };
}

// Dispatched if error occured during search
function errorSearch(query, error) {
    return {
        type: ERROR_SEARCH,
        query,
        error
    };
}

// query contains search, param and page
export function search(query) {
    return dispatch => {
        dispatch(startSearch(query));

        // Create new client form config data
        let client = new Client(config._);
        client
            .search(query.search, query.page, query.param)
            .then(results => {
                dispatch(receiveResults(query, results));
            })
            .catch(err => {
                dispatch(errorSearch(query, error));
            });
    };
}
