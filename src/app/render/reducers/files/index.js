/* Mangaes file meta data */
import { combineReducers } from "redux";

import cache from "./cache";
import display from "./display";
import status from "./status";
import error from "./error";

export default combineReducers({
    cache,
    display,
    status,
    error
});
