/* Table of files and directories */
import React from "react";
import * as Path from "path";
import { Table, Icon } from "semantic-ui-react";

import { videoExt, audioExt } from "app/utils/constants";

function FileItem({ file, onClick }) {
    // Assume folder by default
    let icon = "folder";
    let ext = Path.extname(file.name);

    // If video then display video icon. Check for video files is based on some
    // common extension.
    if (videoExt.includes(ext)) icon = "video";
    else if (audioExt.includes(ext)) icon = "music";
    else if (ext) icon = "file outline";

    // Creating a new onClick function here is more performant than passing a
    // bound function.
    return (
        <Table.Row
            onClick={() => {
                onClick(file.url);
            }}
        >
            <Table.Cell>
                <Icon name={icon} />
                {file.name}
            </Table.Cell>
            <Table.Cell>{file.downloads}</Table.Cell>
        </Table.Row>
    );
}

export default function FileTable({ header, files, onFileItemClick }) {
    if (!files) return null;

    return (
        <Table celled stripped size="small">
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
