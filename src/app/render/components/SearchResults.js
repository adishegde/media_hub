/* Displays the search results and a searh bar */
import React from "react";
import { Segment, Grid, Button } from "semantic-ui-react";

import SearchBar from "./SearchBar";
import FileTable from "./FileTable";

export default class SearchResults extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            search: "",
            param: "default"
        };

        this.onChange = this.onChange.bind(this);
        this.onSearch = this.onSearch.bind(this);
    }

    render() {
        let { search, param } = this.state;
        let { searching, page, results, onPageChange } = this.props;

        return (
            <div className="results" style={{ height: "100%", width: "100%" }}>
                <Grid
                    textAlign="center"
                    style={{ height: "100%", width: "100%" }}
                    verticalAlign="middle"
                >
                    <Grid.Column style={{ maxWidth: "75%" }} stretched>
                        <Segment.Group>
                            <Segment basic textAlign="center">
                                <SearchBar
                                    search={search}
                                    param={param}
                                    onChange={this.onChange}
                                    onSearch={this.onSearch}
                                />
                            </Segment>
                            <Segment loading={searching}>
                                <FileTable
                                    header={`Result page ${page}`}
                                    files={results}
                                />
                            </Segment>
                            <Segment basic textAlign="center">
                                <Button.Group fluid>
                                    <Button
                                        icon="arrow left"
                                        labelPosition="left"
                                        content="Previous Page"
                                        onClick={() => {
                                            onPageChange(-1);
                                        }}
                                    />
                                    <Button
                                        icon="arrow right"
                                        labelPosition="right"
                                        content="Next Page"
                                        onClick={() => {
                                            onPageChange(1);
                                        }}
                                    />
                                </Button.Group>
                            </Segment>
                        </Segment.Group>
                    </Grid.Column>
                </Grid>
            </div>
        );
    }

    onChange(e, { name, value }) {
        // Ensure name of input tags is same as the state properties
        this.setState({
            [name]: value
        });
    }

    onSearch() {
        let { search, param } = this.state;

        // Call onSearch prop with search string and param
        this.props.onSearch({
            search,
            param
        });
    }
}
