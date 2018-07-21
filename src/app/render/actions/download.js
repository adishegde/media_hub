import uuid from "uuid/v4";

import { getData } from "app/render/selectors/files";
import Client from "app/utils/client";
import { events } from "app/utils/fileDownloader";
import { downloadStatus as status } from "app/utils/constants";

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
        id,
        date: new Date().toString()
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

        // Due to the current flow of the app, files can be downloaded only from
        // the file data page. This means that the filedata should be available
        // when downloading.
        // Generate new download id
        let id = uuid();

        dispatch(initiateDownload(id, url, file));

        let downloadFunc = Client.downloadFile;

        if (file.type === "dir") {
            downloadFunc = Client.downloadDirectory;
        }

        downloadFunc(url, id, {
            onStart: path => {
                dispatch(startDownload(id, path));
            },
            onProgress: ratio => {
                // NOTE: Progress events are emitted rapidly. If performance
                // problems occur then we'll need to add a time based check
                // here.
                dispatch(updateProgressDownload(id, ratio));
            },
            onError: err => {
                dispatch(updateStatusDownload(id, status.error, err));
            },
            onFinish: errList => {
                // Directory download passes a list of individual file errors
                dispatch(updateStatusDownload(id, status.finished, errList));
            }
        });
    };
}

// Cancel download of URL
export function cancelDownload(id) {
    return dispatch => {
        Client.cancelDownload(id, () => {
            dispatch(updateStatusDownload(id, status.cancelled));
        });
    };
}
