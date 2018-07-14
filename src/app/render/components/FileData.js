/* Display file data */
import React from "react";
import { Table, Segment, Button } from "semantic-ui-react";

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

// Minimal UI
export default function FileData({
    data: { name, type, tags, downloads, description, size },
    loading,
    onBackClick
}) {
    return (
        <Segment basic>
            <Button onClick={onBackClick}>Back</Button>
            <Segment loading={loading}>
                <Table definition>
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
                            <Table.Cell>{tags}</Table.Cell>
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
