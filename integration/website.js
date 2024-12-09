const express = require("express");
const app = express.Router();
const path = require("path");
const io = require("./app").socketio;
const session = require("express-session");

const discord = require("./discordFunctions");

io.on("connection", (socket) => {
    console.log("new connection");
});

const secret = {
    "requestToken": "Y+ZdEW3ZiQVGOXaW4gjo2Ikl4SyeeshDFD6Kp2WlqmpoYMAawXSZX7G+Gz9nboBK"
};

app.get("/", (req, res) => {
    res.render(path.join(__dirname, "public/index.html"), {});
});

app.get("/logs", (req, res) => {

    console.log(req.session);

    var viewmode = null;
    var auth = null;

    if (req.session.viewMode) {
        viewmode = req.session.viewMode;
    }

    if (req.session.auth) {
        auth = req.session.auth;
    }

    var pastlogs = (recentLogs.slice(-20)); // get last 15 logs in the array
    res.render(path.join(__dirname, "public/logs.html"), {recentLogs: pastlogs, viewmode: viewmode, auth: auth});
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
    if (token !== secret.requestToken) {
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

app.post("/api/update/stats", (req, res) => {
    var token = req.body.token;
    var recievetime = new Date();
    if (token !== secret.requestToken) {
        console.log("["+recievetime.toLocaleTimeString()+`] API Request Rejected! (Token doesn't match!) AT ${req.path}`);
        res.sendStatus(401);
        return;
    }

    res.sendStatus(200); // acknowledge
    console.log(req.body);
    stats = req.body.statistics;
});

app.get("/stats", (req, res) => {
    res.render(path.join(__dirname, "public/stats.html"), {query: req.query});
});

app.get("/get/stats", (req, res) => {
    res.send(stats);
});

app.get("/get/statistic/:type", (req, res) => {
    var sname = req.params.type.toUpperCase();
    var findstat = stats.filter(stat => stat.statname === sname);
    res.send(findstat);
});

app.get("/css/main", (req, res) => {
    res.sendFile(path.join(__dirname, "public/main.css"));
});

module.exports = app;