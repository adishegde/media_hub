import React from "react";
import * as Fs from "fs";
import * as Path from "path";
import { remote } from "electron";

import Startup from "app/render/containers/startup";

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
    return <p>Media Hub Home</p>;
}
