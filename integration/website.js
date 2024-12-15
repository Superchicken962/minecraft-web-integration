const express = require("express");
const app = express.Router();
const fs = require("node:fs");
const path = require("path");
const secret = require("./secret.json");
const config = require("./config.json");

const discord = require("./discordFunctions");
const { Server } = require("socket.io");
const { askSocket, validateConfigurations, getRequiredSecretConfigFields, getRequiredConfigFields, calculateMemory } = require("./functions");

/** @type { Server } */
let io;

exports.register = function(socketIo) {
    io = socketIo;

    // Handle connection for server namespace.
    io.of("/server").on("connection", (socket) => {
        const authorised = (socket.handshake.auth?.token === secret.socketAuthToken);
        console.log("new /server connection", {authorised});

        if (!authorised) {
            socket.disconnect(true);
            return;
        }

        socket.on("askServer:response", (data) => {
            // Check if id is awaiting response and if callback is provided.
            if (askSocket.socketAwaitingResponse[data.id] && typeof askSocket.socketAwaitingResponse[data.id].callback === "function") {
                askSocket.socketAwaitingResponse[data.id].callback(data);

                // Clear timeout if it exists so it is not thrown.
                const responseTimeout = askSocket.socketAwaitingResponse[data.id].timeout;
                if (responseTimeout) clearTimeout(responseTimeout);
            }

            delete askSocket.socketAwaitingResponse[data.id];
        });
    });
}

app.get(["/js/*", "/css/*"], (req, res, next) => {    
    let requestPath = req.path;

    // Remove a trailing '/' if it is there.
    if (requestPath.slice(-1) === "/") {
        requestPath = requestPath.slice(0, -1);
    }

    let filePath = path.join(__dirname, "views/"+requestPath);

    // If path is for a css file, but an extension is not given then we add the .css ourselves.
    if (requestPath.startsWith("/css") && !filePath.endsWith(".css")) {
        filePath += ".css";
    }
    // Do the same for JavaScript files.
    if (requestPath.startsWith("/js") && !filePath.endsWith(".js")) {
        filePath += ".js";
    }

    if (!fs.existsSync(filePath) || !filePath.endsWith(".css") && !filePath.endsWith(".js")) {
        next();
        return
    }

    res.sendFile(filePath);
});

app.use("*", (req, res, next) => {
    res.locals.session = req.session;
    res.locals.getDiscordAvatar = (userId, avatarId) => {
        return `https://cdn.discordapp.com/avatars/${userId}/${avatarId}`;
    }
    res.locals.isAdmin = () => {
        return config.settings.admins?.includes(req.session.discord?.id);
    }
    res.locals.calculateMemory = calculateMemory;

    next();
});

app.use("*", async(req, res, next) => {
    const configurations = await validateConfigurations();

    if (!configurations.isValid) {
        renderSetupPage(req, res, configurations);
        return;
    }

    next();
});

app.use("/login", require("./auth"));
app.get(["/logout", "/signout"], (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

app.get("/setup", async(req, res) => {
    const configurations = await validateConfigurations();
    renderSetupPage(req, res, configurations);
});

function renderSetupPage(req, res, configurations) {
    res.render("setupProject.html", {
        configurations: configurations.configurations,
        fieldDescriptions: {
            secret: getRequiredSecretConfigFields(),
            config: getRequiredConfigFields()
        }
    });
}


app.get("*", (req, res, next) => {
    // Show required login page if user is not logged in, and it is enabled.
    if (!req.session.isLoggedIn && config.settings?.requireLoginForAccess) {
        res.render("require_login.html");
        return;
    }

    next();
});

app.get("/", (req, res) => {
    res.render("index.html", {});
});

app.get("/logs", (req, res) => {

    var viewmode = null;
    var auth = null;

    if (req.session.viewMode) {
        viewmode = req.session.viewMode;
    }

    if (req.session.auth) {
        auth = req.session.auth;
    }

    var pastlogs = (recentLogs.slice(-20)); // get last 15 logs in the array
    res.render("logs.html", {recentLogs: pastlogs, viewmode: viewmode, auth: auth});
});

app.get("/mode/:mode", (req, res) => {
    var valid_modes = ["null", "normal", "admin"];
    var mode = req.params.mode;

    if (!valid_modes.includes(mode)) {
        res.redirect("/");
        return;
    };

    if (mode === "null") {
        mode = null;
        req.session.auth = null;
    }

    req.session.viewMode = mode;
    res.redirect(req.headers.referer);
});

app.post("/admin/auth", (req, res) => {
    console.log(req.body);
    const adminpwd = "2801";
    var givenpwd = req.body.pwd;

    if (givenpwd === adminpwd) {
        req.session.auth = true;
    }

    res.redirect(req.headers.referer);
});

const recentLogs = [];

app.post("/api/post/log/:type", (req, res) => {
    var type = req.params.type;
    var token = req.body.token;
    var recievetime = new Date();
    if (token !== secret.socketAuthToken) {
        console.log("["+recievetime.toLocaleTimeString()+`] API Request Rejected! (Token doesn't match!) AT ${req.path}`);
        res.sendStatus(401);
        return;
    }

    if (type === "chat") {
        res.sendStatus(200); // acknowledge

        var log = {
            sender: {
                username: req.body["message.sender.username"],
                ip: req.body["message.sender.ip"],
                ping: req.body["message.sender.ping"],
                isOperator: req.body["message.sender.isOp"],
                avatarUrl: req.body["message.sender.skinUrl"]
            },
            message: {
                content: req.body["message.content"]
            },
            event: {
                type: type,
                time: req.body["eventTime"],
            }
        };
        io.emit("log:chat", log);
        recentLogs.push(log);
        discord.sendToLogsChannel(type, log);

        return;
    } else if (type === "console") {
        res.sendStatus(200); // acknowledge

        var log = {
            log: {
                content: req.body["log.content"]
            },
            event: {
                type: type,
                time: req.body["eventTime"]
            }
        };
        io.emit("log:console", log);
        recentLogs.push(log);

        return;
    } else if (type === "join" || type === "leave") {
        res.sendStatus(200); // acknowledge

        var log = {
            player: {
                username: req.body["player.username"],
                ip: req.body["player.ip"],
                ping: req.body["player.ping"],
                isOperator: req.body["player.isOp"],
                avatarUrl: req.body["player.skinUrl"]
            },
            event: {
                type: type,
                time: req.body["eventTime"],
                message: req.body["eventMessage"]
            }
        };
        io.emit("log:playerjoinorleave", log);
        recentLogs.push(log);
        discord.sendToLogsChannel(type, log);

        return;
    } else if (type === "player_death") {
        res.sendStatus(200); // acknowledge

        var log = {
            player: {
                username: req.body["player.username"],
                ping: req.body["player.ping"],
                isOperator: req.body["player.isOp"],
                avatarUrl: req.body["player.skinUrl"]
            },
            killer: {
                username: req.body["killer.username"],
                ping: req.body["killer.ping"],
                isOperator: req.body["killer.isOp"]
            },
            event: {
                type: type,
                time: req.body["eventTime"],
                deathMessage: req.body["deathMessage"]
            }
        };

        io.emit("log:playerdeath", log);
        recentLogs.push(log);
        discord.sendToLogsChannel(type, log);

        return;
    } else if (type === "server_start") {
        res.sendStatus(200); // acknowledge

        var log = {
            event: {
                type: type,
                time: req.body["eventTime"],
                message: "Server is now online!"
            }
        };

        io.emit("log:serverstart", log);
        recentLogs.push(log);
        discord.sendToLogsChannel(type, log);

        return;
    } else if (type === "player_advancement") {
        res.sendStatus(200); // acknowledge

        var log = {
            player: {
                username: req.body["player.username"],
                ip: req.body["player.ip"],
                ping: req.body["player.ping"],
                isOperator: req.body["player.isOp"],
                avatarUrl: req.body["player.skinUrl"]
            },
            event: {
                type: type,
                time: req.body["eventTime"],
                advancement: {
                    name: req.body["event.advancementName"],
                    description: req.body["event.advancementDesc"],
                    icon: req.body["event.advancementIcon"]
                }
            }
        };

        io.emit("log:playeradvancement", log);
        recentLogs.push(log);
        discord.sendToLogsChannel(type, log);

    } else {
        res.sendStatus(404);
        return;
    }
});

app.post("/api/post/action", (req, res) =>  {    
    console.log(req.body);
    var action = {
        player: req.body.player,
        action: req.body.action
    };
    io.emit("action:*", action);
    res.sendStatus(200); // acknowledge
});

var stats = {};

app.get("/stats", (req, res) => {
    askSocket.askServer(io.of("/server"), "getPlayerStats", (data) => {
        console.log("getPlayerStats", data);
    }, () => {
        console.log("timed out");
    }, 5);

    res.render("stats.html", {query: req.query});
});

app.get("/get/stats", (req, res) => {
    res.send(stats);
});

app.get("/get/statistic/:type", (req, res) => {
    var sname = req.params.type.toUpperCase();
    var findstat = stats.filter(stat => stat.statname === sname);
    res.send(findstat);
});

exports.router = app;