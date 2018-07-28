/* Exports constants for usage in GUI app */

import {
    DEFAULT_SERVER,
    DEFAULT_NETWORK,
    DEFAULT_UDP_PORT,
    DEFAULT_HTTP_PORT,
    DEFAULT_CLIENT
} from "core/utils/constants";

// Name of file where all GUI setting will be stored. Options include client
// and daemon options
export const CONFIG_FILE = "settings.json";

// Name of daemon log file
export const DAEMON_LOG = "daemon.log";

// Name of client log file
export const CLIENT_LOG = "client.log";

export const DB = "mh-meta";

export const APP_NAME = "Media Hub";

export const DEFAULT_CONFIG = {
    ...DEFAULT_SERVER,
    ...DEFAULT_CLIENT,
    network: DEFAULT_NETWORK,
    udpPort: DEFAULT_UDP_PORT,
    httpPort: DEFAULT_HTTP_PORT
};

// Similar to an enum to define request status
export const statusCodes = {
    loading: 1,
    done: 2,
    error: 3
};

// List of video and audio extensions
// Not meant to be exhaustive. Just the most common ones supported by the
// browser
export const videoExt = [
    ".mkv",
    ".ogv",
    ".ogg",
    ".mp4",
    ".m4p",
    ".m4v",
    ".webm",
    ".mpg",
    ".mp2",
    ".mpeg",
    ".mpe",
    ".mpv"
];

export const audioExt = [".mp3", ".mpa", ".aac", ".oga", ".wav"];

// Channel names on which ipcMain listens
export const ipcMainChannels = {
    CONFIG_UPDATE: "CONFIG_UPDATE",
    UPDATE_APP: "UPDATE_APP"
};

// Channel names on which ipcRenderer listens
export const ipcRendererChannels = {
    SERVER_ERROR: "SERVER_ERROR",
    UPDATE_AVAILABLE: "UPDATE_AVAILABLE",
    CONFIG_UPDATED: "CONFIG_UPDATED"
};

export const downloadStatus = {
    finished: 1,
    error: 2,
    cancelled: 3,
    paused: 4,
    idle: 5,
    downloading: 6
};

export const REPO_URL = "https://github.com/adishegde/media_hub";

// The message types for communication between daemon and main process
export const daemonChannels = {
    RESTART: "RESTART",
    INIT: "INIT",
    CLEANUP: "CLEANUP"
};
