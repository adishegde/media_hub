/* Functions exported here take the entire state as argument */
import { statusCodes } from "app/render/reducers/search/status";

export function isSearching(state, page) {
    if (!state.search || !state.search.status) return false;
    return state.search.status[page] === statusCodes.searching;
}

export function isSearchPageRequested(state, page) {
    if (!state.search || !state.search.status) return false;
    return state.search.status[page] !== undefined;
}

export function getSearchError(state, page) {
    if (
        !state.search ||
        !state.search.status ||
        !(state.search.status[page] === statusCodes.error)
    )
        return "";

    return state.search.error;
}

export function getCurrentPage(state) {
    if (!state.search || !state.search.query) return 1;
    return state.search.query.page;
}

export function getSearchResult(state, page) {
    if (!state.search || !state.search.results) return [];

    let res = state.search.results[page];
    if (!res) return [];
    return res;
}

export function getSearchQuery(state) {
    return state.search.query;
}
