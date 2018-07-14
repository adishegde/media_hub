/* A simple list of files along with icons */
import React from "react";
import * as Path from "path";
import { List, Icon } from "semantic-ui-react";

import { videoExt, audioExt } from "app/utils/constants";

function FileItem({ file }) {
    // Assume folder by default
    let icon = "folder";
    let ext = Path.extname(file.name);

    // If video then display video icon. Check for video files is based on some
    // common extension.
    if (videoExt.includes(ext)) icon = "video";
    else if (audioExt.includes(ext)) icon = "music";
    else if (ext) icon = "file outline";

    return (
        <List.Item>
            <List.Icon name={icon} />
            {file.name}
        </List.Item>
    );
}

export default function FileTable({ header, files, onFileItemClick }) {
    if (!files) return null;

    return (
        <List divided relaxed>
            {files.map((file, ind) => <FileItem key={ind} file={file} />)}
        </List>
    );
}
