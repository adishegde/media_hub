// Exports app related constants. These musn't be saved in config because they
// shoudn't be modified

// Base uuid for namespace
const UUID_NAMESPACE = "4b94ccfc-ea76-47e0-b5f3-e2b4b4b23728";

// Config options for server
const CONFIGKEYS = [
    "udpPort",
    "httpPort",
    "networkName",
    "shared",
    "pollingInterval",
    "dbPath",
    "dbwriteInterval",
    "maxResults",
    "log",
    "errorLog",
    "logLevel"
];

const DEFAULT_SERVER = {
    pollingInterval: 4000,
    dbWriteInterval: 10000,
    dbPath: "./meta.json",
    maxResults: 10
};

const DEFAULT_NETWORK = "Media_Hub";

// Default ports for running services
const DEFAULT_UDP_PORT = 31340;
const DEFAULT_HTTP_PORT = 31340;

const DEFAULT_CLIENT = {
    port: 31342,
    broadcastIp: "255.255.255.255",
    timeout: 3000
};

export {
    UUID_NAMESPACE,
    CONFIGKEYS,
    DEFAULT_SERVER,
    DEFAULT_NETWORK,
    DEFAULT_HTTP_PORT,
    DEFAULT_UDP_PORT,
    DEFAULT_CLIENT
};
