const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, SelectMenuBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("add")
        .setDescription("Add server monitoring to specified channel")
        .addStringOption(option => 
            option.setName("id")
            .setDescription("Identification of the server (you may need this later)")
            .setRequired(true)
        )
        .addChannelOption(option => 
            option.setName("channel")
            .setDescription("Channel that the server monitoring will be in")
            .setRequired(true)    
        )
        .addStringOption(option => 
            option.setName("ip")
            .setDescription("Server IP (NOT including the port)")
            .setRequired(true)
        )
        .addStringOption(option => 
            option.setName("port")
            .setDescription("Server Port (NOT including the ip)")
            .setRequired(true)    
        )
        .addStringOption(option => 
            option.setName("game")
            .setDescription("The game the server is for")
            .setRequired(true)
            .addChoices(
                {name:"Team Fortress 2",value:"tf2"},
                {name:"Minecraft",value:"minecraft"}
            )
        ),
    async execute(interaction) {
        return;
    }
}