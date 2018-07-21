import { downloadStatus } from "app/utils/constants";

export function getInfo(state, id) {
    if (!state.downloads) return {};
    return state.downloads[id];
}

export function getList(state) {
    if (!state.downloads) return [];
    return Object.values(state.downloads);
}

// Returns  of downloads that are not ongoing
export function filterCompleted(state) {
    if (!state.downloads) return [];

    return Object.keys(state.downloads).reduce((acc, id) => {
        let dstat = state.downloads[id].status;
        if (
            dstat === downloadStatus.error ||
            dstat === downloadStatus.cancelled ||
            dstat === downloadStatus.finished
        )
            acc[id] = state.downloads[id];

        return acc;
    });
}

// This takes a list of downloads and sorts it by date in reverse order
// i.e. most recent item first
export function sortList(list) {
    return [...list].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
}
