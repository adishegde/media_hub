import { createStore, applyMiddleware, compose } from "redux";
import { remote } from "electron";
import thunkMiddleware from "redux-thunk";

import rootReducer from "app/render/reducers/index";

// We use remote to initialize config state. After that we use the
// CONFIG_UPDATED event to keep updating the config state.
const config = remote.getGlobal("config");

// Creates redux store
export default function configureStore() {
    // List of middlewares to be applied
    const middlewares = [thunkMiddleware];

    // Return the store
    return createStore(
        rootReducer,
        {
            config: config._
        },
        compose(
            applyMiddleware(...middlewares),
            window.devToolsExtension ? window.devToolsExtension() : f => f
        )
    );
}
