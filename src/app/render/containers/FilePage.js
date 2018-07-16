import { connect } from "react-redux";
import { withRouter } from "react-router";

import { getError, getDisplayURL } from "app/render/selectors/files";
import { download } from "app/render/actions/download";
import FilePageComponent from "app/render/components/FilePage";

function mapStateToProps(state) {
    let url = getDisplayURL(state);

    return {
        error: getError(state, url),
        url
    };
}

function mapDispatchToProps(dispatch, { history }) {
    return {
        onDownload: url => {
            dispatch(download(url));
            history.push("/downloads");
        }
    };
}

export default withRouter(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )(FilePageComponent)
);
