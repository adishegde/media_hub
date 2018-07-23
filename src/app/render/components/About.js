/* Information about the app */
import React from "react";
import { Header, Grid, Segment, Container, Icon } from "semantic-ui-react";

export default function About({ version, appName, licence, onNavRepo }) {
    return (
        <div className="about" style={{ height: "100%", width: "100%" }}>
            <Grid
                textAlign="center"
                style={{ height: "100%", width: "100%" }}
                verticalAlign="middle"
            >
                <Grid.Column style={{ maxWidth: "75%" }} stretched>
                    <Header as="h2" icon="info circle" content="About" />
                    <Segment>
                        <Container textAlign="left">
                            <p>
                                Name: {appName} <br />
                                Version: {version} <br />
                                Licence: {licence}
                                <br />
                                <br />
                                Like the App? Give us a{" "}
                                <Icon
                                    color="red"
                                    size="large"
                                    name="star"
                                /> on <a onClick={onNavRepo}>GitHub</a>
                            </p>
                        </Container>
                    </Segment>
                </Grid.Column>
            </Grid>
        </div>
    );
}
