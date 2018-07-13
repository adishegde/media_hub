/* Results reducer for maintaining a mapping of page to results */
import { RECEIVE_RESULTS, CLEAR_CACHE } from "app/render/actions/search";

export default function results(state = {}, action) {
    switch (action.type) {
        case CLEAR_CACHE:
            return {};

        case RECEIVE_RESULTS:
            return {
                ...state,
                [action.query.page]: action.results
            };

        default:
            return state;
    }
}
