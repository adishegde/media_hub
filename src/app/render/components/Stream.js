/* Provides controls to stream audio and video */
import React from "react";
import { Segment } from "semantic-ui-react";
import * as Path from "path";

import { videoExt, audioExt } from "app/utils/constants";

export default function Stream({ url, file }) {
    // If url is not defined then controls won't work
    // We need file name to be defined to get extension
    if (!url || !file.name) return null;

    let ext = Path.extname(file.name);

    if (videoExt.includes(ext)) {
        return (
            <div>
                <video
                    src={url}
                    autoPlay
                    controls
                    style={{
                        width: "50vw",
                        height: "40vh",
                        left: "0px",
                        top: "0px"
                    }}
                    controlsList="nodownload"
                >
                    This video type is not supported.
                </video>
            </div>
        );
    } else if (audioExt.includes(ext)) {
        return (
            <div>
                <audio src={url} controls autoPlay controlsList="nodownload">
                    This audio type is not supported.
                </audio>
            </div>
        );
    } else {
        return null;
    }
}
