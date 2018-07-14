/* State of currently displayed file */
import { REQUEST_FILEDATA } from "app/render/actions/files";

export default function display(state = "", action) {
    switch (action.type) {
        case REQUEST_FILEDATA:
            return action.url;

        default:
            return state;
    }
}
