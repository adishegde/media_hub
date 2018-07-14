import { statusCodes } from "app/utils/constants";

// True if file data has been requested
export function isLoading(state, url) {
    if (!state.files || !state.files.status) return false;
    return state.files.status[url] === statusCodes.loading;
}

// True if flie data has been requested
export function isRequested(state, url) {
    if (!state.files || !state.files.status) return false;
    return state.files.status[url] !== undefined;
}

export function getError(state, url) {
    if (
        !state.files ||
        !state.files.status ||
        !(state.files.status[url] === statusCodes.error)
    )
        return "";

    return state.files.error;
}

export function getData(state, url) {
    if (!state.files || !state.files.cache) return {};

    // If undefined then return empty object
    return state.files.cache[url] || {};
}

export function getDisplayURL(state) {
    if (!state.files || !state.files.display) return "";

    // Return last element of display list
    return state.files.display[state.files.display.length - 1].url;
}

export function getDisplayList(state) {
    if (!state.files || !state.files.display) return [];

    return state.files.display;
}
