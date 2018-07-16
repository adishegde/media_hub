/* Currently action creators send ipc messages to update/start downloads. It
 * might be better to abstract away the ipc messages to client for modularity
 * in the future. */
import { ipcRenderer } from "electron";

import { getData } from "app/render/selectors/files";
import { getInfo } from "app/render/selectors/download";
import { downloadStatus } from "app/utils/constants";

export const START_DOWNLOAD = "START_DOWNLOAD";
export const UPDATE_STATUS_DOWNLOAD = "UPDATE_STATUS_DOWNLOAD";
export const PROGRESS_DOWNLOAD = "PROGRESS_DOWNLOAD";
export const INITIATE_DOWNLOAD = "INITIATE_DOWNLOAD";

// Dispatched when the download has started
export function startDownload(url, path) {
    return {
        type: START_DOWNLOAD,
        url,
        path
    };
}

// Dispatched when the download request is sent
// The path is still not determined
function initiateDownload(url, file) {
    return {
        type: INITIATE_DOWNLOAD,
        file,
        url
    };
}

export function updateStatusDownload(url, status, error) {
    return {
        type: UPDATE_STATUS_DOWNLOAD,
        url,
        status,
        error
    };
}

export function updateProgressDownload(url, progress) {
    return {
        type: PROGRESS_DOWNLOAD,
        progress,
        url
    };
}

// Download a file a URL
export function download(url) {
    return (dispatch, getState) => {
        let state = getState();

        // Get file data from state
        let file = getData(state, url);

        // Directory download is not supported yet
        if (file.type === "dir") return;

        dispatch(initiateDownload(url, file));

        // Send download request
        ipcRenderer.send("download", url);
    };
}

// Cancel download of URL
export function cancelDownload(url) {
    return () => {
        ipcRenderer.send("download-cancel", url);
    };
}

// Toggle between pause and resume state of download
export function toggleStateDownload(url) {
    return () => {
        ipcRenderer.send("download-toggle", url);
    };
}
