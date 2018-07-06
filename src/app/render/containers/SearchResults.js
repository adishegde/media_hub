/* Display search results and search bar */
import React from "react";
import { connect } from "react-redux";

import SearchResultsComponent from "app/render/components/SearchResults";
import {
    isSearching,
    getSearchResult,
    getCurrentPage
} from "app/render/selectors/index";
import { search, fetchResultPage } from "app/render/actions/search";

// The source of truth for the results to be displayed is the query object
// of search state
function mapStateToProps(state) {
    let page = getCurrentPage(state);

    return {
        searching: isSearching(state, page),
        results: getSearchResult(state, page),
        page
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
