package me.johngrasinili.listeners;

import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerRespawnEvent;
import org.bukkit.plugin.Plugin;

import me.johngrasinili.Functions;

public class onPlayerRespawn implements Listener {
	private Functions Function = null;
	
	public onPlayerRespawn(Plugin plugin) {
		Function = new Functions(plugin);
	}
	
    @EventHandler
    public void onPlayerRespawned(PlayerRespawnEvent event) {
        Player p = event.getPlayer();

        if (p.getWorld() != event.getRespawnLocation().getWorld()) {
            event.setRespawnLocation(p.getWorld().getSpawnLocation());
        }
    }
}
