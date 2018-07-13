/* The query reducer maintains the search string, param and page state */
import { combineReducers } from "redux";

import { CLEAR_CACHE, START_SEARCH } from "app/render/actions/search";
import status from "./status";
import results from "./results";
import query from "./query";
import error from "./error";

// Checks if the action search string and params is same as the previous one
function isUpdateRequired(state, action) {
    // Initial state case
    if (!state.query || !state.query.search) return true;

    // If action is to clear cache or starting a search update state
    // irrespective of values
    if (action.type === CLEAR_CACHE || action.type === START_SEARCH)
        return true;

    // All action related to search have query property except CLEAR_CACHE
    // So if action.query is absent now then we can return previous state.
    if (!action.query) return false;

    return (
        state.query.search === action.query.search &&
        state.query.param === action.query.param
    );
}

// This reducer actually updates the state
const updateState = combineReducers({
    status,
    results,
    query,
    error
});

// Wrapper around the combined reducer
// Updates only if action.query is same as state.query.
export default function search(state = {}, action) {
    if (isUpdateRequired(state, action)) {
        return updateState(state, action);
    }

    // Default case. Either action is not related to search or action.query is
    // different from current query.
    return state;
}
