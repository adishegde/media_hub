/* Actions related to config data */

export const RECEIVE_CONFIG = "RECEIVE_CONFIG";

export function receiveConfig(config) {
    return {
        type: RECEIVE_CONFIG,
        config
    };
}
