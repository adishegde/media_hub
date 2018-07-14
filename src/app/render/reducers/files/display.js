/* State of currently displayed file */
import { REQUEST_FILEDATA } from "app/render/actions/files";

export default function display(state = [], action) {
    switch (action.type) {
        case REQUEST_FILEDATA: {
            let { name, url } = action;

            if (action.pos < 0) {
                // If pos is negative then we append to display list
                return [...state, { url, name }];
            } else if (action.pos < state.length) {
                // If pos if valid index then we trim the list to the particular
                // index
                return state.slice(0, action.pos + 1);
            }
            return [{ url, name }];
        }

        default:
            return state;
    }
}
