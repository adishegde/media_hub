/* Navigation Menu to transition between pages */
import React from "react";
import { Menu, Segment } from "semantic-ui-react";

export default function TopMenu({ rightMenu, leftMenu, onOptionClick }) {
    let onClick = (e, { path }) => {
        onOptionClick(path);
    };

    return (
        <Segment basic inverted>
            <Menu inverted borderless fixed="top">
                {leftMenu.map(option => (
                    <Menu.Item
                        name={option.name}
                        active={option.active || false}
                        path={option.path}
                        onClick={onClick}
                        key={option.path}
                    />
                ))}
                <Menu.Menu position="right">
                    {rightMenu.map(option => (
                        <Menu.Item
                            name={option.name}
                            active={option.active || false}
                            path={option.path}
                            onClick={onClick}
                            key={option.path}
                        />
                    ))}
                </Menu.Menu>
            </Menu>
        </Segment>
    );
}
