/* Display file data */
import React from "react";
import { Table, Segment, Label, Header } from "semantic-ui-react";

import { formatBytes } from "app/utils/functions";

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

    return (
        <Segment loading={loading}>
            <Header as="h4">{`${
                type === "file" ? "File" : "Directory"
            } Details`}</Header>
            <Segment basic style={{ maxHeight: "30vh", overflowY: "auto" }}>
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
    );
}
