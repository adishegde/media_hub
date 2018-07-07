/* Results reducer for maintaining a mapping of page to results */
import { RECEIVE_RESULTS } from "app/render/actions/search";

export default function results(state = {}, action) {
    switch (action.type) {
        case RECEIVE_RESULTS:
            return {
                ...state,
                [action.query.page]: action.results
            };
        default:
            return state;
    }
}
