/* Display search results and search bar */
import React from "react";
import { connect } from "react-redux";

import SearchResultsComponent from "app/render/components/SearchResults";
import {
    isSearching,
    getResult,
    getCurrentPage,
    getError
} from "app/render/selectors/search";
import { search, fetchResultPage } from "app/render/actions/search";

// The source of truth for the results to be displayed is the query object
// of search state
function mapStateToProps(state) {
    let page = getCurrentPage(state);

    return {
        searching: isSearching(state, page),
        results: getResult(state, page),
        page,
        error: getError(state, page)
    };
}

function mapDispatchToProps(dispatch) {
    return {
        onPageChange: delta => {
            dispatch(fetchResultPage(delta));
        },
        onSearch: query => {
            dispatch(search(query));
        }
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SearchResultsComponent);
