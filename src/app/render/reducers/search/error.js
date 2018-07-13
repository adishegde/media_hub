// Manages error state
import { CLEAR_CACHE, ERROR_SEARCH } from "app/render/actions/search";

export default function error(state = "", action) {
    switch (action.type) {
        case CLEAR_CACHE:
            return "";

        case ERROR_SEARCH:
            return action.error;

        default:
            return state;
    }
}
