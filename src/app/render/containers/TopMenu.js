import { connect } from "react-redux";
import { withRouter } from "react-router";

import TopMenuComponent from "app/render/components/TopMenu";

const options = [
    { name: "Home", path: "/" },
    { name: "Downloads", path: "/downloads" }
];

function mapToProps(state, { location, history }) {
    let menuProp = options.map(option => ({
        ...option,
        active: location.pathname === option.path
    }));

    return {
        options: menuProp,
        onOptionClick: path => {
            history.push(path);
        }
    };
}

export default withRouter(connect(mapToProps)(TopMenuComponent));
