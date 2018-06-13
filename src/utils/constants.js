// Exports app related constants. These musn't be saved in config because they
// shoudn't be modified

// Base uuid for namespace
const UUID_NAMESPACE = "4b94ccfc-ea76-47e0-b5f3-e2b4b4b23728";

// Config options
const CONFIGKEYS = [
    "port",
    "networkName",
    "shared",
    "pollingInterval",
    "dbPath",
    "dbwriteInterval",
    "maxResults",
    "log",
    "errorLog"
];

const DEFAULT_SERVER = {
    pollingInterval: 4000,
    writeInterval: 10000,
    dbPath: "./meta.json",
    maxResults: 10
};

const DEFAULT_NETWORK = "Media_Hub";

export { UUID_NAMESPACE, CONFIGKEYS, DEFAULT_SERVER, DEFAULT_NETWORK };
