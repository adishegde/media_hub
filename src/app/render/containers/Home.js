/* Home screen page */
import { withRouter } from "react-router";
import { connect } from "react-redux";

import { search } from "app/render/actions/search.js";
import Home from "app/render/components/Home";

function mapDispatchToProps(dispatch, { history }) {
    return {
        onSearch: query => {
            // Redirect to results page
            history.push("/results");

            // Dispatch search action
            dispatch(search(query));
        }
    };
}

export default withRouter(
    connect(
        null,
        mapDispatchToProps
    )(Home)
);
