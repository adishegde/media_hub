import React from "react";
import ReactDom from "react-dom";
import { MemoryRouter as Router } from "react-router";
import "semantic-ui-css/semantic.min.css";
import "app/styles/app.css";

import App from "./app";

ReactDom.render(
    <div id="app" style={{ height: "100%", width: "100%" }}>
        <Router initialEntries={["/"]} initialIndex={0}>
            <App />
        </Router>
    </div>,
    document.body
);
