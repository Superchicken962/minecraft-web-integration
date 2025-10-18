const { Client, Message, Colors } = require("discord.js");
const gameDig = require('gamedig');
const fs = require("node:fs");
const path = require("node:path");
const { Server } = require("socket.io");
const config = require("./config.json");
const { default: axios } = require("axios");
const dotNotes = require("dot-notes");
const secret = require("./secret.json");
const fetch = require("node-fetch");
const package = require("./package.json");
const { minecraftServer } = require("./DataStorage");
const { ProjectFileUpdater } = require("./classes/ProjectUpdater");

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
     * Timeout of server info updater.
     */
    updateTimeout: null,

    /**
     * Update server information.
     * 
     * @param { Client } client - Discord bot client.
     * @param { Server } io - Socket io server.
     * @returns 
     */
    update: async function(client, io) {
        const setUpdateTimeout = () => {
            this.updateTimeout = setTimeout(() => {
                this.update(client, io);
            }, (cfg.settings?.serverUpdateInterval || 90)*1000);
        };

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
            // Server is offline - set update timeout again.
            setUpdateTimeout();
            return;
        }

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
                    "title": (server.name ?? "A Minecraft Server"),
                    "footer": {
                        "text": `${cfg.server.ip}:${cfg.server.port}`
                    },
                    "color": Colors.Green,
                    "timestamp": new Date().toISOString(),
                    "fields": embedFields
                }
            ]
        });

        setUpdateTimeout();
    },

    /**
     * Sends status message.
     * 
     * @param { import("discord.js").Channel } channel - Channel to send message to.
     * @returns { Promise<Message> } Newly sent message.
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
     * Ask the minecraft server something over the socket.
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
        if (!data.authToken) data.authToken = secret.socketAuthToken;
    
        this.socketAwaitingResponse[data.id] = {
            callback
        }

        if (typeof timeout === "function") {
            this.socketAwaitingResponse[data.id].timeout = setTimeout(timeout, timeoutAfter*1000);
        }

        socket.emit("askServer", data);
    },

    /**
     * Listen for an event from the minecraft server socket.
     * 
     * @param { Server } socket - Socket server.
     * @param { String } event - Event name.
     * @param { (data: Object) => {} } callback - Callback function.
     */
    listenFor: function(socket, event, callback) {
        socket.on(event, callback);
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
 * Gets the keys of an object (recurse) - each levels of depth are represented by fullstops.
 * 
 * @param { Object } obj - Object to get keys of.
 * @returns { Promise<Object> } Object of object paths with values.
 */
async function getDeepObjectKeys(obj) {
    return new Promise((resolve) => {
        const paths = {};

        dotNotes.recurse(obj, (key, value, path) => {
            // Remove the [0] so that array fields are shown as normal.
            //path = path.replaceAll("[0]", "");

            paths[path] = value;
        });

        resolve(paths);
    });
}

/**
 * Get a key value pair of fields that are required in secret.json for the app to work. Key is field name, and value is a short description.
 * 
 * @returns { Object }
 */
function getRequiredSecretConfigFields() {
    return {
        "clientId": {desc: "Discord application client id"},
        "clientSecret": {desc: "Discord application client secret"},
        "guildId": {desc: "Id of Discord server to use"},
        "token": {desc: "Discord bot token"},
        "webhookURL": {desc: "Discord webhook to send logs to"},
        "socketAuthToken": {desc: "Authentication token for socket - must match token given in plugin (config.yml)"},
        "redirectUrl": {desc: "Essentially the website url in config.json - used to redirect after logging in through Discord."}
    };
}

function BooleanConvert(value) {
	return !!value && value != "false";
}

/**
 * Get a key value pair of fields that are required in config.json for the app to work. Key is field name, and value is a short description.
 * 
 * @returns { Object }
 */
function getRequiredConfigFields() {
    return {
        "web.port": { desc: "The port for the webserver to run on (default = 80)", requiresRestart: true, default: 80, type: Number },
        "settings.serverUpdateInterval": {desc: "The interval (in seconds) for the server info to be updated on Discord", requiresRestart: false, default: 90, type: Number},
        "settings.url": {desc: "The website url", requiresRestart: true},
        "settings.requireLoginForAccess": {desc: "Should users have to login with Discord to use the site?", requiresRestart: true, default: false, type: BooleanConvert},
        "settings.admins": {desc: "Discord ids that should be given admin access - separated by commas (must contain at least one id).", requiresRestart: true, type: Array},
        "server.ip": {desc: "Minecraft server ip", requiresRestart: true, default: "127.0.0.1"},
        "server.port": {desc: "Minecraft server port", requiresRestart: true, default: "25565"},
        "server.memory": {desc: "Memory to allocate the minecraft server (in gigabytes)", requiresRestart: true, default: 2, type: Number},
        "server.pathTo": {desc: "Path to the server .jar file", requiresRestart: true, default: ""},
        "features.discordChatRelay.enabled": {desc: "Enable chat relay between discord and the minecraft server.", requiresRestart: true, default: true, type: BooleanConvert},
        "features.discordChatRelay.channelId": {desc: "Channel to use for chat relay - use command mc!relay in a discord channel to set it.", requiresRestart: true, required: false},
        "features.logging.death": {desc: "Log player deaths?", requiresRestart: true, default: true, type: BooleanConvert},
        "features.logging.join": {desc: "Log player joins?", requiresRestart: true, default: true, type: BooleanConvert},
        "features.logging.disconnect": {desc: "Log player disconnects?", requiresRestart: true, default: true, type: BooleanConvert},
        "features.logging.chat": {desc: "Log player chat?", requiresRestart: true, default: true, type: BooleanConvert}
    };
}

/**
 * Validates all possible configurations and returns array of valid/invalid options.
 * 
 * @returns { Promise<{ configurations: Object, isValid: Boolean }> } Object of configuration options.
 */
async function validateConfigurations() {
    const configurations = {
        "secretFile": {
            "exists": false,
            "valid": false,
            "fields": {}
        },
        "configFile": {
            "exists": false,
            "valid": false,
            "fields": {}
        }
    }

    const secretFilePath = path.join(__dirname, "secret.json");
    const configFilePath = path.join(__dirname, "config.json");

    // If secret.json exists, run through validations for the fields.
    if (fs.existsSync(secretFilePath)) {
        configurations.secretFile.exists = true;
    
        let secrets = await fs.promises.readFile(secretFilePath, "utf-8");
    
        try {
            secrets = JSON.parse(secrets);

            configurations.secretFile.valid = true;
        
            const requiredFields = Object.keys(getRequiredSecretConfigFields());
        
            // Check if secrets file contains field, and if so then set it to true in configuration validation check.
            for (const field of requiredFields) {
                configurations.secretFile.fields[field] = !!secrets[field];
            }

        } catch (error) {
            configurations.secretFile.valid = false;
        }
    
    }

    // If config.json exists, run through validations for the fields.
    if (fs.existsSync(configFilePath)) {
        configurations.configFile.exists = true;

        configFields = await fs.promises.readFile(configFilePath, "utf-8");

        try {
            configFields = JSON.parse(configFields);

            configurations.configFile.valid = true;

            const requiredFields = Object.keys(getRequiredConfigFields());
            const fields = Object.keys(await getDeepObjectKeys(configFields));

            for (const field of requiredFields) {
                // Split at [ so that array types are checked properly.
                configurations.configFile.fields[field] = !!fields.find(f => f.split("[")[0] === field);
            }

        } catch (error) {
            configurations.configFile.valid = false;
        }
    }

    const isValid = getAllValuesInObj(configurations).every(conf => conf === true);

    return {configurations, isValid};
}

/**
 * Gets the url from config.json
 */
function getBaseUrl() {
    // If url is not on config, fallback to secret.
    try {
        const url = new URL(config.settings?.url ?? secret.redirectUrl);

        // If port is given in config, set/replace the one in the url.
        if (config.web?.port) url.port = config.web?.port;

        return url.href.endsWith("/") ? url.href.slice(0, -1) : url.href;
    } catch {
        console.warn("Invalid URL provided in config/secret!");
        return "";
    }
}

const discordAuth = {
    /**
     * Sends an authentication request to discord to login.
     * 
     * @param { String } clientId - Discord client id
     * @param { String } clientSecret - Discord client secret
     * @param { String } redirectUrl - Url to redirect to (must match discord)
     * @param { String } code - Code returned from discord
     * @returns { Promise<axios.AxiosResponse> } Response from Discord
     */
    authenticate: async function(clientId, clientSecret, redirectUrl, code) {
        return await axios.post("https://discord.com/api/oauth2/token",
            new URLSearchParams({
                "client_id": clientId,
                "client_secret": clientSecret,
                "grant_type": "authorization_code",
                "redirect_uri": redirectUrl,
                "code": code
            }).toString(),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );
    },

    /**
     * Fetch logged in user discord info.
     * 
     * @param { String } tokenType - Token type from authentication.
     * @param { String } accessToken - Access token from authentication.
     * @returns { Promise<axios.AxiosResponse> } Response from Discord.
     */
    getInfo: async function(tokenType, accessToken) {
        return await axios.get("https://discord.com/api/users/@me", {
            "headers": {
                "authorization": `${tokenType} ${accessToken}`
            }
        });
    }
};

/**
 * Converts gigabytes into megabyte memory format for minecraft server.
 * 
 * @param { Number } gb - Gigabytes to convert.
 * @returns { Number } Memory to allocate server in megabytes.
*/
function calculateMemory(gb) {
    return gb*1024;
}

/**
 * Checks if given id is in the config as an admin.
 * 
 * @param { String } id - User's Discord id.
 * @returns { Boolean } Is user an admin?
 */
function isAdmin(id) {
    return config?.settings?.admins?.includes(id);
}

/**
 * Get admin count.
 * 
 * @returns { Number }
 */
function getAdminCount() {
    return Array.isArray(config?.settings?.admins) ? config.settings.admins.length : 0;
}

/**
 * Reads and parses a json file at a given path.
 * 
 * @param { String } path - Path to file.
 * @returns { Promise<Object> } Parsed JSON, empty if invalid.
 */
async function readJsonFile(path) {
    if (!fs.existsSync(path)) {
        return {};
    }

    const content = await fs.promises.readFile(path);

    try {
        const data = JSON.parse(content);
        return data;
    } catch (error) {
        return {};
    }
}

/**
 * Parses given string config data into an object, converting types using given required fields data.
 * 
 * @param { Object } data - Data to parse.
 * @param { Object } required - Data to compare the fields to, and get types from.
 */
function parseConfigFormSaveData(data, required) {
    const parsed = {};

    for (const [key, val] of Object.entries(data)) {
        const matchingRequired = required[key];
        if (!matchingRequired) continue;

        const type = matchingRequired.type || String;

        // Convert to correct type by calling it as a function.
        let value = type(val);

        // If type is an array, split the value into one.
        if (type === Array) {
            value = val.split(",").map(i => i.trim());
        }

        dotNotes.create(parsed, key, value);
    }

    return parsed;
}

/**
 * Essentially combines values from two objects into one. Duplicate keys will take value from the foreign object.
 * 
 * @param { Object } local - Object to put values into.
 * @param { Object } foreign - Object to take values from.
 */
function combineObjects(local, foreign) {
    for (const [key, val] of Object.entries(foreign)) {
        local[key] = val;
    }
}

/**
 * Reads directory down each folder path.
 * 
 * @param { String } path - Root path. 
 * @param { String[] } ignore - Array of directories to ignore.
 * @param { Boolean } useFullPath - Return the full path to each file in the directory?
 */
async function deepReadDirectory(rootPath, ignore = [], useFullPath = true) {
    let fileList = [];
    const dir = await fs.promises.readdir(rootPath, { withFileTypes: true });

    for (const file of dir) {
        const pth = (useFullPath) ? path.join(rootPath, file.name) : file.name;

        // If "file" is a directory, then recursively search into it.
        if (file.isDirectory() && !ignore?.includes(file.name)) {
            fileList = fileList.concat(await deepReadDirectory(pth));
            continue;
        }

        fileList.push(pth);
    }

    return fileList;
}

/**
 * Get the latest available version from github.
 * 
 * @returns { Promise<Object> } Package.json contents.
 */
async function getLatestProjectVersion() {
    const RAW_FILE_URL = "https://raw.githubusercontent.com/Superchicken962/minecraft-web-integration/refs/heads/main/integration/package.json";

    const req = await fetch(RAW_FILE_URL);
    if (!req.ok) {
        console.warn("Error getting latest project from github!");
        return {};
    }

    return req.json();
}

/**
 * Check if the project is up to date.
 * 
 * @returns { Promise<{ upToDate: Boolean, latestVersion: Object }> } Results
 */
async function checkProjectUpToDate() {
    const latestVersion = await getLatestProjectVersion();
    const obj = {
        upToDate: true,
        latestVersion
    };

    if (package.version !== latestVersion?.version) {
        obj.upToDate = false;
    }

    return obj;
}

const adminSocket = {
    listeners: {},

    /**
     * Add a listener for an event from the admin socket.
     */
    listenFor: function(event, callback) {
        this.listeners[event] = callback;
    },

    /**
     * Gets listener with event.
     * 
     * @param { String } event
     * @returns { Function | null } 
     */
    getListener: function(event) {
        if (!(event in listeners)) return null;

        return this.listeners[event];
    },

    /**
     * Checks given event and if it matches a listener, calls it. 
     * 
     * @param { String } event 
     * @param  { ...any } args 
     */
    handler: function(event, ...args) {
        if (!(event in this.listeners) || typeof this.listeners[event] !== "function") return null;

        return this.listeners[event](...args);
    }
};

const projectUpdateStatus = {
    updating: false,
    logs: []
};

/**
 * Update project.
 * 
 * @param { (msg: String, data: Object) => {} } onprogress - On progress event. 
 */
async function updateProject(onprogress) {
    if (projectUpdateStatus.updating) {
        console.warn("Project already updating!");
        return;
    }

    projectUpdateStatus.updating = true;
    projectUpdateStatus.logs = [];

    const progress = (message, data) => {
        projectUpdateStatus.logs.push({ ...data, message});
        onprogress?.(message, data);
    }

    if (minecraftServer.running) {
        progress("Stopping minecraft server...", {});
        await minecraftServer.stop();
    }

    progress("Starting update...", {});

    const newVersion = (await getLatestProjectVersion()).version;

    const updater = new ProjectFileUpdater(["config.json", "secret.json"], newVersion);
    await updater.update((msg) => {
        progress(msg, {});
    });

    progress("Update complete!", {});
    progress("Please restart website if it does not do it automatically!", {});

    projectUpdateStatus.updating = false;

    setTimeout(() => {
        process.exit(0);
    }, 2500);
}

module.exports = {
    serverInfo,
    askSocket,
    formatPlayTime,
    validateConfigurations,
    getRequiredSecretConfigFields,
    getRequiredConfigFields,
    getBaseUrl,
    discordAuth,
    calculateMemory,
    isAdmin,
    readJsonFile,
    getDeepObjectKeys,
    parseConfigFormSaveData,
    combineObjects,
    deepReadDirectory,
    getLatestProjectVersion,
    checkProjectUpToDate,
    adminSocket,
    updateProject,
    projectUpdateStatus,
    getAdminCount
};