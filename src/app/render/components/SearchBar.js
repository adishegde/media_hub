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

import { SEARCH_PARAMS } from "core/utils/constants";

const paramOpts = [
    { key: "name", value: SEARCH_PARAMS.names, text: "Name" },
    { key: "tag", value: SEARCH_PARAMS.tags, text: "Tag" }
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
            onKeyPress={target => {
                if (target.charCode === 13) {
                    onSearch();
                }
            }}
        >
            <input />
            <Select
                compact
                options={paramOpts}
                value={param || SEARCH_PARAMS.names}
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
