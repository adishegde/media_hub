import React from "react";
import { Item } from "semantic-ui-react";

import DItem from "./Item.js";

export default function DownloadList({ downloads, onCancel, onToggle }) {
    let items = downloads.map(download => (
        <DItem
            {...download}
            key={download.url}
            onCancel={onCancel}
            onToggle={onToggle}
        />
    ));

    return <Item.Group>{items}</Item.Group>;
}
