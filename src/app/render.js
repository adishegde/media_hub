import React from "react";
import ReactDom from "react-dom";
import { Segment, Header } from "semantic-ui-react";
import "semantic-ui-css/semantic.min.css";

ReactDom.render(
    <div id="app">
        <Segment textAlign="center" basic>
            <Header as="h1">Media Hub</Header>
            <Header as="h3">Lan based file sharing app</Header>
        </Segment>
    </div>,
    document.body
);
