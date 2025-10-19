const { Colors, Message } = require("discord.js");
const fetch = require("node-fetch");
const { serverInfo } = require("./functions");

function sendToLogsChannel(type, log) {
    const webhookURL = require("./secret.json")?.webhookURL;
    if (!webhookURL) {
        console.warn("Webhook URL not provided!");
        return;
    }

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
    });
}

/**
 * Runs a command from a discord chat message.
 * 
 * @param { Message } message - Chat message.
 * @returns { Promise<Boolean> } Was a valid command found and run?
 */
async function runCommand(message) {
    const cfg = await serverInfo.readConfig();

    // This command will create a new message for updating and store it in config.
    if (message.content.startsWith("mc!here")) {
        try {
            await message.delete();
        } catch {};

        const sentMsg = await serverInfo.sendMessage(message.channel, "Server updates will be shown here...");

        // Store current channel id in config.
        cfg.message = {
            channelId: message.channel.id,
            messageId: sentMsg.id
        };
        
        serverInfo.updateConfig(cfg);
        return true;
    } else if (message.content.startsWith("mc!relay")) {
        // Ensure the parent objects have been made before setting. TODO: Make this into a function.
        cfg.features = (cfg.features || {});
        cfg.features.discordChatRelay = (cfg.features.discordChatRelay || {});

        cfg.features.discordChatRelay.channelId = message.channel.id;

        await serverInfo.updateConfig(cfg);

        const reply = await message.reply({
            "content": "Discord chat relay will now use this channel!"
        });

        setTimeout(() => {
            try {
                message.delete();
            } catch {}
            reply.delete();
        }, 3000);

        return true;
    }

    return false;
}

module.exports = { sendToLogsChannel, runCommand };