/* The query reducer maintains the search string, param and page state */
import {
    START_SEARCH,
    RECEIVE_RESULTS,
    ERROR_SEARCH
} from "app/render/actions/search";

// The search state has the following properties:
//  - query: Object consisting of search, param and page. The query for which
//  the data belongs to.
//  - searching: True if results for query have not been recieved.
//  - results: Object mapping the page to the array of results.
//  - error: Non-null if error occured during search.
//
//  Due to conditional update of state regular composition can't be used.
export default function search(state = {}, action) {
    switch (action.type) {
        case START_SEARCH:
            // In case of new search replace previous query with new query
            // Also erase all responses.
            return { query: { ...action.query }, searching: true };

        case RECEIVE_RESULTS: {
            if (
                state.query.search === action.query.search &&
                state.query.param === action.query.param
            ) {
                // If results are recieved for the same query then add to state
                // else ignore
                return {
                    ...state,
                    searching: false,
                    results: {
                        ...state.results,
                        [action.query.page]: action.results
                    },
                    error: null
                };
            } else {
                return state;
            }
        }

        case ERROR_SEARCH: {
            if (
                state.query.search === action.query.search &&
                state.query.param === action.query.param
            ) {
                // If error occured for the same query then update state else
                // ignore
                return {
                    ...state,
                    searching: false,
                    error: action.error
                };
            } else {
                return state;
            }
        }

        default:
            return state;
    }
}
