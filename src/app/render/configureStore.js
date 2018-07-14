import { createStore, applyMiddleware, compose } from "redux";
import thunkMiddleware from "redux-thunk";

import rootReducer from "app/render/reducers/index";

// Creates redux store
export default function configureStore() {
    // List of middlewares to be applied
    const middlewares = [thunkMiddleware];

    // Return the store
    return createStore(
        rootReducer,
        {},
        compose(
            applyMiddleware(...middlewares),
            window.devToolsExtension ? window.devToolsExtension() : f => f
        )
    );
}
