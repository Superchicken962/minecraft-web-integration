const { Client, Message, Colors } = require("discord.js");
const gamedig = require("gamedig");
const fs = require("node:fs");
const path = require("node:path");

function isServerValid(game, ip, port) {
    return new Promise((resolve, reject) => {
        gamedig.query({
            "host": ip,
            "port": port,
            "type": game
        }).then(() => {
            resolve(true, null);
        }).catch((err) => {
            resolve(false, err);
        });
    });
}

function formatServerData(status) {
    const data = {
        server_name: status.name,
        server_map: status.map,
        password_protected: status.password,
        maxplayers: status.maxplayers,
        ping: status.ping,
        connect: status.connect,
        players: status.players,
        bots: status.bots,
        playercount: status.players.length,
        gamespecific: null,
        game_code: "minecraft",
        game: "Minecraft"
    };
    return data;
}

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
     * @param { Client } client 
     * @returns 
     */
    update: async function(client) {
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

        // Debug/Test edit.
        message.edit({
            "content": ".",
            "embeds": [
                {
                    "title": "Test",
                    "footer": {
                        "text": `${cfg.server.ip}:${cfg.server.port}`
                    },
                    "color": Colors.Green,
                    "timestamp": new Date().toISOString()
                }
            ]
        });

        await this.updateConfig(cfg);
    
        // gamedig.query({
        //     "host": data.server.ip,
        //     "port": data.server.port,
        //     "type": data.server.game
        // }).then((server) => {
        //     var formatted_data = null;
        //     if (data.server.game === "minecraft") {
        //         formatted_data = formatMinecraftServerStats(server);
        //     }
    
        //     const status_embed = new EmbedBuilder();
            
        //     status_embed.setTitle(formatted_data.server_name);
        //     status_embed.setDescription(formatted_data.connect);
        //     status_embed.setColor(Colors.Green);
        //     status_embed.setFooter({text:formatted_data.game});
        //     status_embed.setTimestamp();
    
        //     status_embed.addFields(
        //         {name:"Players", value:formatted_data.playercount+"/"+formatted_data.maxplayers}
        //     );
                        
        //     if (formatted_data.playercount > 0) {
    
        //         var players = [];
    
        //         formatted_data.players.forEach((player) => {
        //             var playername = player.name
        //             if (player.isBot) {
        //                 playername = "[BOT] "+player.name;
        //             }
        //             players.push(playername);
        //         });
                
        //         status_embed.addFields(
        //             {name:"Name", value:players.join("\n").toString(), inline:true},
        //         );
        //     }
    
        //     message_to_edit.edit({content:"", embeds:[status_embed]});
    
        // }).catch((error) => {
        //     console.log(error);
        //     var offline_embed = new EmbedBuilder();
        //     offline_embed.setTitle("Server Offline :(");
        //     offline_embed.setColor(Colors.Red);
        //     offline_embed.setTimestamp();
    
        //     message_to_edit.edit({content:"", embeds:[offline_embed]});
        // });
    
        // setTimeout(() => {
        //     updateServerInfo();
        // }, 120000);

        setTimeout(() => {
            this.update(client);
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

module.exports = { isServerValid, formatServerData, serverInfo };