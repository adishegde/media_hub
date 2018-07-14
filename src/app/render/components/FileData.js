/* Display file data */
import React from "react";
import { Table, Segment, Label, Header } from "semantic-ui-react";

import FileList from "./FileList";

// Takes size in bytes and returns string with right units to make it more
// readable
function formatBytes(bytes) {
    let suf = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];

    if (bytes === 0) {
        return `0 ${suf[0]}`;
    }

    let place = Math.floor(Math.log2(bytes) / 10);
    let num = (bytes / Math.pow(1024, place)).toFixed(2);

    return `${num} ${suf[place]}`;
}

// A table for displaying file data
export default function FileData({
    data: { name, type, tags, downloads, description, size, children },
    loading
}) {
    let tagLabels = "-";

    if (tags && tags.length !== 0) {
        tagLabels = tags.map((tag, index) => (
            <Label tag key={index}>
                {tag}
            </Label>
        ));
    }

    let fileList = null;
    if (children) {
        fileList = (
            <Segment>
                <Header as="h4">{`Contents of ${name}`}</Header>
                <Segment
                    textAlign="left"
                    basic
                    style={{ maxHeight: "30vh", overflowY: "auto" }}
                >
                    <FileList files={children} />
                </Segment>
            </Segment>
        );
    }

    return (
        <Segment basic loading={loading}>
            {fileList}
            <Segment>
                <Header as="h4">{`${
                    type === "file" ? "File" : "Directory"
                } Details`}</Header>
                <Segment basic style={{ maxHeight: "40vh", overflowY: "auto" }}>
                    <Table definition compact>
                        <Table.Body>
                            <Table.Row>
                                <Table.Cell>Name</Table.Cell>
                                <Table.Cell>{name}</Table.Cell>
                            </Table.Row>
                            <Table.Row>
                                <Table.Cell>Type</Table.Cell>
                                <Table.Cell>{type}</Table.Cell>
                            </Table.Row>
                            <Table.Row>
                                <Table.Cell>Tags</Table.Cell>
                                <Table.Cell>{tagLabels}</Table.Cell>
                            </Table.Row>
                            <Table.Row>
                                <Table.Cell>Downloads</Table.Cell>
                                <Table.Cell>{downloads}</Table.Cell>
                            </Table.Row>
                            <Table.Row>
                                <Table.Cell>Description</Table.Cell>
                                <Table.Cell>{description || "-"}</Table.Cell>
                            </Table.Row>
                            <Table.Row>
                                <Table.Cell>Size</Table.Cell>
                                <Table.Cell>{formatBytes(size)}</Table.Cell>
                            </Table.Row>
                        </Table.Body>
                    </Table>
                </Segment>
            </Segment>
        </Segment>
    );
}
