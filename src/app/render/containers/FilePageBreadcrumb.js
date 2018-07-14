import { connect } from "react-redux";
import { withRouter } from "react-router";

import BreadcrumbComponent from "app/render/components/FilePageBreadcrumb";
import { getDisplayList } from "app/render/selectors/files";
import { displayFile } from "app/render/actions/files";

function mapStateToProps(state) {
    return {
        crumbs: getDisplayList(state)
    };
}

function mapDispatchToProps(dispatch, { history }) {
    return {
        onNavigate: (file, pos) => {
            dispatch(displayFile(file, pos));
        },
        onNavigateResults: () => {
            // Move to resutls window
            history.push("/results");
        }
    };
}

export default withRouter(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )(BreadcrumbComponent)
);
