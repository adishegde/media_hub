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

let store = configureStore();

// Listen to IPC messages. Not sure if this is the best place to add listeners,
// but it sure is the easiest way.
ipcRenderer.on("download-started", (e, url, path) => {
    store.dispatch(startDownload(url, path));
});

ipcRenderer.on("download-cancelled", (e, url) => {
    store.dispatch(updateStatusDownload(url, downloadStatus.cancelled));
});

ipcRenderer.on("download-progress", (e, url, ratio) => {
    store.dispatch(updateProgressDownload(url, ratio));
});

ipcRenderer.on("download-complete", (e, url) => {
    store.dispatch(updateStatusDownload(url, downloadStatus.done));
});

ipcRenderer.on("download-toggle", (e, url, state) => {
    // NOTE: There is some level of hardcoding here wrt to the state values.
    // This needs to be abstracted.
    if (state === "resumed")
        store.dispatch(updateStatusDownload(url, downloadStatus.downloading));
    else if (state === "paused")
        store.dispatch(updateStatusDownload(url, downloadStatus.paused));
});

ipcRenderer.on("download-error", (e, url, error) => {
    store.dispatch(updateStatusDownload(url, downloadStatus.error, error));
});

ReactDom.render(
    <Provider store={store}>
        <Router initialEntries={["/"]} initialIndex={0}>
            <App />
        </Router>
    </Provider>,
    document.getElementById("app-root")
);
