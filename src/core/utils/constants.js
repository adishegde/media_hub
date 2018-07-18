// Exports app related constants. These musn't be saved in config because they
// shoudn't be modified

// Base uuid for namespace
export const UUID_NAMESPACE = "4b94ccfc-ea76-47e0-b5f3-e2b4b4b23728";

export const DEFAULT_SERVER = {
    db: "./media_hub-meta",
    maxResults: 10,
    ignore: ["(^|\\/)\\.[^\\/\\.]"],
    selfRespond: false,
    ip: undefined // Default behaviour is to guess IP
};

// Multicast address belonging to the local use range
export const DEFAULT_MULTICAST = "239.255.42.99";

export const DEFAULT_NETWORK = "Media_Hub";

// Default ports for running services
export const DEFAULT_UDP_PORT = 31340;
export const DEFAULT_HTTP_PORT = 31340;

export const DEFAULT_CLIENT = {
    port: 31342,
    broadcastIp: "255.255.255.255",
    timeout: 3000,
    useBroadcast: false
};
