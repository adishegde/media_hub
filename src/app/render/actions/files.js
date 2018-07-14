import Client from "core/client/client";
import { remote } from "electron";

import {
    isRequested,
    getError,
    isLoading,
    getData
} from "app/render/selectors/files";

const config = remote.getGlobal("config");

export const REQUEST_FILEDATA = "REQUEST_FILEDATA";
export const RECEIVE_FILEDATA = "RECEIVE_FILEDATA";
export const ERROR_FILEDATA = "ERROR_FILEDATA";

function requestFileData(url) {
    return {
        type: REQUEST_FILEDATA,
        url
    };
}

function receiveFileData(url, data) {
    return {
        type: RECEIVE_FILEDATA,
        url,
        data
    };
}

function errorFileData(url, error) {
    return {
        type: ERROR_FILEDATA,
        url,
        error
    };
}

// Fetches file data asynchronously
function fetchFileData(url) {
    return async dispatch => {
        try {
            // Starting new request
            dispatch(requestFileData(url));

            // Create new client from config data
            let client = new Client(config._);

            // Fetch meta data
            let data = await client.getMeta(url);

            // If directory then fetch it's content also. It will be stored
            // along with meta data.
            if (data.type === "dir") {
                data.children = (await client.getDirectoryInfo(url)).children;
            }

            dispatch(receiveFileData(url, data));
        } catch (err) {
            dispatch(errorFileData(url, err));
        }
    };
}

// Will display file with given URL i.e. it will update the display state.
// It is different from fetchFileData because it uses cached data if
// present. It is the responsibility of the calling component to redirect to
// the correct URL.
export function displayFile(url) {
    return (dispatch, getState) => {
        let state = getState();

        // If file data has been requested and no error occurred then don't
        // fetch
        if (isRequested(state, url) && !getError(state, url)) {
            // We emulate a request and receive using cached data
            // this ensures that state is updated properly without explicit
            // changes
            dispatch(requestFileData(url));

            // If file data request was sent but not received then don't
            // dispatch receiveFileData
            if (!isLoading(state, url)) {
                let data = getData(state, url);

                dispatch(receiveFileData(url, data));
            }
        } else {
            // cache miss, need to request file data
            dispatch(fetchFileData(url));
        }
    };
}
