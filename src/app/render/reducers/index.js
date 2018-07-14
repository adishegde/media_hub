/* Root reducer */
import { combineReducers } from "redux";

import search from "./search/index";
import files from "./files/index";

export default combineReducers({
    search,
    files
});
