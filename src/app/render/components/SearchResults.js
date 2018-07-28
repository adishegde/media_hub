/* Displays the search results and a searh bar */
import React from "react";
import { Segment, Grid, Button, Message } from "semantic-ui-react";

import SearchBar from "./SearchBar";
import FileTable from "./FileTable";
import { SEARCH_PARAMS } from "core/utils/constants";

export default class SearchResults extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            search: "",
            param: SEARCH_PARAMS.names
        };

        this.onChange = this.onChange.bind(this);
        this.onSearch = this.onSearch.bind(this);
    }

    render() {
        let { search, param } = this.state;
        let {
            searching,
            page,
            results,
            onPageChange,
            error,
            onFileItemClick
        } = this.props;

        let mainContent;

        // Show buttons to go to next and previous page
        let nextPageAllow = true;
        let prevPageAllow = true;

        if (page === 1) prevPageAllow = false;

        if (error) {
            // If error has occurred then display the error message
            mainContent = (
                <Message negative>
                    <Message.Header>
                        Sorry! Something went wrong.
                    </Message.Header>
                    <p>Why don't you retry the search</p>
                </Message>
            );
        } else if (!searching && results.length === 0) {
            mainContent = (
                <Message info>
                    <Message.Header>We didn't find any matches</Message.Header>
                    <p>Please try again later</p>
                </Message>
            );
            nextPageAllow = false;
        } else {
            mainContent = (
                <Segment style={{ height: "60vh", overflowY: "auto" }}>
                    <FileTable
                        header={`Result Page ${page}`}
                        files={results}
                        onFileItemClick={onFileItemClick}
                    />
                </Segment>
            );
        }

        return (
            <div className="results" style={{ height: "100%", width: "100%" }}>
                <Grid
                    textAlign="center"
                    style={{ height: "100%", width: "100%" }}
                    verticalAlign="middle"
                >
                    <Grid.Column style={{ maxWidth: "75%" }} stretched>
                        <Segment.Group style={{ height: "100%" }}>
                            <Segment
                                basic
                                textAlign="center"
                                style={{ height: "10%" }}
                                vertical
                            >
                                <SearchBar
                                    search={search}
                                    param={param}
                                    onChange={this.onChange}
                                    onSearch={this.onSearch}
                                    style={{ height: "100%" }}
                                />
                            </Segment>
                            <Segment loading={searching}>{mainContent}</Segment>
                            <Segment
                                basic
                                textAlign="center"
                                style={{ height: "10%" }}
                            >
                                <Button.Group fluid>
                                    {prevPageAllow ? (
                                        <Button
                                            icon="arrow left"
                                            labelPosition="left"
                                            content="Previous Page"
                                            onClick={() => {
                                                onPageChange(-1);
                                            }}
                                        />
                                    ) : null}
                                    {prevPageAllow && nextPageAllow ? (
                                        <Button.Or />
                                    ) : null}
                                    {nextPageAllow ? (
                                        <Button
                                            icon="arrow right"
                                            primary
                                            labelPosition="right"
                                            content="Next Page"
                                            onClick={() => {
                                                onPageChange(1);
                                            }}
                                        />
                                    ) : null}
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
