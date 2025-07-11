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
web.register(io);

app.use("/", web.router);


client.on("messageCreate", async(message) => {
    const cfg = await serverInfo.readConfig();
    
    // Only allow admins to run commands.
    if (!cfg.settings?.admins?.includes(message.author.id)) return;

    // This command will create a new message for updating and store it in config.
    if (message.content.startsWith("mc!here")) {
        message.delete();

        const sentMsg = await serverInfo.sendMessage(message.channel);

        // Store current channel id in config.
        cfg.message = {
            channelId: message.channel.id,
            messageId: sentMsg.id
        };
        
        serverInfo.updateConfig(cfg);
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
            message.delete();
            reply.delete();
        }, 3000);
    }
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