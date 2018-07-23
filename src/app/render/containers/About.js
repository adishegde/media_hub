import React from "react";
import { remote, shell } from "electron";

import AboutComponent from "app/render/components/About";
import { APP_NAME, REPO_URL } from "app/utils/constants";

const app = remote.app;

// Opens github repository in browser
function openGithubRepository() {
    shell.openExternal(REPO_URL);
}

export default function About() {
    return (
        <AboutComponent
            version={app.getVersion()}
            appName={APP_NAME}
            licence="MIT"
            onNavRepo={openGithubRepository}
        />
    );
}
