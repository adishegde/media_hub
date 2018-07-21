import React from "react";
import ReactDom from "react-dom";
import { Provider } from "react-redux";
import { MemoryRouter as Router } from "react-router";
import "semantic-ui-css/semantic.min.css";
import "app/styles/app.css";

import configureStore from "./configureStore";
import App from "app/render/containers/App";

ReactDom.render(
    <Provider store={configureStore()}>
        <Router initialEntries={["/"]} initialIndex={0}>
            <App />
        </Router>
    </Provider>,
    document.getElementById("app-root")
);
