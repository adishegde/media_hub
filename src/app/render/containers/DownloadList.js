import { connect } from "react-redux";

import { getList } from "app/render/selectors/download";
import {
    cancelDownload,
    toggleStateDownload
} from "app/render/actions/download";
import DownloadListComponent from "app/render/components/Download/index";

function mapStateToProps(state) {
    return {
        downloads: getList(state)
    };
}

function mapDispatchToProps(dispatch) {
    return {
        onCancel: id => {
            dispatch(cancelDownload(id));
        }
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DownloadListComponent);
