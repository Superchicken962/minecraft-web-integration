const { Colors } = require("discord.js");
const fetch = require("node-fetch");

function sendToLogsChannel(type, log) {
    var webhookURL = require("./config.json").webhookURL;
    const parameters = {
        username: "Unhandled Event",
        avatar_url: "",
        content: `The '${type}' event is being sent but not handled!`
    };

    if (type === "chat") {
        parameters.username = "Player Chat";
        parameters.content = "";
        parameters.embeds = [
            {
                "description": log.message.content,
                "color": Colors.Gold,
                "author": {
                    "name": log.sender.username,
                    "icon_url": `https://minotar.net/helm/${log.sender.username}`
                },
                "timestamp": new Date(parseInt(log.event.time)).toISOString(),
            }
        ];
    } else if (type === "join") {
        parameters.username = "Player Join";
        parameters.content = "";
        parameters.embeds = [
            {
                "description": log.event.message.replace("%p", log.player.username),
                "color": Colors.Green,
                "author": {
                    "name": log.player.username,
                    "icon_url": `https://minotar.net/helm/${log.player.username}`
                },
                "timestamp": new Date(parseInt(log.event.time)).toISOString(),
            }
        ];
    }  else if (type === "leave") {
        parameters.username = "Player Disconnect";
        parameters.content = "";
        parameters.embeds = [
            {
                "description": log.event.message.replace("%p", log.player.username),
                "color": Colors.Red,
                "author": {
                    "name": log.player.username,
                    "icon_url": `https://minotar.net/helm/${log.player.username}`
                },
                "timestamp": new Date(parseInt(log.event.time)).toISOString(),
            }
        ];
    } else if (type === "player_death") {
        parameters.username = "Player Death";
        parameters.content = "";
        parameters.embeds = [
            {
                "description": log.event.deathMessage.replace("%p", log.player.username).replace("%k", log.killer.username),
                "color": Colors.Red,
                "author": {
                    "name": log.player.username,
                    "icon_url": `https://minotar.net/helm/${log.player.username}`
                },
                "timestamp": new Date(parseInt(log.event.time)).toISOString(),
            }
        ];
    } else if (type === "server_start") {
        parameters.username = "Server Status";
        parameters.content = "";
        parameters.embeds = [
            {
                "title": log.event.message,
                "color": Colors.Green,
                "timestamp": new Date(parseInt(log.event.time)).toISOString(),
            }
        ]
    } else if (type === "player_advancement") {
        parameters.username = "Advancement";
        parameters.content = "";
        parameters.embeds = [
            {
                "title": `${log.player.username} has made the advancement [${log.event.advancement.name}]`,
                "color": Colors.Gold,
                "timestamp": new Date(parseInt(log.event.time)).toISOString(),
            }
        ]
    }

    fetch(webhookURL, {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify(parameters)
    }).then((a) => {
        // console.log(a);
    });
}

module.exports = { sendToLogsChannel };