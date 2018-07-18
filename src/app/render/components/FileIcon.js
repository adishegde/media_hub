/* Sets appropriate file icon depending on file icon */
import React from "react";
import { Icon } from "semantic-ui-react";
import * as Path from "path";

import { videoExt, audioExt } from "app/utils/constants";

export default function FileIcon({ name, as }) {
    // Assume folder by default
    let icon = "folder";
    let ext = Path.extname(name);

    // If video then display video icon. Check for video files is based on some
    // common extension.
    if (videoExt.includes(ext)) icon = "video";
    else if (audioExt.includes(ext)) icon = "music";
    else if (ext) icon = "file outline";

    if (!as) as = Icon;

    // react wants upper case for component names
    let As = as;

    return <As name={icon} />;
}
