import { ipcRenderer } from "electron";
import { connect } from "react-redux";
import { withRouter } from "react-router";

import { ipcMainChannels as Mch } from "app/utils/constants";
import StartupComponent from "app/render/components/Startup";

function mapStateToProps(state) {
    return {
        config: state.config
    };
}

function mapDispatchToProps(dispatch, { history }) {
    return {
        onConfirm: update => {
            ipcRenderer.send(Mch.CONFIG_UPDATE, update);
            history.push("/");
        }
    };
}

export default withRouter(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )(StartupComponent)
);
