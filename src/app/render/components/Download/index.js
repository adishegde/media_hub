import React from "react";
import { Item, Grid, Segment, Message } from "semantic-ui-react";

import DItem from "./Item.js";

export default function DownloadList({ downloads, onCancel, onToggle }) {
    let mainContent;

    if (!downloads || downloads.length === 0) {
        mainContent = (
            <Message
                info
                header="You don't seem to have downloaded any files"
                list={[
                    "Search for a file",
                    "Click on a result to view the file info page",
                    "Click on the download button at the bottom of the page to download the file / directory"
                ]}
            />
        );
    } else {
        let items = downloads.map(download => (
            <DItem
                {...download}
                key={download.id}
                onCancel={onCancel}
                onToggle={onToggle}
            />
        ));

        mainContent = (
            <Item.Group style={{ maxHeight: "80vh", overflowY: "auto" }}>
                {items}
            </Item.Group>
        );
    }

    return (
        <div className="downloads" style={{ height: "100%", width: "100%" }}>
            <Grid
                textAlign="center"
                style={{ height: "100%", width: "100%" }}
                verticalAlign="middle"
            >
                <Grid.Column style={{ maxWidth: "75%" }} stretched>
                    <Segment style={{ height: "100%" }} textAlign="left">
                        {mainContent}
                    </Segment>
                </Grid.Column>
            </Grid>
        </div>
    );
}
