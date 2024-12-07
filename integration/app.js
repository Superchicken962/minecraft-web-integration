const { Client, IntentsBitField, Collection, Colors, MessageManager } = require("discord.js");

const client = new Client({ intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.DirectMessages, IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.GuildWebhooks, IntentsBitField.Flags.DirectMessageReactions, IntentsBitField.Flags.GuildMessageReactions] });
const config = require("./config.json");
const path = require("path");
const fs = require("fs");
const gamedig = require("gamedig");
const { isServerValid, formatMinecraftServerStats, formatTF2ServerStats } = require("./functions");
const { EmbedBuilder } = require("@discordjs/builders");

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const session = require("express-session");

const http = require("http");

const httpServer = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(httpServer);
const PORT = 3000;
// const PORT = 80; // use this so that the hostname will not require a specified port

process.env.TZ = "Australia/Adelaide";

module.exports.socketio = io; // make socket.io accessible in website.js etc

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.engine("html", require('ejs').renderFile);
app.set("view-engine", "html");

app.use(session({
    secret: "XMwqlAJswkldNEui290sWQL!@*!#%xmqkSJWe!%$",
    resave: false,
    saveUninitialized: false,
}));

app.use("/", require("./website"));

client.commands = new Collection();

const getCommands = () => {
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ("data" in command && "execute" in command) {
            client.commands.set(command.data.name, command);
        }
    }
}
getCommands();

client.on("interactionCreate", async(interaction) => {
    if (interaction.commandName === "add") {
        await interaction.deferReply({ephemeral:true});

        var id = interaction.options.getString("id");
        var channel = interaction.options.getChannel("channel");
        var serverip = interaction.options.getString("ip");
        var serverport = interaction.options.getString("port");
        var servergame = interaction.options.getString("game");

        if (fs.existsSync(path.join(__dirname, `servers/${id}.json`))) {
            var errembed = new EmbedBuilder();
            errembed.setTitle("Server ID already exists!");
            errembed.setColor(Colors.Red);
            errembed.setTimestamp();

            await interaction.editReply({embeds:[errembed]});
            return;
        }

        var validserver = await isServerValid(servergame, serverip, serverport);

        if (!validserver) {
            var errembed = new EmbedBuilder();
            errembed.setTitle("Invalid Server!");
            errembed.setColor(Colors.Red);
            errembed.setTimestamp();

            await interaction.editReply({embeds:[errembed]});
            return;
        }

        var server_info = {
            id: id,
            channel: channel,
            message: null,
            server: {
                ip: serverip,
                port: serverport,
                game: servergame
            },
            author: {
                username: interaction.user.username,
                id: interaction.user.id
            },
            last_updated: null
        };

        fs.writeFileSync(path.join(__dirname, `servers/${id}.json`), JSON.stringify(server_info), {encoding:"utf-8"});

        var successEmbed = new EmbedBuilder();
        successEmbed.setTitle("Successfully Added Server!");
        successEmbed.setColor(Colors.Green);
        successEmbed.setTimestamp();

        await interaction.editReply({embeds:[successEmbed]});
    }
});

async function updateServers() {
    var readfolder = fs.readdirSync(path.join(__dirname, "servers/"), {encoding:"utf-8"});
    for (const file of readfolder) {
        var serverinfo = fs.readFileSync(path.join(__dirname, `servers/${file}`), {encoding:"utf-8"});
        var data;
        try {
            data = JSON.parse(serverinfo);
        } catch (error) {
            return error;
        }

        var channel = client.channels.cache.get(data.channel.id);

        if (!data.message) {
            data.message = {id:"2193.2"}; // int to trigger error to resend message
        }

        var message_to_edit = null;

        try {
            message_to_edit = await channel.messages.fetch(data.message.id);
        } catch (error) {
            var msg = await channel.send(".");
            data.message = msg;
            fs.writeFileSync(path.join(__dirname, `servers/${file}`), JSON.stringify(data), {encoding:"utf-8"});
        }

        gamedig.query({
            "host": data.server.ip,
            "port": data.server.port,
            "type": data.server.game
        }).then((server) => {
            var formatted_data = null;
            if (data.server.game === "minecraft") {
                formatted_data = formatMinecraftServerStats(server);
            } else {
                formatted_data = formatTF2ServerStats(server);
            }
            // console.log(formatted_data);

            const status_embed = new EmbedBuilder();
            
            status_embed.setTitle(formatted_data.server_name);
	    status_embed.setDescription(formatted_data.connect);
            status_embed.setColor(Colors.Green);
            status_embed.setFooter({text:formatted_data.game});
            status_embed.setTimestamp();

            status_embed.addFields(
                {name:"Players", value:formatted_data.playercount+"/"+formatted_data.maxplayers}
            );
                        
            if (formatted_data.playercount > 0) {

                var players = [];

                formatted_data.players.forEach((player) => {
                    var playername = player.name
                    if (player.isBot) {
                        playername = "[BOT] "+player.name;
                    }
                    players.push(playername);
                });
                
                status_embed.addFields(
                    {name:"Name", value:players.join("\n").toString(), inline:true},
                );
            }

            message_to_edit.edit({content:"", embeds:[status_embed]});

        }).catch((error) => {
            console.log(error);
            var offline_embed = new EmbedBuilder();
            offline_embed.setTitle("Server Offline :(");
            offline_embed.setColor(Colors.Red);
            offline_embed.setTimestamp();

            message_to_edit.edit({content:"", embeds:[offline_embed]});
        });

    };

    setTimeout(() => {
        updateServers();
    }, 120000);
}

httpServer.listen(PORT, () => {
    console.log(`[HTTP] Listening on port ${PORT}`);
});

client.on("ready", () => {
    console.log("[Discord] Bot is online!");
    updateServers();    
});
client.login(config.token);