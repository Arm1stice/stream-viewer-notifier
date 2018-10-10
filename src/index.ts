// Import electron modules
import {app, BrowserWindow} from "electron"

import * as log from  "electron-log"
import * as path from "path"

// Import auto updater
import {autoUpdater, NoOpLogger} from "electron-updater";

// Views path
var views = path.join(__dirname, "..", "views")

autoUpdater.logger = log

// Once ready
app.on("ready", () => {
    // Prepare the loading screen
    log.debug("Application has emitted 'ready'. Preparing loading window")
    var loadingWindow = new BrowserWindow({
        width: 400,
        height: 200,
        show: false,
        frame: false
    })
    loadingWindow.loadURL(path.join(views, "loadingScreen.html"))
    loadingWindow.once("ready-to-show", () => {
        loadingWindow.show()
        log.debug("Loading window has indicated that the content is ready to be displayed. Showing...")

        // When there is an error checking for updates
        autoUpdater.once("error", (err) => {
            loadingWindow.webContents.send("updateError", null)
            setTimeout(function(){
                log.error("Update error")
                log.error(err)
                log.debug("Starting in 5 seconds")
                autoUpdater.removeAllListeners()
                // startApplication();
            })
        })

        // When there isn't an update available
        autoUpdater.once("update-not-available", (info) => {
            log.debug("We are already up to date, starting...")
            autoUpdater.removeAllListeners()
            // startApplication();
        });

        // When there is an update available
        autoUpdater.once("update-available", (info) => {
            loadingWindow.webContents.send("updateAvailable", info.version)
            log.debug("An update is available: " + info.version)
        });
        
        // Send progress updates
        autoUpdater.on("download-progress", (info) => {
            loadingWindow.webContents.send("updateProgress", info.percent)
            log.debug("Update progress: " + info.progress + "% (" + info.transferred + "/" + info.total + ")")
        })

        // Once downloaded, send to the client, then quit after 5 seconds
        autoUpdater.on("update-downloaded", () => {
            loadingWindow.webContents.send("updateDownloaded", true)
            log.debug("Finished downloading. Installing in 5 seconds...")
            setTimeout(() => {
                autoUpdater.quitAndInstall();
            }, 5000);
        })

        // TODO: autoUpdater.checkForUpdates()
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