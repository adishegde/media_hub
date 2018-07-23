/* The config reducer manages the config data. The idea is to keep the data
 * in sync with the actual config data */
import { RECEIVE_CONFIG } from "app/render/actions/config";

export default function config(state = {}, action) {
    switch (action.type) {
        case RECEIVE_CONFIG:
            return { ...action.config };

        default:
            return state;
    }
}
