import { app, BrowserWindow } from "electron";
import * as Path from "path";
import * as Url from "url";

import Server from "../core/daemon/server";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Reference to server
let server;

// Use dev server in development mode
let htmlUrl = Url.format({
    pathname: Path.resolve("dist", "index.html"),
    protocol: "file:",
    slashes: true
});
if (process.env.APP_ENV === "development") {
    htmlUrl = Url.format({
        pathname: "localhost:1234/",
        protocol: "http:",
        slashes: true
    });
}

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        show: false
    });

    // and load the index.html of the app.
    mainWindow.loadURL(htmlUrl);

    if (process.env.APP_ENV === "development") {
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
        });
}

function createServer() {}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});
