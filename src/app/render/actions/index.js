/* Actions pertaining to the entire store */
import Winston from "winston";

import { filterCompleted } from "app/render/selectors/download";

const logger = Winston.loggers.get("client");

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
        let state = getState();

        // The data that will be persisted. Add more properties here if needed.
        let persistedState = { downloads: filterCompleted(state) };

        console.log(persistedState);
        try {
            // Store state to local storage
            window.localStorage.setItem(
                "reduxState",
                JSON.stringify(persistedState)
            );
        } catch (err) {
            logger.debug(`Actions.index: ${err}`);
        }
    };
}

// Fetches state from local storage. This could have been use in configure store
// but it has been made an action so that we can easily use async functions also
// if needed in the future.
export function fetchAndLoadState() {
    return dispatch => {
        try {
            let state = window.localStorage.getItem("reduxState");
            state = JSON.parse(state);

            dispatch(loadState(state));
        } catch (err) {
            // Ignore error
        }
    };
}
