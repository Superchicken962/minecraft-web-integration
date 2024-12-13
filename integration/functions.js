const { Client, Message, Colors } = require("discord.js");
const gameDig = require('gamedig');
const fs = require("node:fs");
const path = require("node:path");
const { Server } = require("socket.io");

const serverInfo = {
    readConfig: async function() {
        const readCfg = await fs.promises.readFile(path.join(__dirname, "config.json"), {encoding:"utf-8"});
        let cfg = {};

        try {
            cfg = JSON.parse(readCfg);
        } catch (error) {
            console.error("Error parsing config.json!");
        }

        return cfg;
    },

    /**
     * Updates the config file.
     * 
     * @param { Object } data - Data object.
     */
    updateConfig: async function(data) {
        const filePath = path.join(__dirname, "config.json");
        await fs.promises.writeFile(filePath, JSON.stringify(data, null, 4), {"encoding": "utf-8"});
    },

    /**
     * Update server information.
     * 
     * @param { Client } client - Discord bot client.
     * @param { Server } io - Socket io server.
     * @returns 
     */
    update: async function(client, io) {
        let cfg = await this.readConfig();

        if (!cfg.server?.ip || !cfg.server?.port) {
            console.error("Missing server details in config file!");
            return;
        }

        // Resend message if it is not stored in config.
        if (!cfg.message || !cfg.message.channelId) {
            console.warn("No channel for server status provided! Type mc!here in a chosen channel to select it!");
            return;
        }
    
        let channel;

        try {
            channel = await client.channels.fetch(cfg.message?.channelId, {"force": true});
        } catch (error) {
            console.error(`${error.name}: Choose a valid channel by typing mc!here in a channel to select it!`);
            return;
        }

        let messageId = cfg.message.messageId;

        // If message id isn't set, then send a message and get it's id.
        if (!messageId) {
            messageId = (await this.sendMessage(channel)).id;
            cfg.message.messageId = messageId;
        }

        /** @type { Message } */
        let message;
    
        try {
            message = await channel.messages.fetch(messageId);
        } catch (error) {
            console.warn("Message not found - sending a new one!");

            message = await this.sendMessage(channel);
            cfg.message.messageId = message.id;
        }

        await this.updateConfig(cfg);

        /** @type { import("gamedig").QueryResult } */
        let server;

        try {
            server = await gameDig.query({
                "host": cfg.server.ip,
                "port": cfg.server.port,
                "type": "minecraft"
            });
        } catch (error) {
            console.log("Server is offline");
            return;
        }

        console.log(server);

        const embedFields = [];

        embedFields.push({
            "name": "Players",
            "value": `${server.players.length}/${server.maxplayers}`
        });

        // Store player fields here because it needs to be "clearable" when server responds with data.
        const embedPlayerFields = [];

        if (server.players.length > 0) {
            const playerNames = server.players.map(player => player.name).join("\n");

            embedPlayerFields.push({
                "name": "Name",
                "value": playerNames,
                "inline": true
            }, {
                "name": "Ping",
                "value": "N/A",
                "inline": true
            }, {
                "name": "Time",
                "value": "N/A",
                "inline": true
            });

            // Wait for socket response before editing message.
            await new Promise((resolve) => {
    
                askSocket.askServer(io.of("/server"), "getOnlinePlayers", (data) => {
                    console.log("!! Got online players", data);
                    embedPlayerFields.length = 0;

                    const playerNames = [];
                    const playerTimes = [];
                    const playerPing = [];
    
                    for (const player of data.onlinePlayers) {
                        playerNames.push(player.username);
                        playerTimes.push(formatPlayTime(player.time));
                        playerPing.push(player.ping);
                    }

                    embedPlayerFields.push(
                    {
                        "name": "Username",
                        "value": playerNames.join("\n"),
                        "inline": true
                    },
                    {
                        "name": "Time",
                        "value": playerTimes.join("\n"),
                        "inline": true
                    },
                    {
                        "name": "Ping",
                        "value": playerPing.join("\n"),
                        "inline": true
                    });

                    resolve();
                }, () => {
                    console.log("No response from server - falling back to queried player data.");
                    resolve();
                }, 8);
            });

            // Transfer player fields to regular fields array.
            embedPlayerFields.forEach(field => embedFields.push(field))
        }

        // Edit the message to include the server stats.
        message.edit({
            "content": "",
            "embeds": [
                {
                    "title": (server.name || "A Minecraft Server"),
                    "footer": {
                        "text": `${cfg.server.ip}:${cfg.server.port}`
                    },
                    "color": Colors.Green,
                    "timestamp": new Date().toISOString(),
                    "fields": embedFields
                }
            ]
        });


        setTimeout(() => {
            this.update(client, io);
        }, (cfg.settings?.serverUpdateInterval || 90)*1000);
    },

    /**
     * Sends status message.
     * 
     * @param { import("discord.js").Channel } channel - Channel to send message to.
     * @returns { Message } Newly sent message.
     */
    sendMessage: async function(channel) {
        // Send just a fullstop for the message will be edited shortly after.
        const msg = await channel.send(".");
        return msg;
    }
}

function randomCode(length = 6) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGIJKLMOPQRSTUVWXYZ0123456789!#";
    let code = "";

    for (let i = 0; i < length; i++) {
        const randomChar = chars[Math.floor(Math.random() * chars.length)];
        code += randomChar;
    }

    return code;
}

const askSocket = {
    socketAwaitingResponse: {},

    /**
     * 
     * @param { Server } socket - Socket server.
     * @param { String | Object } event - Event name or data.
     * @param { (data: Object) => {} } callback - Callback function.
     * @param { () => {} } timeout - Timeout function (function to call when/if response times out).
     * @param { Number } timeoutAfter - Seconds until response times out after sending.
     */
    askServer: function(socket, event, callback, timeout, timeoutAfter = 90) {
        let data = {};
    
        if (typeof event === "object") {
            data = event;
        } else {
            data.event = event;
        }
    
        if (!data.id) data.id = randomCode(16);
    
        this.socketAwaitingResponse[data.id] = {
            callback
        }

        if (typeof timeout === "function") {
            this.socketAwaitingResponse[data.id].timeout = setTimeout(timeout, timeoutAfter*1000);
        }

        socket.emit("askServer", data);
    }
};

/**
 * Formats play time into string.
 * 
 * @param { Number } time - Play time in miliseconds.
 * @returns { String } Formatted time string.
 */
function formatPlayTime(time) {
    const seconds = Math.floor(time/1000);
    const minutes = Math.floor(time/1000/60);
    const hours = Math.floor(time/1000/60/60);

    let timeStr = `${seconds}s`;

    if (seconds >= 60) {
        timeStr = `${minutes%60}m ${seconds%60}s`;
    }

    if (minutes >= 60) {
        timeStr = `${hours}h ${minutes%60}m`;
    }

    return timeStr;
}

/**
 * Gets all shallow and deep values from an object and returns as an array..
 * 
 * @param { Object } obj - Object to search through.
 * @returns { any[] } List of values.
 */
function getAllValuesInObj(obj) {
    const values = [];

    const checkValues = (object) => {
        for (const value of Object.values(object)) {
            if (typeof value === "object") {
                checkValues(value);
            } else {
                values.push(value);
            }
        }
    };

    checkValues(obj);

    return values;
}

/**
 * Get a key value pair of fields that are required in secret.json for the app to work. Key is field name, and value is a short description.
 * 
 * @returns { Object }
 */
function getRequiredSecretConfigFields() {
    return {
        "clientId": "Discord application client id",
        "clientSecret": "Discord applciation client secret",
        "guildId": "Id of Discord server to use",
        "token": "Discord bot token",
        "webhookURL": "Discord webhook to send logs to",
        "socketAuthToken": "Authentication token for socket - must match token given in plugin (config.yml)"
    };
}

/**
 * Validates all possible configurations and returns array of valid/invalid options.
 * 
 * @returns { {configurations: Object, isValid: Boolean} } Object of configuration options.
 */
async function validateConfigurations() {
    const configurations = {
        "secretFile": {
            "exists": false,
            "valid": false,
            "fields": {}
        }
    }

    const secretFilePath = path.join(__dirname, "secret.json");

    if (!fs.existsSync(secretFilePath)) {
        return configurations;
    }

    configurations.secretFile.exists = true;

    let secrets = await fs.promises.readFile(secretFilePath, "utf-8");

    try {
        secrets = JSON.parse(secrets);
    } catch (error) {
        return configurations;
    }

    configurations.secretFile.valid = true;

    const requiredFields = Object.keys(getRequiredSecretConfigFields());

    // Check if secrets file contains field, and if so then set it to true in configuration validation check.
    for (const field of requiredFields) {
        configurations.secretFile.fields[field] = !!secrets[field];
    }
    
    const isValid = getAllValuesInObj(configurations).every(conf => conf === true);

    return {configurations, isValid};
}

module.exports = { serverInfo, askSocket, formatPlayTime, validateConfigurations, getRequiredSecretConfigFields };