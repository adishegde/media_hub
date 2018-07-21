export function getInfo(state, id) {
    if (!state.downloads) return {};
    return state.downloads[id];
}

export function getList(state) {
    if (!state.downloads) return [];
    return Object.values(state.downloads);
}

// This takes a list of downloads and sorts it by date in reverse order
// i.e. most recent item first
export function sortList(list) {
    return [...list].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
}
