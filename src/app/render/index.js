import React from "react";
import ReactDom from "react-dom";
import { Provider } from "react-redux";
import { MemoryRouter as Router } from "react-router";
import { ipcRenderer } from "electron";
import "semantic-ui-css/semantic.min.css";
import "app/styles/app.css";

import configureStore from "./configureStore";
import App from "./app";
import {
    startDownload,
    updateStatusDownload,
    updateProgressDownload
} from "app/render/actions/download";
import { downloadStatus } from "app/utils/constants";
import { ipcRendererChannels as Rch } from "app/utils/constants";

let store = configureStore();

// Listen to IPC messages. Not sure if this is the best place to add listeners,
// but it sure is the easiest way.
ipcRenderer.on(Rch.DL_START, (e, id, path) => {
    store.dispatch(startDownload(id, path));
});

ipcRenderer.on(Rch.DL_CANCEL, (e, id) => {
    store.dispatch(updateStatusDownload(id, downloadStatus.cancelled));
});

ipcRenderer.on(Rch.DL_PROGRESS, (e, id, ratio) => {
    store.dispatch(updateProgressDownload(id, ratio));
});

ipcRenderer.on(Rch.DL_COMPLETE, (e, id) => {
    store.dispatch(updateStatusDownload(id, downloadStatus.done));
});

ipcRenderer.on(Rch.DL_TOGGLE, (e, id, state) => {
    // NOTE: There is some level of hardcoding here wrt to the state values.
    if (state === "resumed")
        store.dispatch(updateStatusDownload(id, downloadStatus.downloading));
    else if (state === "paused")
        store.dispatch(updateStatusDownload(id, downloadStatus.paused));
});

ipcRenderer.on(Rch.DL_ERROR, (e, id, error) => {
    store.dispatch(updateStatusDownload(id, downloadStatus.error, error));
});

ReactDom.render(
    <Provider store={store}>
        <Router initialEntries={["/"]} initialIndex={0}>
            <App />
        </Router>
    </Provider>,
    document.getElementById("app-root")
);
