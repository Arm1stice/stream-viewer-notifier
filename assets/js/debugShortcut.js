var keyboardJS = require("keyboardjs");
keyboardJS.bind("ctrl + shift + d", () => {
    ipcRenderer.send("app-debug", true)
})