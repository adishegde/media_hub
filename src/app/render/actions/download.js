/* Currently action creators send ipc messages to update/start downloads. It
 * might be better to abstract away the ipc messages to client for modularity
 * in the future. */
import { ipcRenderer } from "electron";
import uuid from "uuid/v4";

import { getData } from "app/render/selectors/files";
import { downloadStatus, ipcMainChannels as Mch } from "app/utils/constants";

export const START_DOWNLOAD = "START_DOWNLOAD";
export const UPDATE_STATUS_DOWNLOAD = "UPDATE_STATUS_DOWNLOAD";
export const PROGRESS_DOWNLOAD = "PROGRESS_DOWNLOAD";
export const INITIATE_DOWNLOAD = "INITIATE_DOWNLOAD";

// Dispatched when the download has started
export function startDownload(id, path) {
    return {
        type: START_DOWNLOAD,
        id,
        path
    };
}

// Dispatched when the download request is sent
// The path is still not determined
function initiateDownload(id, url, file) {
    return {
        type: INITIATE_DOWNLOAD,
        file,
        url,
        id
    };
}

export function updateStatusDownload(id, status, error) {
    return {
        type: UPDATE_STATUS_DOWNLOAD,
        id,
        status,
        error
    };
}

export function updateProgressDownload(id, progress) {
    return {
        type: PROGRESS_DOWNLOAD,
        progress,
        id
    };
}

// Download a file a URL
export function download(url) {
    return (dispatch, getState) => {
        let state = getState();

        // Get file data from state
        let file = getData(state, url);

        // Directory download is not supported yet
        //
        // Due to the current flow of the app, files can be downloaded only from
        // the file data page. This means that the filedata should be available
        // when downloading.
        if (file.type === "file") {
            // Generate new download id
            let id = uuid();

            dispatch(initiateDownload(id, url, file));

            // Send download request
            ipcRenderer.send(Mch.DL_START, url, id);
        }
    };
}

// Cancel download of URL
export function cancelDownload(id) {
    return () => {
        ipcRenderer.send(Mch.DL_CANCEL, id);
    };
}

// Toggle between pause and resume state of download
export function toggleStateDownload(id) {
    return () => {
        ipcRenderer.send(Mch.DL_TOGGLE, id);
    };
}
