/* Maintains cache of file meta data */
import { CLEAR_CACHE } from "app/render/actions/search";
import { RECEIVE_FILEDATA } from "app/render/actions/files";

// Stores file data with URL as key. Not sure if using URL as key is efficient,
// but can be easily modified if required.
export default function cache(state = {}, action) {
    switch (action.type) {
        case CLEAR_CACHE:
            return {};

        case RECEIVE_FILEDATA:
            return { ...state, [action.url]: action.data };

        default:
            return state;
    }
}
