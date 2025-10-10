package me.johngrasinili.listeners;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;

import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.PlayerDeathEvent;
import org.bukkit.plugin.Plugin;

import me.johngrasinili.Functions;
import me.johngrasinili.Utility;

public class onPlayerDeath implements Listener {
	private Functions Function = null;
	
	public onPlayerDeath(Plugin plugin) {
		Function = new Functions(plugin);
	}

    @EventHandler
    public void playerDeath(PlayerDeathEvent event) throws IOException, InterruptedException, URISyntaxException {
        Player player = event.getEntity();
        Player killer = player.getKiller();

        String deathMsg = event.getDeathMessage();
        String editedDeathMsg = deathMsg.replaceAll(player.getName(), "%p");
        URI senderSkinUrl = Utility.getPlayerSkinUri(player);
        
        if (killer != null) {
            editedDeathMsg = deathMsg.replaceAll(killer.getName(), "%k");
        }

        Function.sendLogsToServer(player.getName(), player.getPing(), player.isOp(), senderSkinUrl, editedDeathMsg, killer);
    }
}
