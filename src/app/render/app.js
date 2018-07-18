import React from "react";
import { Switch, Route } from "react-router";
import { remote } from "electron";

import Startup from "app/render/containers/Startup";
import Home from "app/render/containers/Home";
import SearchResult from "app/render/containers/SearchResults";
import FilePage from "app/render/containers/FilePage";
import TopMenu from "app/render/containers/TopMenu";
import DownloadPage from "app/render/containers/DownloadList";

// Get the config handler exported from main process
const config = remote.getGlobal("config");

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
            <TopMenu />
            <Switch>
                <Route exact path="/" component={Home} />
                <Route path="/results" component={SearchResult} />
                <Route path="/file" component={FilePage} />
                <Route path="/downloads" component={DownloadPage} />
            </Switch>
        </div>
    );
}
