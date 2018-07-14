/* Manages error state for file data */
import { ERROR_FILEDATA } from "app/render/actions/files";
import { CLEAR_CACHE } from "app/render/actions/search";

export default function error(state = "", action) {
    switch (action.type) {
        case CLEAR_CACHE:
            return "";

        case ERROR_FILEDATA:
            return action.error;

        default:
            return state;
    }
}
