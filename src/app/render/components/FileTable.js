/* Table of files and directories */
import React from "react";
import * as Path from "path";
import { Table } from "semantic-ui-react";

import { videoExt, audioExt } from "app/utils/constants";
import FileIcon from "./FileIcon";

function FileItem({ file, onClick }) {
    // Creating a new onClick function here is more performant than passing a
    // bound function.
    return (
        <Table.Row
            onClick={() => {
                onClick(file);
            }}
        >
            <Table.Cell>
                <FileIcon name={file.name} />
                {file.name}
            </Table.Cell>
            <Table.Cell>{file.downloads}</Table.Cell>
        </Table.Row>
    );
}

export default function FileTable({ header, files, onFileItemClick }) {
    if (!files) return null;

    return (
        <Table celled striped size="small">
            <Table.Header>
                <Table.Row textAlign="center">
                    <Table.HeaderCell colSpan="2">{header}</Table.HeaderCell>
                </Table.Row>
                <Table.Row>
                    <Table.HeaderCell>Name</Table.HeaderCell>
                    <Table.HeaderCell>Downloads</Table.HeaderCell>
                </Table.Row>
            </Table.Header>

            <Table.Body>
                {files.map((file, ind) => (
                    <FileItem key={ind} file={file} onClick={onFileItemClick} />
                ))}
            </Table.Body>
        </Table>
    );
}
