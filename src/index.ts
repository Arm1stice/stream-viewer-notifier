// Import electron modules
import { app, BrowserWindow, ipcMain } from "electron"

var log = require("electron-log")

import * as path from "path"

// Import auto updater
import { autoUpdater } from "electron-updater";

// Views path
var views = path.join(__dirname, "..", "views")

var loadingWindow: BrowserWindow;
var applicationWindow: BrowserWindow;

log.transports.console.level = "debug"
log.transports.file.level = "debug"

autoUpdater.logger = null
// Once ready
app.on("ready", () => {
    // Prepare the loading screen
    log.debug("Application has emitted 'ready'. Preparing loading window")
    loadingWindow = new BrowserWindow({
        width: 400,
        height: 200,
        show: false,
        frame: false
    })
    loadingWindow.loadURL(path.join(views, "loadingScreen.html"))
    loadingWindow.webContents.on("did-finish-load", () => {
        loadingWindow.show()
        log.debug("Loading window has indicated that the content is ready to be displayed. Showing...")

        // When there is an error checking for updates
        autoUpdater.once("error", (err) => {
            loadingWindow.webContents.send("updateError", true)
            log.error("Update error")
            log.error(err)
            log.debug("Starting in 3 seconds")
            autoUpdater.removeAllListeners()
            setTimeout(function () {
                startApplication();
            }, 3000)
        })

        // When there isn't an update available
        autoUpdater.once("update-not-available", (info) => {
            log.debug("We are already up to date, starting...")
            autoUpdater.removeAllListeners()
            startApplication();
        });

        // When there is an update available
        autoUpdater.once("update-available", (info) => {
            loadingWindow.webContents.send("updateAvailable", info.version)
            log.debug("An update is available: " + info.version)
        });

        // Once downloaded, send to the client, then quit after 5 seconds
        autoUpdater.on("update-downloaded", () => {
            loadingWindow.webContents.send("updateDownloaded", true)
            log.debug("Finished downloading. Installing in 5 seconds...")
            setTimeout(() => {
                autoUpdater.quitAndInstall();
            }, 5000);
        })

        autoUpdater.checkForUpdates()
    })

})

// Quit once all windows are closed
app.on("window-all-closed", () => {
    app.quit()
})

// Log when quitting
app.on("before-quit", () => {
    log.debug("Quitting...")
})

function startApplication() {
    log.debug("Starting application...")
    applicationWindow = new BrowserWindow({
        width: 750,
        height: 500,
        show: false
    })
    applicationWindow.loadURL(path.join(views, "application.html"))
    log.debug("Loading the page...")
    ipcMain.once("app-ready", () => {
        log.debug("Page called 'ready'")
        loadingWindow.hide();
        applicationWindow.show();
        loadingWindow.once("closed", () => {
            log.debug("Loading window closed")
            loadingWindow = null;
        })
        loadingWindow.close();
    })
    ipcMain.on("app-debug", () => {
        applicationWindow.webContents.openDevTools({mode: "detach"})
    })
}

// Single instance only
var lock = app.requestSingleInstanceLock()
if(!lock){
    app.quit();
}else{
    app.on('second-instance', () => {
        if(applicationWindow != null){
            applicationWindow.restore();
            applicationWindow.focus();
        }
    });
}
