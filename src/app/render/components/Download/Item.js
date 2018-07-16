import React from "react";
import { Item, Progress, Button, Grid } from "semantic-ui-react";

import FileIcon from "../FileIcon";
import { formatBytes } from "app/utils/functions";
import { downloadStatus } from "app/utils/constants";

export default function DownloadItem({
    error,
    file: { name, size },
    url,
    progress,
    path,
    status,
    onCancel,
    onToggle
}) {
    let content = null;

    if (error) {
        return (
            <Item>
                <FileIcon as={Item.Icon} name={name} />
                <Item.Content>
                    <Item.Header>{name}</Item.Header>
                    <Item.Meta>{`Size: ${formatBytes(size)}`}</Item.Meta>
                    <Item.Description>{`Error: ${error}`}</Item.Description>
                </Item.Content>
            </Item>
        );
    } else if (
        status === downloadStatus.cancelled ||
        status === downloadStatus.done
    ) {
        let desc = "Download Cancelled";
        if (status === downloadStatus.done) {
            desc = `Downloaded to ${path}`;
        }

        return (
            <Item>
                <FileIcon as={Item.Icon} name={name} />
                <Item.Content>
                    <Item.Header>{name}</Item.Header>
                    <Item.Meta>{`Size: ${formatBytes(size)}`}</Item.Meta>
                    <Item.Description>{desc}</Item.Description>
                </Item.Content>
            </Item>
        );
    } else {
        let icon = "pause";
        if (status === downloadStatus.paused) icon = "play";

        return (
            <Item>
                <FileIcon as={Item.Icon} name={name} />
                <Item.Content>
                    <Item.Header>{name}</Item.Header>
                    <Item.Meta>{`Size: ${formatBytes(size)}`}</Item.Meta>
                    <Item.Description>
                        <span>{`Downloading to ${path}`}</span>
                    </Item.Description>
                    <Item.Extra>
                        <Grid columns={3}>
                            <Grid.Column width={1}>
                                <Button
                                    color="teal"
                                    icon={icon}
                                    onClick={() => {
                                        onToggle(url);
                                    }}
                                />
                            </Grid.Column>
                            <Grid.Column width={5}>
                                <Progress
                                    percent={(progress * 100).toFixed(2)}
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
                                        onCancel(url);
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
