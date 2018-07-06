import { createStore, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";
import { createLogger } from "redux-logger";

import rootReducer from "app/render/reducers/index";

// Creates redux store
export default function configureStore() {
    // List of middlewares to be applied
    const middlewares = [thunkMiddleware];

    // If executed in development mode, add Logger middleware
    if (process.env.MH_ENV === "development") {
        middlewares.push(createLogger());
    }

    // Return the store
    return createStore(rootReducer, {}, applyMiddleware(...middlewares));
}
