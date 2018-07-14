import { connect } from "react-redux";

import { getError, getDisplayURL } from "app/render/selectors/files";
import FilePageComponent from "app/render/components/FilePage";

function mapStateToProps(state) {
    let url = getDisplayURL(state);

    return {
        error: getError(state, url)
    };
}

export default connect(mapStateToProps)(FilePageComponent);
