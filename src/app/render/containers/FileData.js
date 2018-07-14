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

// The file whose data is to be diplayed is decided by the display property of
// the files state.
function mapStateToProps(state) {
    let url = getDisplayURL(state);

    return {
        data: getData(state, url),
        loading: isLoading(state, url)
    };
}

export default withRouter(connect(mapStateToProps)(FileDataComponent));
