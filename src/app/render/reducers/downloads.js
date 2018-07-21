/* Maintains list of downloaded items */
import {
    START_DOWNLOAD,
    UPDATE_STATUS_DOWNLOAD,
    PROGRESS_DOWNLOAD,
    INITIATE_DOWNLOAD
} from "app/render/actions/download";
import { downloadStatus as status } from "app/utils/constants";

export default function downloads(state = {}, action) {
    switch (action.type) {
        case INITIATE_DOWNLOAD:
            return {
                ...state,
                [action.id]: {
                    file: action.file,
                    url: action.url,
                    id: action.id,
                    status: status.idle,
                    date: action.date,
                    progress: 0
                }
            };

        case START_DOWNLOAD:
            return {
                ...state,
                [action.id]: {
                    ...state[action.id],
                    status: status.downloading,
                    path: action.path
                }
            };

        case PROGRESS_DOWNLOAD:
            return {
                ...state,
                [action.id]: {
                    ...state[action.id],
                    progress: action.progress
                }
            };

        case UPDATE_STATUS_DOWNLOAD:
            return {
                ...state,
                [action.id]: {
                    ...state[action.id],
                    status: action.status,
                    error: action.error
                }
            };

        default:
            return state;
    }
}
