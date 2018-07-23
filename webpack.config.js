const Path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const NodeExternals = require("webpack-node-externals");
const webpack = require("webpack");
let externals = require("./package.json").dependencies;

externals = Object.keys(externals);

// No need to bundle node modules for main process
const mainProcConfig = {
    entry: Path.resolve(__dirname, "src", "app", "main.js"),
    output: {
        filename: "index.js",
        path: Path.resolve(__dirname, "app"),
        libraryTarget: "commonjs2"
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
    externals: [...externals],
    node: {
        __dirname: false,
        __filename: false
    }
};

const renderProcConfig = {
    entry: Path.resolve(__dirname, "src", "app", "render", "index.js"),
    output: {
        filename: "render.js",
        path: Path.resolve(__dirname, "app")
    },
    target: "electron-renderer",
    externals: [...externals],
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
    plugins: [
        new HtmlWebpackPlugin({
            template: Path.join(__dirname, "src", "app", "index.html")
        })
    ],
    resolve: {
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
