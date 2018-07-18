/* A simple list of files along with icons */
import React from "react";
import * as Path from "path";
import { List, Icon, Segment } from "semantic-ui-react";

import FileIcon from "./FileIcon";

function FileItem({ file, onClick }) {
    return (
        <List.Item
            onClick={() => {
                onClick(file);
            }}
        >
            <FileIcon name={file.name} as={List.Icon} />
            {file.name}
        </List.Item>
    );
}

export default function FileList({ files, loading, onFileItemClick, style }) {
    if (!files) return null;

    return (
        <Segment basic loading={loading} style={style} textAlign="left">
            <List divided relaxed>
                {files.map((file, ind) => (
                    <FileItem key={ind} file={file} onClick={onFileItemClick} />
                ))}
            </List>
        </Segment>
    );
}
