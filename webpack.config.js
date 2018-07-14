const Path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const NodeExternals = require("webpack-node-externals");
const webpack = require("webpack");

// No need to bundle node modules for main process
const mainProcConfig = {
    entry: Path.resolve(__dirname, "src", "app", "main.js"),
    output: {
        filename: "main.js",
        path: Path.resolve(__dirname, "dist")
    },
    target: "electron-main",
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: "babel-loader"
            }
        ]
    },
    resolve: {
        modules: [Path.join(__dirname, "src"), "node_modules"]
    },
    externals: [NodeExternals()]
};

const renderProcConfig = {
    entry: Path.resolve(__dirname, "src", "app", "render", "index.js"),
    output: {
        filename: "render.js",
        path: Path.resolve(__dirname, "dist")
    },
    target: "electron-renderer",
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: "babel-loader"
            },
            {
                test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
                use: {
                    loader: "url-loader",
                    options: {
                        limit: 100000
                    }
                }
            },
            {
                test: /\.css$/,
                loader: "style-loader!css-loader!sass-loader"
            }
        ]
    },
    plugins: [new HtmlWebpackPlugin()],
    resolve: {
        alias: {
            react: "preact-compat",
            "react-dom": "preact-compat"
        },
        modules: [Path.join(__dirname, "src"), "node_modules"]
    }
};

if (process.env.MH_ENV === "development") {
    new webpack.DefinePlugin({
        "process.env": {
            NODE_ENV: JSON.stringify("development")
        }
    });
}

module.exports = [mainProcConfig, renderProcConfig];
