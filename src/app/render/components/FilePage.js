/* Component to display file data */
import React from "react";
import { Segment, Grid, Message } from "semantic-ui-react";

import FileData from "app/render/containers/FileData";

export default function FilePage({ error }) {
    let content = null;

    if (error) {
        // If error then display message
        content = <Message error>{error}</Message>;
    } else {
        content = <FileData />;
    }

    return (
        <div className="file-data" style={{ height: "100%", width: "100%" }}>
            <Grid
                textAlign="center"
                style={{ height: "100%", width: "100%" }}
                verticalAlign="middle"
            >
                <Grid.Column style={{ maxWidth: "75%" }} stretched>
                    {content}
                </Grid.Column>
            </Grid>
        </div>
    );
}
