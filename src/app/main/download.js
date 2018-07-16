/* Adds IPC for managing file downloads */

// Maintain a mapping from URL to download items
const map = {};

export function onStart(url, downloadItem) {
    // Add downloadItem to map
    map[url] = downloadItem;
}

export function onCancel(url) {
    // If downloadItem does not exist don't do anything
    if (!map[url]) return;

    map[url].cancel();

    // Once cancelled we don't require the mapping
    delete map[url];
}

export function onToggle(url) {
    // If downloadItem does not exist or downlaod can't be resumed then don't
    // do anything.
    if (!map[url]) return;

    if (!map[url].isPaused()) {
        map[url].pause();
        return "paused";
    }
    if (map[url].canResume()) {
        map[url].resume();
        return "resumed";
    }
}
