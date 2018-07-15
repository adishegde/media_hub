/* Diplay breadcrumb for file page */
import React from "react";
import { Breadcrumb } from "semantic-ui-react";

export default function FilePageBreadcrumb({
    crumbs,
    onNavigate,
    onNavigateResults
}) {
    let onClick = (e, { pos }) => {
        onNavigate(crumbs[pos], pos);
    };

    let sections = crumbs.map((crumb, index) => {
        let lastItem = index === crumbs.length - 1 ? true : false;

        let sec = {
            key: index,
            pos: index,
            content: crumb.name
        };

        if (!lastItem) {
            sec.link = true;
            sec.onClick = onClick;
        } else {
            sec.active = true;
        }

        return sec;
    });

    sections.unshift({
        onClick: onNavigateResults,
        link: true,
        content: "Results",
        key: -1
    });

    return <Breadcrumb size="large" sections={sections} icon="right angle" />;
}
