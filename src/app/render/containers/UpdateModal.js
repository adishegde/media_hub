/* This container automatically displays the update model whenever there is
 * an update */
import React from "react";
import { ipcRenderer } from "electron";
import {
    ipcRendererChannels as Rch,
    ipcMainChannels as Mch
} from "app/utils/constants";
import { remote } from "electron";

import UpdateModalComponent from "app/render/components/UpdateModal";

const app = remote.app;

// Currently the update data is obtained by the main process. Also the update
// info is not being used in any other components and so it this data has not
// been associated with the redux store.
export default class UpdateModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            open: false,
            newVersion: ""
        };

        this.onConfirm = this.onConfirm.bind(this);
        this.onCancel = this.onCancel.bind(this);
    }

    componentDidMount() {
        // If update is available show modal
        ipcRenderer.on(Rch.UPDATE_AVAILABLE, info => {
            this.setState({
                open: true,
                newVersion: info.version
            });
        });
    }

    onCancel() {
        this.setState({
            open: false
        });
    }

    onConfirm() {
        this.setState({
            open: false
        });

        ipcRenderer.send(Mch.UPDATE_APP);
    }

    render() {
        let { open, newVersion } = this.state;

        return (
            <UpdateModalComponent
                open={open}
                onCancel={this.onCancel}
                onConfirm={this.onConfirm}
                newVersion={newVersion}
                currentVersion={app.getVersion()}
            />
        );
    }
}
