/* Maintains list of downloaded items */
import {
    START_DOWNLOAD,
    UPDATE_STATUS_DOWNLOAD,
    PROGRESS_DOWNLOAD,
    INITIATE_DOWNLOAD
} from "app/render/actions/download";
import { downloadStatus } from "app/utils/constants";

export default function downloads(state = {}, action) {
    switch (action.type) {
        case INITIATE_DOWNLOAD:
            return {
                ...state,
                [action.url]: {
                    file: action.file,
                    url: action.url,
                    status: downloadStatus.downloading,
                    progress: 0
                }
            };

        case START_DOWNLOAD:
            return {
                ...state,
                [action.url]: {
                    ...state[action.url],
                    path: action.path
                }
            };

        case PROGRESS_DOWNLOAD:
            return {
                ...state,
                [action.url]: {
                    ...state[action.url],
                    progress: action.progress
                }
            };

        case UPDATE_STATUS_DOWNLOAD:
            return {
                ...state,
                [action.url]: {
                    ...state[action.url],
                    status: action.status,
                    error: action.error
                }
            };

        default:
            return state;
    }
}
