/* Adds IPC for managing file downloads */

// Maintain a mapping from id to download items
const map = {};

export function onStart(id, downloadItem) {
    // If any id collision happens then cancel old download. This helps prevent
    // untracked downloads
    //if (map[id]) map[id].cancel();

    // Add downloadItem to map
    map[id] = downloadItem;
}

export function onCancel(id) {
    // If downloadItem does not exist don't do anything
    if (!map[id]) return;

    map[id].cancel();

    // Once cancelled we don't require the mapping
    delete map[id];
}

export function onToggle(id) {
    // If downloadItem does not exist or downlaod can't be resumed then don't
    // do anything.
    if (!map[id]) return;

    if (!map[id].isPaused()) {
        map[id].pause();
        return "paused";
    }
    if (map[id].canResume()) {
        map[id].resume();
        return "resumed";
    }
}
