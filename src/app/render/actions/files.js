import Client from "app/utils/client";
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

// Pos denotes how the display list should be changed
// Refer reducer for exact behaviour
function requestFileData({ url, name }, pos) {
    return {
        type: REQUEST_FILEDATA,
        url,
        name,
        pos
    };
}

function receiveFileData({ url, name }, data) {
    return {
        type: RECEIVE_FILEDATA,
        url,
        name,
        data
    };
}

function errorFileData({ url, name }, error) {
    return {
        type: ERROR_FILEDATA,
        url,
        name,
        error
    };
}

// Fetches file data asynchronously
function fetchFileData(file, pos) {
    return async dispatch => {
        try {
            // Starting new request
            dispatch(requestFileData(file, pos));

            // Create new client from config data
            let client = new Client(config._);

            // Fetch meta data
            let data = await client.getMeta(file.url);

            // If directory then fetch it's content also. It will be stored
            // along with meta data.
            if (data.type === "dir") {
                data.children = (await client.getDirectoryInfo(
                    file.url
                )).children;
            }

            dispatch(receiveFileData(file, data));
        } catch (err) {
            dispatch(errorFileData(file, err));
        }
    };
}

// Will display file with given URL i.e. it will update the display state.
// It is different from fetchFileData because it uses cached data if
// present. It is the responsibility of the calling component to redirect to
// the correct app URL.
//
// Param:
//  - file: The file object containing url and name.
//  - pos: Check files reducer for more info.
export function displayFile(file, pos) {
    let url = file.url;

    return (dispatch, getState) => {
        let state = getState();

        // If file data has been requested and no error occurred then don't
        // fetch
        if (isRequested(state, url) && !getError(state, url)) {
            // We emulate a request and receive using cached data
            // this ensures that state is updated properly without explicit
            // changes
            dispatch(requestFileData(file, pos));

            // If file data request was sent but not received then don't
            // dispatch receiveFileData
            if (!isLoading(state, url)) {
                let data = getData(state, url);

                dispatch(receiveFileData(file, data));
            }
        } else {
            // cache miss, need to request file data
            dispatch(fetchFileData(file, pos));
        }
    };
}
