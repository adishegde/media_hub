import { statusCodes } from "app/utils/constants";

export function isSearching(state, page) {
    if (!state.search || !state.search.status) return false;
    return state.search.status[page] === statusCodes.loading;
}

export function isPageRequested(state, page) {
    if (!state.search || !state.search.status) return false;
    return state.search.status[page] !== undefined;
}

export function getError(state, page) {
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

export function getResult(state, page) {
    if (!state.search || !state.search.results) return [];

    let res = state.search.results[page];
    if (!res) return [];
    return res;
}

export function getQuery(state) {
    return state.search.query;
}
