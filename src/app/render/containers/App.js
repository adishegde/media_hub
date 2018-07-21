import { connect } from "react-redux";
import { withRouter } from "react-router";

import { fetchAndLoadState, saveState } from "app/render/actions/index";
import AppComponent from "app/render/components/App";

function mapDispatchToProps(dispatch, otherprops) {
    return {
        onLoad: () => {
            dispatch(fetchAndLoadState());
        },
        onClose: () => {
            dispatch(saveState());
        }
    };
}

export default withRouter(
    connect(
        null,
        mapDispatchToProps
    )(AppComponent)
);
