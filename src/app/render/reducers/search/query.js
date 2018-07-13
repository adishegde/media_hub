// Maintains state of currently displayed query and result page
import { START_SEARCH } from "app/render/actions/search";

export default function query(state = {}, action) {
    switch (action.type) {
        case START_SEARCH:
            return { ...action.query };

        default:
            return state;
    }
}
