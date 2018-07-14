/* Manages status of file data requests */
import { CLEAR_CACHE } from "app/render/actions/search";
import {
    RECEIVE_FILEDATA,
    ERROR_FILEDATA,
    REQUEST_FILEDATA
} from "app/render/actions/files";
import { statusCodes } from "app/utils/constants";

// Stores status code with URL as key. Not sure if using URL as key is
// efficient but can be easily modified if required.
export default function status(state = {}, action) {
    switch (action.type) {
        case CLEAR_CACHE:
            return {};

        case REQUEST_FILEDATA:
            return { ...state, [action.url]: statusCodes.loading };

        case ERROR_FILEDATA:
            return { ...state, [action.url]: statusCodes.error };

        case RECEIVE_FILEDATA:
            return { ...state, [action.url]: statusCodes.done };

        default:
            return state;
    }
}
