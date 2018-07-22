import React from "react";
import { Switch, Route } from "react-router";

import Startup from "app/render/containers/Startup";
import Home from "app/render/containers/Home";
import SearchResult from "app/render/containers/SearchResults";
import FilePage from "app/render/containers/FilePage";
import TopMenu from "app/render/containers/TopMenu";
import DownloadPage from "app/render/containers/DownloadList";
import UpdateModal from "app/render/containers/UpdateModal";

// Currently Startup is being used as the settings page. This will be changed
// when more options are added to GUI.
export default function App({ showStartup }) {
    // If share is not present in config then server can't be started. Need to
    // initialize. The GUI app also requires incoming to be defined.
    if (showStartup) {
        // Return startup component to get share and incoming paths from user.
        return <Startup />;
    }

    // Should return proper app component here.
    return (
        <div id="app" style={{ height: "100%", width: "100%" }}>
            <TopMenu />
            <UpdateModal />
            <Switch>
                <Route exact path="/" component={Home} />
                <Route path="/results" component={SearchResult} />
                <Route path="/file" component={FilePage} />
                <Route path="/downloads" component={DownloadPage} />
                <Route path="/settings" component={Startup} />
            </Switch>
        </div>
    );
}
