/* Display search results and search bar */
import React from "react";

export default function SearchResult({ location }) {
    return (
        <p>{`Search: ${location.state.search} \nParam: ${
            location.state.param
        }`}</p>
    );
}
