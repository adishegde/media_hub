/* Maintains request status of different pages */
import {
    START_SEARCH,
    RECEIVE_RESULTS,
    ERROR_SEARCH
} from "app/render/actions/search";

// Similar to an enum to define request status
export const statusCodes = {
    searching: 1,
    done: 2,
    error: 3
};

// State is a mapping from page to request status.
// If true then the page request is complete, if false then page request has
// been sent but response has not been received.
export default function status(state = {}, action) {
    switch (action.type) {
        case START_SEARCH:
            return { ...state, [action.query.page]: statusCodes.searching };

        case RECEIVE_RESULTS:
            return { ...state, [action.query.page]: statusCodes.done };

        case ERROR_SEARCH:
            return { ...state, [action.query.page]: statusCodes.error };

        default:
            return state;
    }
}
