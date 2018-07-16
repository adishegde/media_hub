export function getInfo(state, url) {
    if (!state.downloads) return {};
    return state.downloads[url];
}

export function getList(state) {
    if (!state.downloads) return [];
    return Object.values(state.downloads);
}
