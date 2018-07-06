/* The query reducer maintains the search string, param and page state */
import {
    START_SEARCH,
    RECEIVE_RESULTS,
    ERROR_SEARCH
} from "app/render/actions/search";
import statusReducer from "./status";
import resultsReducer from "./results";

// Checks if the action search string and params is same as the previous one
function isUpdateRequired(state, action) {
    // Initial state case
    if (!state.query || !state.query.search) return true;

    return (
        state.query.search === action.query.search &&
        state.query.param === action.query.param
    );
}

// The search state has the following properties:
//  - query: Object consisting of search, param and page. The query for which
//  the data belongs to.
//  - status: Maintains mapping of pages to their request status
//  - results: Object mapping the page to the array of results.
//  - error: Non-null if error occured during search.
export default function search(state = {}, action) {
    switch (action.type) {
        case START_SEARCH:
            // If search is for different page of same search string
            // and param then retain results and status state.
            if (isUpdateRequired(state, action)) {
                return {
                    ...state,
                    query: { ...action.query },
                    status: statusReducer(state.status, action),
                    results: resultsReducer(state.results, action)
                };
            } else {
                // In case of new search replace previous query with new query
                // Also erase all responses.
                return {
                    query: { ...action.query },
                    status: statusReducer(undefined, action)
                };
            }

        case RECEIVE_RESULTS: {
            if (isUpdateRequired(state, action)) {
                // If results are recieved for the same query then add to state
                return {
                    ...state,
                    status: statusReducer(state.status, action),
                    results: resultsReducer(state.results, action)
                };
            } else {
                // If for some other query then ignore response
                return state;
            }
        }

        case ERROR_SEARCH: {
            if (isUpdateRequired(state, action)) {
                // If error occured for the same query then update state else
                // ignore
                return {
                    ...state,
                    status: statusReducer(state.status, action),
                    results: resultsReducer(state.results, action),
                    error: action.error
                };
            } else {
                return state;
            }
        }

        default:
            return {
                ...state,
                status: statusReducer(state.status, action),
                results: resultsReducer(state.results, action)
            };
    }
}
