/* Actions pertaining to the entire store */
import { ipcRenderer } from "electron";

import {
    ipcMainChannels as Mch,
    ipcRendererChannels as Rch
} from "app/utils/constants";
import { filterCompleted } from "app/render/selectors/download";

export const LOAD_STATE = "LOAD_STATE";

function loadState(state) {
    return {
        state,
        type: LOAD_STATE
    };
}

// Save state to db
export function saveState() {
    return (dispatch, getState) => {
        return new Promise((resolve, reject) => {
            let state = getState();

            // The data that will be persisted. Add more properties here if needed.
            let persistedState = { downloads: filterCompleted(state) };

            ipcRenderer.send(Mch.SAVE_STATE, persistedState);

            ipcRenderer.once(Rch.SAVED_STATE, () => {
                resolve();
            });
        });
    };
}

export function fetchAndLoadState() {
    return dispatch => {
        ipcRenderer.send(Mch.GET_STATE);

        ipcRenderer.once(Rch.GET_STATE, (e, state) => {
            dispatch(loadState(state));
        });
    };
}
