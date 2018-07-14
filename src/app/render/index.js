import React from "react";
import ReactDom from "react-dom";
import { Provider } from "react-redux";
import { MemoryRouter as Router } from "react-router";
import "semantic-ui-css/semantic.min.css";
import "app/styles/app.css";

if (process.env.MH_ENV === "development") {
    // Enable debugging if in development mode
    require("preact/debug");
}

import configureStore from "./configureStore";
import App from "./app";

ReactDom.render(
    <Provider store={configureStore()}>
        <Router initialEntries={["/"]} initialIndex={0}>
            <App />
        </Router>
    </Provider>,
    document.body
);
