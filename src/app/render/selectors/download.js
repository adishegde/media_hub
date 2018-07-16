export function getInfo(state, id) {
    if (!state.downloads) return {};
    return state.downloads[id];
}

export function getList(state) {
    if (!state.downloads) return [];
    return Object.values(state.downloads);
}
