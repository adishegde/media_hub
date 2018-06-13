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

export { UUID_NAMESPACE, CONFIGKEYS };
