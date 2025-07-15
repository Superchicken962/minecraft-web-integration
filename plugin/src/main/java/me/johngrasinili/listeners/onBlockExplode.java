package me.johngrasinili.listeners;

import org.bukkit.block.Block;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockExplodeEvent;
import org.bukkit.plugin.Plugin;

import me.johngrasinili.Functions;

public class onBlockExplode implements Listener {
	private Functions Function = null;
	
	public onBlockExplode(Plugin plugin) {
		Function = new Functions(plugin);
	}

    @EventHandler
    public void _onBlockExplode(BlockExplodeEvent event) {
        Block target = event.getBlock();
        if (Function.isBlockProtected(target) != null) {
            event.setCancelled(true);
        }
    }
}
