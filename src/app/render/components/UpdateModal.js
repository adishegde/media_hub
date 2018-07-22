/* Modal to show new update when available */
import React from "react";
import { Modal, Header, Button, Icon } from "semantic-ui-react";

export default function UpdateModal({
    open,
    onCancel,
    onConfirm,
    newVersion,
    currentVersion
}) {
    return (
        <Modal open={open} onClose={onCancel} basic size="small">
            <Header icon="cloud download" content="Update Available" />
            <Modal.Content>
                <h3>
                    There is an update available for your operating system.
                    <br />Would you like to update now?
                </h3>
                <h4>
                    {`Current version: ${currentVersion}`} <br />
                    {`Update: ${newVersion}`}
                </h4>
                <h5>This will restart your application.</h5>
            </Modal.Content>
            <Modal.Actions>
                <Button color="red" onClick={onCancel} inverted>
                    <Icon name="cancel" /> Cancel
                </Button>
                <Button color="green" onClick={onConfirm} inverted>
                    <Icon name="checkmark" />Update
                </Button>
            </Modal.Actions>
        </Modal>
    );
}
