package me.johngrasinili.listeners;

import org.bukkit.block.Block;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockPhysicsEvent;
import org.bukkit.plugin.Plugin;

import me.johngrasinili.Functions;

public class onBlockPhysChange implements Listener {
	private Functions Function = null;
	
	public onBlockPhysChange(Plugin plugin) {
		Function = new Functions(plugin);
	}


    @EventHandler
    public void onBlockPhysicsChange(BlockPhysicsEvent event) {
        Block target = event.getBlock();
        if (Function.isBlockProtected(target) != null) {
            event.setCancelled(true);
        }
    }
}
