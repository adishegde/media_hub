/* Root reducer */
import { combineReducers } from "redux";

import search from "./search/index";
import files from "./files/index";
import downloads from "./downloads";

export default combineReducers({
    search,
    files,
    downloads
});
