package me.johngrasinili.listeners;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import me.johngrasinili.Functions;
import me.johngrasinili.Utility;

import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.plugin.Plugin;

public class onPlayerLeave implements Listener {
	private Functions Function = null;
	
	public onPlayerLeave(Plugin plugin) {
		Function = new Functions(plugin);
	}
	
    @EventHandler
    public void onLeave(PlayerQuitEvent event) throws IOException, InterruptedException, URISyntaxException {
        Player player = event.getPlayer();
        URI senderSkinUrl = Utility.getPlayerSkinUri(player);

        Function.sendLogsToServer(player.getName(), player.getPing(), player.getAddress(), player.isOp(), senderSkinUrl, "leave", "%p left the game");

        Function.clearPlayerFromStorage(player);
    }
}