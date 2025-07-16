const { Client, IntentsBitField, Collection, Colors, MessageManager, MessageFlags } = require("discord.js");

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
const { serverInfo, askSocket } = require("./functions");
const io = new Server(httpServer);
const PORT = 3003;
const config = require("./config.json");

process.env.TZ = "Australia/Adelaide";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.engine("html", require('ejs').renderFile);
app.set("view-engine", "html");
app.set("views", path.join(__dirname, "/views"));

app.use(session({
    secret: "sajxnhsamqsnbWH!!82sIlkjamXNsj#@",
    resave: false,
    saveUninitialized: false,
}));

// Register web - send it the socket instance, and use router for routes.
const web = require("./website");
const { minecraftServer } = require("./DataStorage");
const { runCommand } = require("./discordFunctions");
web.register(io);

app.use("/", web.router);


client.on("messageCreate", async(message) => {
    if (message.author.bot) return;

    const cfg = await serverInfo.readConfig();
    
    // If user is an admin, try running the command and if it is valid then do not go to log the message.
    if (cfg.settings?.admins?.includes(message.author.id)) {
        const cmdResult = await runCommand(message);
        if (cmdResult) return;
    };

    // Relay the message if enabled.
    if (!cfg.features?.discordChatRelay?.enabled) return;

    // Ensure it is in the right channel
    if (cfg.features?.discordChatRelay?.channelId !== message.channelId) return;

    io.of("/server").emit("discordChatRelay", {
        username: message.author.username,
        message: message.content,
        authToken: secret.socketAuthToken
    });

    const data = {
        event: "discordChatRelay",
        username: message.author.username,
        message: message.content,
    };

    askSocket.askServer(io.of("/server"), data, (res) => {
        // Message was receieved by server, but failed.
        if (!res?.success) {
            message.react("❌");
        }
    }, () => {
        // Message timed out.
        message.react("⏲️");
        message.react("❌");
    }, 4);
});

// Initialise the minecraft server object.
minecraftServer.init(config, io);

httpServer.listen(PORT, () => {
    console.log(`[HTTP] Listening on port ${PORT}`);
});

client.on("ready", () => {
    console.log("[Discord] Bot is online!");
    serverInfo.update(client, io);
});

client.login(secret.token);