import React from "react";
import * as Path from "path";
import { remote } from "electron";
import { Switch, Route } from "react-router";

import Startup from "app/render/containers/Startup";
import Home from "app/render/containers/Home";
import SearchResult from "app/render/containers/SearchResults";
import FileData from "app/render/containers/FileData";

import { addLogFile } from "core/utils/log";
import { CLIENT_LOG } from "app/utils/constants";

// Get the config handler exported from main process
const config = remote.getGlobal("config");
const app = remote.app;

// Add log file for client logger here so that we can use Client instance
// without explicitly adding log files everytime.
addLogFile("client", Path.join(app.getPath("userData"), CLIENT_LOG), "debug");

export default function App(props) {
    // If share is not present in config then server can't be started. Need to
    // initialize. The GUI app also requires incoming to be defined.
    if (!config._.share || !config._.incoming) {
        // Return startup component to get share and incoming paths from user.
        return <Startup />;
    }

    // Should return proper app component here.
    return (
        <div id="app" style={{ height: "100%", width: "100%" }}>
            <Switch>
                <Route exact path="/" component={Home} />
                <Route path="/results" component={SearchResult} />
                <Route path="/file" component={FileData} />
            </Switch>
        </div>
    );
}
