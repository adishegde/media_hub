/* File data page */
import { connect } from "react-redux";
import { withRouter } from "react-router";

import {
    getDisplayURL,
    getData,
    isLoading,
    getError
} from "app/render/selectors/files";
import FileDataComponent from "app/render/components/FileData";

function mapStateToProps(state) {
    let url = getDisplayURL(state);

    return {
        data: getData(state, url),
        loading: isLoading(state, url),
        error: getError(state, url)
    };
}

function mapDispatchToProps(state, { history }) {
    // Minimal navigation support
    return {
        onBackClick: () => {
            console.log("clicked");
            history.push("/results");
        }
    };
}

export default withRouter(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )(FileDataComponent)
);
