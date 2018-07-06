/* Search bar component */
import React from "react";
import {
    Input,
    Grid,
    Segment,
    Select,
    Image,
    Button,
    Icon
} from "semantic-ui-react";

const paramOpts = [
    { key: "default", value: "default", text: "All" },
    { key: "name", value: "name", text: "Name" },
    { key: "tag", value: "tag", text: "Tag" }
];

export default function Search({ search, param, onChange, onSearch, loading }) {
    return (
        <Input
            type="text"
            placeholder="Search..."
            action
            style={{ width: "90%" }}
            value={search}
            onChange={onChange}
            name="search"
        >
            <input />
            <Select
                compact
                options={paramOpts}
                value={param || "default"}
                onChange={onChange}
                name="param"
            />
            <Button
                color="teal"
                loading={loading}
                onClick={onSearch}
                disabled={loading}
            >
                <Icon name="search" />Search
            </Button>
        </Input>
    );
}
