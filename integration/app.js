const { Client, IntentsBitField, Collection, Colors, MessageManager } = require("discord.js");

const client = new Client({ intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.DirectMessages, IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.GuildWebhooks, IntentsBitField.Flags.DirectMessageReactions, IntentsBitField.Flags.GuildMessageReactions, IntentsBitField.Flags.MessageContent] });
const secret = require("./secret.json");
const path = require("path");
const fs = require("fs");

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const session = require("express-session");

const http = require("http");

const httpServer = http.createServer(app);

const { Server } = require("socket.io");
const { serverInfo } = require("./functions");
const io = new Server(httpServer);
const PORT = 3003;

process.env.TZ = "Australia/Adelaide";

module.exports.socketIo = io; // make socket.io accessible in website.js etc

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.engine("html", require('ejs').renderFile);
app.set("view-engine", "html");
app.set("views", path.join(__dirname, "/views"));

app.use(session({
    secret: "smxNAjxlCmepWPSQiSjTuX",
    resave: false,
    saveUninitialized: false,
}));

// Register web - send it the socket instance, and use router for routes.
const web = require("./website");
web.register(io);

app.use("/", web.router);


client.on("messageCreate", async(message) => {
    // This command will create a new message for updating and store it in config.
    if (message.content.startsWith("mc!here")) {
        message.delete();

        const cfg = await serverInfo.readConfig();
        const sentMsg = await serverInfo.sendMessage(message.channel);

        // Store current channel id in config.
        cfg.message = {
            channelId: message.channel.id,
            messageId: sentMsg.id
        };
        
        serverInfo.updateConfig(cfg);
    }
});


httpServer.listen(PORT, () => {
    console.log(`[HTTP] Listening on port ${PORT}`);
});

client.on("ready", () => {
    console.log("[Discord] Bot is online!");
    serverInfo.update(client, io);
});

client.login(secret.token);