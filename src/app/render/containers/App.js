import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { remote } from "electron";

import { fetchAndLoadState, saveState } from "app/render/actions/index";
import AppComponent from "app/render/components/App";

// Get config object exported by main process
const config = remote.getGlobal("config");

class App extends React.Component {
    componentDidMount() {
        let { onClose, onLoad } = this.props;

        window.onbeforeunload = e => {
            // Assumed that onClose is synchronous
            onClose();
        };

        // This can be asynchronous
        onLoad();
    }

    render() {
        return (
            <AppComponent showStartup={!config._.share || !config._.incoming} />
        );
    }
}

function mapDispatchToProps(dispatch, otherprops) {
    return {
        onLoad: () => dispatch(fetchAndLoadState()),
        onClose: () => dispatch(saveState())
    };
}

export default withRouter(
    connect(
        null,
        mapDispatchToProps
    )(App)
);
