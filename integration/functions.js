const gamedig = require("gamedig");

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

function formatMinecraftServerStats(status) {
    var formatted_stats = {
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
    return formatted_stats;
}

function formatTF2ServerStats(status) {
    var players = [];

    status.players.forEach((player) => {
        player.isBot = false;
        players.push(player);
    });

    status.bots.forEach((bot) => {
        bot.isBot = true;
        players.push(bot);
    });

    var formatted_stats = {
        server_name: status.name,
        server_map: status.map,
        password_protected: status.password,
        maxplayers: status.maxplayers,
        ping: status.ping,
        connect: status.connect,
        players: players,
        bots: status.bots,
        playercount: status.raw.numplayers,
        gamespecific: status.raw,
        game_code: "tf2",
        game: "Team Fortress 2"
    };

    return formatted_stats;
}

module.exports = { isServerValid, formatMinecraftServerStats, formatTF2ServerStats };