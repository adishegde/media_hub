import { app, BrowserWindow, ipcMain } from "electron";
import * as Path from "path";
import * as Url from "url";
import * as ChildProcess from "child_process";
import { autoUpdater } from "electron-updater";

import {
    CONFIG_FILE,
    DAEMON_LOG,
    CLIENT_LOG,
    DB,
    APP_NAME,
    DEFAULT_CONFIG,
    ipcMainChannels as Mch,
    ipcRendererChannels as Rch,
    daemonChannels as Dc
} from "app/utils/constants";
import Config from "core/utils/config";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Reference to app config handler
let config;

// Log level for daemon and client logs
let logLevel = "error";

// Run the daemon in another process
let subProcess = ChildProcess.fork(Path.join(__dirname, "daemon.js"));

// Listen to any errors in sub process
subProcess
    .on("error", err => {
        console.log(`Error in daemon: ${err}`);
    })
    .on("exit", (code, signal) => {
        console.log(
            `Sub process exited with code ${code} and signal ${signal}`
        );
    });
console.log(`Subprocess created with pid ${subProcess.pid}`);

// Use dev server in development mode
let htmlUrl = Url.format({
    pathname: Path.resolve(__dirname, "index.html"),
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

    // This prevents collision of app path for dev and prod env
    app.setPath("userData", `${app.getPath("userData")}_dev`);
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

    mainWindow.webContents.once("dom-ready", () => {
        // In development install extensions
        if (process.env.MH_ENV === "development") {
            console.log("Development mode. Adding dev-tools.");

            const Installer = require("electron-devtools-installer");

            Promise.all([
                Installer.default(Installer.REACT_DEVELOPER_TOOLS),
                Installer.default(Installer.REDUX_DEVTOOLS)
            ]).catch(err => {
                console.log(`DevTools: ${err}`);
            });
        }
    });
}

// Initialize app
function init() {
    try {
        let userDataPath = app.getPath("userData");

        let configFile = Path.join(userDataPath, CONFIG_FILE);
        let dbPath = Path.join(userDataPath, DB);
        let daemonLogFile = Path.join(userDataPath, DAEMON_LOG);

        // Initialize sub process
        // The subprocess sends a message with errors but currently there's
        // use listening to it.
        subProcess.send({
            type: Dc.INIT,
            payload: {
                dbPath,
                logPath: daemonLogFile,
                logLevel
            }
        });

        // Assign the config handler to "config". This will be used throughout
        // the app to update the config file.
        config = new Config(configFile);

        if (Object.keys(config._).length === 0) {
            // Config file didn't exist or was empty. We assign default settings
            config._ = { ...DEFAULT_CONFIG, db: dbPath };

            // Write default settings to config file
            config.write();
        }

        global.config = config;

        // Basic init complete. Create window
        createWindow();

        if (Object.keys(config._) !== 0) {
            restartDaemon();
        }
    } catch (err) {
        console.log(`Init: ${err}`);
    }

    // Start auto updater
    autoUpdater.checkForUpdatesAndNotify();
}

// Restart daemon
function restartDaemon() {
    return new Promise((resolve, reject) => {
        subProcess.send({
            type: Dc.RESTART,
            payload: {
                config: config._
            }
        });

        // The callback to be called when subprocess gives finished event
        const callback = mssg => {
            if (mssg.type === Dc.RESTART) {
                // We remove the registered listener.
                subProcess.removeListener("message", callback);

                if (mssg.errors) {
                    reject(mssg.errors);
                } else {
                    resolve();
                }
            }
        };

        // Adding a one time listener should have sufficed here. But there
        // might be a case where multiple messages might be communicated in a
        // short time. This makes sure we don't get any unexpected behaviour.
        subProcess.on("message", callback);
    }).catch(errs => {
        // Log any errors
        console.log(`Daemon.Restart: ${errs}`);
    });
}

// Clean up resources on app exit
function cleanup() {
    let rendererFinish = Promise.resolve();
    // Close main window. This will case mainWindow to start it's cleanup
    // We check for mainWindow too since in OSX the app might be running
    // without a window
    if (mainWindow && mainWindow.isClosable()) {
        mainWindow.close();
        rendererFinish = new Promise(resolve => {
            mainWindow.once("closed", () => {
                resolve();
            });
        });
    }

    // Wait for renderer process to close
    return rendererFinish
        .then(() => {
            // Send message to subprocess to cleanup
            return new Promise((resolve, reject) => {
                subProcess.send({
                    type: Dc.CLEANUP
                });

                let callback = mssg => {
                    if (mssg.type === Dc.CLEANUP) {
                        if (mssg.errors) reject(mssg.errors);
                        resolve();

                        // Remove the added listener
                        subProcess.removeListener("message", callback);
                    }
                    // Ignore any other message type
                };

                subProcess.on("message", callback);
            });
        })
        .catch(errs => {
            // Log error and process to kill subprocess
            console.log(`Error while cleaning up: ${errs}`);
        })
        .then(() => {
            // Kill the sub process
            subProcess.kill();

            console.log("Cleanup completed.");
        });
}

/* IPC listeners, to communicate with renderer process */

// Listen for config update messages from server
ipcMain.on(Mch.CONFIG_UPDATE, (event, update) => {
    // Assign updated properties to config
    Object.assign(config._, update);

    // Write new config to settings and restart server
    config.write().then(() => {
        // Notify renderer that config was updated
        mainWindow.webContents.send(Rch.CONFIG_UPDATED, config._);

        // Currently restarting server is equivalent to stopping old server and
        // creating a new instance
        restartDaemon();
    });
});

ipcMain.on(Mch.UPDATE_APP, () => {
    console.log("Request to install update.");

    cleanup().then(() => {
        autoUpdater.quitAndInstall();
    });
});

/* Autoupdater events help in managin renderer UI */
autoUpdater.on("update-downloaded", info => {
    mainWindow.webContents.send(Rch.UPDATE_AVAILABLE, info);
});

/* Listeners for app events */

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

app.on("will-quit", e => {
    e.preventDefault();

    console.log(`App quit initiated. Cleaning up`);

    cleanup().then(() => {
        app.exit();
    });
});
