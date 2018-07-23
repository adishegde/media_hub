import React from "react";
import { remote } from "electron";
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

const dialog = remote.dialog;

// This component is responsible for all the UI state. It also displays error
// in case a required field is empty. But it passes the input data to the
// onConfirm prop.
export default class Startup extends React.Component {
    constructor(props) {
        super(props);

        let { incoming, share, selfRespond } = this.props.config;

        let shareIncoming = true;
        if (share) shareIncoming = share.includes(incoming);

        this.state = {
            share: new Set(share),
            incoming: incoming || "",
            shareIncoming,
            error: "",
            selfRespond: selfRespond || false
        };

        this.onShareAdd = this.onShareAdd.bind(this);
        this.onShareRemove = this.onShareRemove.bind(this);
        this.onIncomingChange = this.onIncomingChange.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
    }

    render() {
        let { share, incoming, shareIncoming, error, selfRespond } = this.state;

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
                                    name="shareIncoming"
                                />
                                <Checkbox
                                    onClick={this.onIncomingChange}
                                    label="Search results should include my files also (Recommended for testing)"
                                    checked={selfRespond}
                                    name="selfRespond"
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

    onIncomingChange(event, { type, name }) {
        if (type === "checkbox") {
            this.setState(props => ({
                [name]: !props[name]
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
        let { share, incoming, shareIncoming, selfRespond } = this.state;

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
            this.props.onConfirm({
                share,
                incoming,
                selfRespond
            });
        }
    }
}
