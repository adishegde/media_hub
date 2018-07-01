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
export const DAEMON_LOG = "daemon.error.log";

// Name of client log file
export const CLIENT_LOG = "client.error.log";

export const DB = "mh-meta";

export const APP_NAME = "Media Hub";

export const DEFAULT_CONFIG = {
    ...DEFAULT_SERVER,
    ...DEFAULT_CLIENT,
    network: DEFAULT_NETWORK,
    udpPort: DEFAULT_UDP_PORT,
    httpPort: DEFAULT_HTTP_PORT
};
