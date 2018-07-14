/* Table of files and directories */
import React from "react";
import * as Path from "path";
import { Table, Icon } from "semantic-ui-react";

// List of video extensions
// Not meant to be exhaustive. Just the most common ones supported by the
// browser
const videoExt = [
    ".mkv",
    ".ogv",
    ".ogg",
    ".mp4",
    ".m4p",
    ".m4v",
    ".webm",
    ".mpg",
    ".mp2",
    ".mpeg",
    ".mpe",
    ".mpv"
];

const audioExt = [".mp3", ".mpa", ".aac", ".oga", ".wav"];

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
