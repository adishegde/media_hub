import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { ipcRenderer } from "electron";

import { fetchAndLoadState, saveState } from "app/render/actions/index";
import { receiveConfig } from "app/render/actions/config";
import AppComponent from "app/render/components/App";
import { ipcRendererChannels as Rch } from "app/utils/constants";

class App extends React.Component {
    componentDidMount() {
        let { onClose, onLoad, onConfigUpdate } = this.props;

        window.onbeforeunload = e => {
            // Assumed that onClose is synchronous
            onClose();
        };

        // This can be asynchronous
        onLoad();

        // If config was updated we need to update state
        ipcRenderer.on(Rch.CONFIG_UPDATED, (e, config) => {
            onConfigUpdate(config);
        });
    }

    render() {
        let { showStartup } = this.props;

        return <AppComponent showStartup={showStartup} />;
    }
}

function mapDispatchToProps(dispatch, otherprops) {
    return {
        onLoad: () => dispatch(fetchAndLoadState()),
        onClose: () => dispatch(saveState()),
        onConfigUpdate: config => dispatch(receiveConfig(config))
    };
}

function mapStateToProps(state) {
    let config = state.config;

    return {
        showStartup: !config.incoming || !config.share
    };
}

export default withRouter(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )(App)
);
