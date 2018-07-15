import { connect } from "react-redux";

import { getDisplayURL, getData } from "app/render/selectors/files";
import StreamComponent from "app/render/components/Stream";

// The file whose data is to be diplayed is decided by the display property of
// the files state.
function mapStateToProps(state) {
    let url = getDisplayURL(state);

    return {
        url,
        file: getData(state, url)
    };
}

export default connect(mapStateToProps)(StreamComponent);
