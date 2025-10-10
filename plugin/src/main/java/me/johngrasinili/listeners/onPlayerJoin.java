package me.johngrasinili.listeners;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import me.johngrasinili.Functions;
import me.johngrasinili.Utility;

import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.plugin.Plugin;
import org.bukkit.ChatColor;

public class onPlayerJoin implements Listener {
	private Plugin plugin = null;
	public onPlayerJoin(Plugin plugin) {
		this.plugin = plugin;
	}
	
    @EventHandler
    public void onJoin(PlayerJoinEvent event) throws IOException, InterruptedException, URISyntaxException {
        if (event.getPlayer().getName().equalsIgnoreCase("Brocc_Is_Eternal")) {
            event.setJoinMessage(ChatColor.YELLOW+event.getPlayer().getName());
        }

        // send to logs
        
        Functions Function = new Functions(this.plugin);

        Function.addPlayerToScoreboard(event.getPlayer());

        Player player = event.getPlayer();
        URI senderSkinUrl = Utility.getPlayerSkinUri(player);

        Function.sendLogsToServer(player.getName(), player.getPing(), player.getAddress(), player.isOp(), senderSkinUrl, "join", "%p joined the game");

        // Set player join time - sets it as current time in ms.
        Function.setPlayerJoinTime(player.getUniqueId());
    }
}
