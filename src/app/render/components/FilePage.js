/* Component to display file data */
import React from "react";
import { Segment, Grid, Message, Header } from "semantic-ui-react";

import FileData from "app/render/containers/FileData";
import Breadcrumb from "app/render/containers/FilePageBreadcrumb";
import DirList from "app/render/containers/DirList";

export default function FilePage({ error }) {
    let content = null;

    if (error) {
        // If error then display message
        content = <Message error>{error}</Message>;
    } else {
        content = (
            <div style={{ height: "100%", width: "100%" }}>
                <DirList />
                <FileData />
            </div>
        );
    }

    return (
        <div className="file-data" style={{ height: "100%", width: "100%" }}>
            <Segment textAlign="center" style={{ maxHeight: "20%" }}>
                <Breadcrumb />
            </Segment>
            <Grid
                textAlign="center"
                style={{ height: "100%", width: "100%" }}
                verticalAlign="middle"
            >
                <Grid.Column style={{ maxWidth: "75%", minHeight: "100%" }}>
                    {content}
                </Grid.Column>
            </Grid>
        </div>
    );
}
