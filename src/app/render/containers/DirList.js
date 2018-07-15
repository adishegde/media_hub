/* Displays the directory contents if file to be displayed is a directory */
import React from "react";
import { connect } from "react-redux";
import { Header, Segment } from "semantic-ui-react";

import { getDisplayURL, getData, isLoading } from "app/render/selectors/files";
import { displayFile } from "app/render/actions/files";
import FileList from "app/render/components/FileList";

// Render file list with header and proper styling
function DirListComponent({ name, ...childprops }) {
    // If files is empty don't render anything
    if (!childprops.files) return null;

    return (
        <Segment>
            <Header as="h4">{`Contents of ${name}`}</Header>
            <FileList
                {...childprops}
                style={{ maxHeight: "30vh", overflowY: "auto" }}
            />
        </Segment>
    );
}

function mapStateToProps(state) {
    let url = getDisplayURL(state);
    let data = getData(state, url);

    return {
        files: data.children,
        name: data.name,
        loading: isLoading(state, url)
    };
}

function mapDispatchToProps(dispatch) {
    return {
        onFileItemClick: file => {
            // We need to append to display list, hence pos is negative
            dispatch(displayFile(file, -1));
        }
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DirListComponent);
