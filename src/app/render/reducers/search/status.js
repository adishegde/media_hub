/* Maintains request status of different pages */
import {
    START_SEARCH,
    RECEIVE_RESULTS,
    ERROR_SEARCH,
    CLEAR_CACHE
} from "app/render/actions/search";
import { statusCodes } from "app/utils/constants";

// State is a mapping from page to request status.
// If true then the page request is complete, if false then page request has
// been sent but response has not been received.
export default function status(state = {}, action) {
    switch (action.type) {
        case CLEAR_CACHE:
            return {};

        case START_SEARCH:
            return { ...state, [action.query.page]: statusCodes.loading };

        case RECEIVE_RESULTS:
            return { ...state, [action.query.page]: statusCodes.done };

        case ERROR_SEARCH:
            return { ...state, [action.query.page]: statusCodes.error };

        default:
            return state;
    }
}
