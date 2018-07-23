import { connect } from "react-redux";
import { withRouter } from "react-router";

import TopMenuComponent from "app/render/components/TopMenu";

const leftOpts = [
    { name: "Home", path: "/" },
    { name: "Downloads", path: "/downloads" }
];

const rightOpts = [
    { name: "Settings", path: "/settings" },
    { name: "About", path: "/about" }
];

function mapToProps(state, { location, history }) {
    let rightMenuProp = rightOpts.map(option => ({
        ...option,
        active: location.pathname === option.path
    }));

    let leftMenuProp = leftOpts.map(option => ({
        ...option,
        active: location.pathname === option.path
    }));

    return {
        rightMenu: rightMenuProp,
        leftMenu: leftMenuProp,
        onOptionClick: path => {
            history.push(path);
        }
    };
}

export default withRouter(connect(mapToProps)(TopMenuComponent));
