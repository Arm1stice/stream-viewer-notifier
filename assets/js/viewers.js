var settings = require("electron").remote.require("electron-settings")

var username = settings.get('username')
var chatters = []
$(document).ready(function () {
    if (username === undefined) {
        // The user hasn't set their Twitch username, we need to prompt them for this
        $("#usernameModal").modal({
            backdrop: "static",
            keyboard: false,
            show: true
        });
        $("#settingsCancel").hide();
    } else {
        reloadData()
    }
    ipcRenderer.send("app-ready", true)
    $("#settingsSave").click(function () {
        var val = $("#settingsUsername").val()
        if (val == "") {
            alert("You must enter a username")
            return
        } else {
            username = val
            settings.set("username", val)
            $("#usernameModal").modal('hide')
            $("#settingsCancel").show()
            reloadData()
        }
    })
    $("#openSettings").click(function () {
        $("#settingsUsername").val(username)
        $("#usernameModal").modal({
            backdrop: "static",
            keyboard: false,
            show: true
        });
    })
    $("#debug").click(function () {
        ipcRenderer.send("app-debug", true)
    })
})

var timer = null;

function reloadData() {
    $("#headerUsername").text(username)
    $("#notificationsList").empty()
    if (timer != null) {
        clearInterval(timer);
    }
    timer = setInterval(check, 30000)
    check();
}

var notificationColor = false; // False = #192f53 True = White
function addNotification(message) {
    var notification = $("<div class='notification-" + (notificationColor ? "light" : "dark") + "'>" + message +
        "</div>").hide();
    notificationColor = !notificationColor;
    $("#notificationsList").prepend(notification);
    notification.show('slow');
}

function check() {
    axios.get("https://tmi.twitch.tv/group/user/" + username.toLowerCase() + "/chatters").then(function (response) {
        var data = response.data
        console.log(data)
        $("#numberChatters").text(data.chatter_count)
        var newChatters = []
        newChatters = newChatters.concat(data.chatters.vips)
        newChatters = newChatters.concat(data.chatters.moderators)
        newChatters = newChatters.concat(data.chatters.staff)
        newChatters = newChatters.concat(data.chatters.admins)
        newChatters = newChatters.concat(data.chatters.global_mods)
        newChatters = newChatters.concat(data.chatters.viewers)

        var left = []
        for (var i = 0; i < chatters.length; i++) {
            if (newChatters.indexOf(chatters[i]) == -1) {
                left.push(chatters[i])
            }
        }

        var joined = []
        for (var j = 0; j < newChatters.length; j++) {
            if (chatters.indexOf(newChatters[j]) == -1) {
                joined.push(newChatters[j])
            }
        }

        chatters = newChatters;
        if (left.length == 0 && joined.length == 0) return;

        var leftString = null;
        if (left.length != 0) {
            leftString = "<b>Left (" + left.length + "):</b> "
            for (var k = 0; k < left.length; k++) {
                if (k == 0) {
                    leftString += left[k]
                } else if (k == left.length - 1) {
                    leftString += ", and " + left[k]
                } else {
                    leftString += ", " + left[k]
                }
            }
        }
        var joinedString = null;
        if (joined.length != 0) {
            joinedString = "<b>Joined (" + joined.length + ") :</b> "
            for (var l = 0; l < joined.length; l++) {
                if (l == 0) {
                    joinedString += joined[l]
                } else if (k == joined.length - 1) {
                    joinedString += ", and " + joined[l]
                } else {
                    joinedString += ", " + joined[l]
                }
            }
        }
        if (joinedString == null && leftString != null) {
            addNotification(leftString)
        } else if (leftString == null && joinedString != null) {
            addNotification(joinedString)
        } else {
            addNotification(joinedString + "<br>" + leftString)
        }
    }).catch(function (err) {
        throw err;
        alert("Error checking for chatters")
    })
}