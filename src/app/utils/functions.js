/* Some utility functions used across the app */

// Takes size in bytes and returns string with right units to make it more
// readable
export function formatBytes(bytes) {
    let suf = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];

    if (bytes === 0) {
        return `0 ${suf[0]}`;
    }

    let place = Math.floor(Math.log2(bytes) / 10);
    let num = (bytes / Math.pow(1024, place)).toFixed(2);

    return `${num} ${suf[place]}`;
}
