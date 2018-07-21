import React from "react";
import {
    Item,
    Progress,
    Button,
    Grid,
    Accordion,
    Icon
} from "semantic-ui-react";

import FileIcon from "../FileIcon";
import { formatBytes } from "app/utils/functions";
import { downloadStatus } from "app/utils/constants";

export default function DownloadItem({
    error,
    file: { name, size },
    id,
    progress,
    path,
    status,
    date,
    onCancel,
    onToggle
}) {
    let content = null;
    date = new Date(date).toDateString();

    if (error && !Array.isArray(error)) {
        return (
            <Item>
                <FileIcon as={Item.Icon} name={name} />
                <Item.Content>
                    <Item.Header>{name}</Item.Header>
                    <Item.Meta>{`Size: ${formatBytes(
                        size
                    )} Date: ${date}`}</Item.Meta>
                    <Item.Description>{`${error}`}</Item.Description>
                </Item.Content>
            </Item>
        );
    } else if (
        status === downloadStatus.cancelled ||
        status === downloadStatus.finished
    ) {
        let desc = "Download Cancelled";
        if (status === downloadStatus.finished) {
            desc = `Downloaded to ${path}`;
        }

        let errList;
        if (error && error.length) {
            errList = (
                <Accordion
                    panels={[
                        {
                            key: "files",
                            title:
                                "The following files could not be downloaded:",
                            content: {
                                key: 1, // Give arbitrary key
                                content: (
                                    <ul>
                                        {error.map(file => (
                                            <li key={file.path}>{file.path}</li>
                                        ))}
                                    </ul>
                                )
                            }
                        }
                    ]}
                />
            );
        }

        return (
            <Item>
                <FileIcon as={Item.Icon} name={name} />
                <Item.Content>
                    <Item.Header>{name}</Item.Header>
                    <Item.Meta>{`Size: ${formatBytes(
                        size
                    )} Date: ${date}`}</Item.Meta>
                    <Item.Description>{desc}</Item.Description>
                    <Item.Extra>{errList}</Item.Extra>
                </Item.Content>
            </Item>
        );
    } else {
        return (
            <Item>
                <FileIcon as={Item.Icon} name={name} />
                <Item.Content>
                    <Item.Header>{name}</Item.Header>
                    <Item.Meta>{`Size: ${formatBytes(
                        size
                    )} Date: ${date}`}</Item.Meta>
                    <Item.Description>
                        <span>{`Downloading to ${path}`}</span>
                    </Item.Description>
                    <Item.Extra>
                        <Grid columns={2}>
                            <Grid.Column width={5}>
                                <Progress
                                    percent={Math.floor(progress * 100)}
                                    indicating
                                    progress
                                    size="small"
                                />
                            </Grid.Column>
                            <Grid.Column width={1}>
                                <Button
                                    negative
                                    icon="cancel"
                                    onClick={() => {
                                        onCancel(id);
                                    }}
                                />
                            </Grid.Column>
                        </Grid>
                    </Item.Extra>
                </Item.Content>
            </Item>
        );
    }
}
