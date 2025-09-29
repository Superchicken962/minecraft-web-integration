const express = require("express");
const app = express.Router();
const config = require("./config.json");
const secret = require("./secret.json");
const { minecraftServer } = require("./DataStorage");

app.use("*", (req, res, next) => {
    // Continue if the user is an admin.
    if (config.settings?.admins?.includes(req.session?.discord?.id)) {
        next();
        return;
    }

    res.sendStatus(404);
});

app.get("/", (req, res) => {
    res.render("manage.html", { server: minecraftServer });
});

// Handle server start, stop & restart.
app.post("/api/serverAction", (req, res) => {
    const action = req.body.action;

    // const validActions = ["start", "stop", "restart"];
    const validActions = ["start", "stop"];

    if (!action || !validActions.includes(action)) {
        return res.sendStatus(400);
    }

    try {        
        switch(action) {
            case "start":
                minecraftServer.start();
                break;
    
            case "stop":
                minecraftServer.stop();
                break;
        }
    } catch (error) {
        return res.status(500).json(action);
    }

    res.sendStatus(200);
});

app.get("/api/logs/clear", (req, res) => {
    minecraftServer.clearLogs();
    res.sendStatus(200);
});

// Handle submission from form - it will redirect instead of returning status code.
app.get("/api/logs/submit", async(req, res) => {
    const command = req.query.command;
    const commandName = req.query.commandName;

    if (command || commandName) {
        const commandText = (!!commandName) ? `${commandName} ${command}` : command;

        // TODO: Perhaps handle if it was "not a success."
        await minecraftServer.enterCommand(commandText);

        // Add an artificial delay so that the log from the result of the command is shown after redirect.
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    res.redirect("/manage");
});

module.exports = app;