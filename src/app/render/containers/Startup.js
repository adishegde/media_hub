/* This container is used to initialize the app on startup. This component
 * doesn't interact with the redux store at all since the config data is
 * obtained from main process */
import React from "react";
import { remote, ipcRenderer } from "electron";
import {
    List,
    Button,
    Grid,
    Header,
    Segment,
    Icon,
    Input,
    Checkbox,
    Message
} from "semantic-ui-react";
import { withRouter } from "react-router";

// The config should be obtained from the export of main process. It is not
// stored in the redux store to keep the config file as the single source of
// truth
const config = remote.getGlobal("config");
const dialog = remote.dialog;

class Startup extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            share: new Set(),
            incoming: "",
            shareIncoming: true,
            error: ""
        };

        this.onShareAdd = this.onShareAdd.bind(this);
        this.onShareRemove = this.onShareRemove.bind(this);
        this.onIncomingChange = this.onIncomingChange.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
    }

    render() {
        let { share, incoming, shareIncoming, error } = this.state;

        let shareItems = [];
        share.forEach((path, ind) => {
            shareItems.push(
                <List.Item key={ind}>
                    <List.Content floated="right">
                        <Button
                            icon
                            negative
                            size="mini"
                            path={path}
                            onClick={this.onShareRemove}
                        >
                            <Icon name="minus" />
                        </Button>
                    </List.Content>
                    <List.Content>{path}</List.Content>
                </List.Item>
            );
        });

        let errorMessage = null;
        if (error) {
            errorMessage = (
                <Message error size="small">
                    <Message.Header>{error}</Message.Header>
                </Message>
            );
        }

        return (
            <div className="startup" style={{ height: "100%", width: "100%" }}>
                <Grid
                    textAlign="center"
                    style={{ height: "100%", width: "100%" }}
                    verticalAlign="middle"
                >
                    <Grid.Column style={{ maxWidth: "75%" }} stretched>
                        <Header as="h2" color="teal" textAlign="center">
                            App Setup
                        </Header>
                        <Segment
                            style={{ maxHeight: "40%", width: "100%" }}
                            textAlign="center"
                        >
                            <Header as="h4">Directories to be shared</Header>
                            {shareItems.length !== 0 ? (
                                <Segment
                                    style={{
                                        maxHeight: "95px",
                                        overflow: "auto"
                                    }}
                                    inverted
                                    color="teal"
                                >
                                    <List divided inverted>
                                        {shareItems}
                                    </List>
                                </Segment>
                            ) : null}
                            <Button onClick={this.onShareAdd} icon color="teal">
                                <Icon name="plus" />
                            </Button>
                        </Segment>
                        <Segment style={{ height: "25%" }} attached="bottom">
                            <Header as="h4">Download directory</Header>
                            <Input
                                action={{
                                    color: "teal",
                                    labelPosition: "right",
                                    icon: "plus",
                                    content: "Browse",
                                    onClick: this.onIncomingChange
                                }}
                                value={incoming}
                                placeholder="Downloaded files will be saved here..."
                                style={{ width: "90%", overflow: "auto" }}
                            />
                            <Segment basic>
                                <Checkbox
                                    onClick={this.onIncomingChange}
                                    label="Share download directory (Highly Recommended)"
                                    checked={shareIncoming}
                                />
                            </Segment>
                        </Segment>
                        <Button
                            positive
                            onClick={this.onConfirm}
                            icon
                            labelPosition="left"
                        >
                            <Icon name="check" />
                            Confirm
                        </Button>
                        {errorMessage}
                    </Grid.Column>
                </Grid>
            </div>
        );
    }

    onShareRemove(event, { path }) {
        this.setState(({ share }) => {
            share.delete(path);
            return {
                share
            };
        });
    }

    onShareAdd() {
        dialog.showOpenDialog(
            {
                properties: ["openDirectory", "multiSelections"]
            },
            selected => {
                // In case nothing is selected
                if (!selected) return;

                this.setState(({ share }) => {
                    selected.forEach(path => {
                        share.add(path);
                    });

                    return {
                        share
                    };
                });
            }
        );
    }

    onIncomingChange(event, { type }) {
        if (type === "checkbox") {
            this.setState(({ shareIncoming }) => ({
                shareIncoming: !shareIncoming
            }));
            return;
        }

        let selected = dialog.showOpenDialog(
            {
                properties: ["openDirectory"]
            },
            selected => {
                // In case nothing is selected
                if (!selected) return;

                selected = selected[0];

                this.setState({
                    incoming: selected
                });
            }
        );
    }

    onConfirm() {
        let { share, incoming, shareIncoming } = this.state;

        if (share.size === 0) {
            this.setState({
                error: "At least one directory must be shared"
            });
        } else if (!incoming) {
            this.setState({
                error: "Download directory must be specified"
            });
        } else {
            // Add incoming to share if option has been selected
            if (shareIncoming) share.add(incoming);

            share = Array.from(share);

            // Add configuration to config
            ipcRenderer.send("update-config", {
                share,
                incoming
            });

            // Redirect to home page
            this.props.history.push("/");
        }
    }
}

export default withRouter(Startup);
