import { app, BrowserWindow, ipcMain } from "electron";
import * as Path from "path";
import * as Url from "url";
import * as Fs from "fs";
import Level from "level";

import {
    CONFIG_FILE,
    DAEMON_LOG,
    CLIENT_LOG,
    DB,
    APP_NAME,
    DEFAULT_CONFIG
} from "app/utils/constants";
import Server from "core/daemon/server";
import Config from "core/utils/config";
import { addLogFile } from "core/utils/log";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Reference to server
let server;

// Reference to app config handler
let config;

// Reference to db
let db;

// Log level for daemon and client logs
let logLevel = "error";

// Use dev server in development mode
let htmlUrl = Url.format({
    pathname: Path.resolve("dist", "index.html"),
    protocol: "file:",
    slashes: true
});
if (process.env.MH_ENV === "development") {
    htmlUrl = Url.format({
        pathname: "localhost:1234/",
        protocol: "http:",
        slashes: true
    });

    // Use info log level in development mode
    logLevel = "debug";
}

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        frame: true,
        show: false,
        title: APP_NAME
    });

    // and load the index.html of the app.
    mainWindow.loadURL(htmlUrl);

    if (process.env.MH_ENV === "development") {
        // Open the DevTools.
        mainWindow.webContents.openDevTools();
    }

    // Emitted when the window is closed.
    mainWindow
        .on("closed", () => {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            mainWindow = null;
        })
        .on("ready-to-show", () => {
            // Show window after html has been loaded. Avoids visual flash.
            mainWindow.show();
        })
        .on("page-title-updated", event => {
            // Use the title set in main process rather than HTML title
            event.preventDefault();
        });
}

// Initialize app
function init() {
    try {
        let userDataPath = app.getPath("userData");

        let configFile = Path.join(userDataPath, CONFIG_FILE);
        let dbPath = Path.join(userDataPath, DB);
        let daemonLogFile = Path.join(userDataPath, DAEMON_LOG);
        let clientLogFile = Path.join(userDataPath, CLIENT_LOG);

        // Add daemon and client log files
        addLogFile("daemon", daemonLogFile, logLevel);

        // Create db
        // Once created here, it's not closed for the lifetime of the app
        db = Level(dbPath, { valueEncoding: "json" });

        // Assign the config handler to "config". This will be used throughout
        // the app to update the config file.
        config = new Config(configFile);

        if (Object.keys(config._).length === 0) {
            // Config file didn't exist or was empty. We assign default settings
            config._ = { ...DEFAULT_CONFIG, db: dbPath };

            // Enable self respond in development mode
            if (process.env.MH_ENV === "development")
                config._.selfRespond = true;

            // Write default settings to config file
            config.write();
        }

        global.config = config;

        // Basic init complete. Create window
        createWindow();

        if (Object.keys(config._) !== 0) {
            createServer();
        }
    } catch (err) {
        console.log(err);
    }

    // Listen for messages from server
    ipcMain.on("update-config", (event, update) => {
        // Assign updated properties to config
        Object.assign(config._, update);

        // Write new config to settings and restart server
        config.write().then(() => {
            // Currently restarting server is equivalent to stopping old server and
            // creating a new instance
            createServer();
        });
    });

    // In development install extensions
    if (process.env.MH_ENV === "development") {
        const Installer = require("electron-devtools-installer");

        Promise.all([
            Installer.default(Installer.REACT_DEVELOPER_TOOLS),
            Installer.default(Installer.REDUX_DEVTOOLS)
        ]).catch(err => {
            console.log(err);
        });
    }
}

// Create new server instance
function createServer() {
    // Stop server if it's running
    if (server) server.stop();

    try {
        // Create new server using app settings
        // Passes existing db instance
        server = new Server(db, config._);
        server.start();
    } catch (err) {
        // if error occurs then emit error onto browser window
        mainWindow.webContents.send("server-error", err);
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", init);

app.on("activate", function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

app.on("will-quit", () => {
    // Stop server if it's running
    if (server) server.stop();
    // Close db connection before quitting
    if (db) db.close();
});
