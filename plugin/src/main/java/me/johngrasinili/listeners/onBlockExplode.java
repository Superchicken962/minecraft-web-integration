package me.johngrasinili.listeners;

import org.bukkit.block.Block;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockExplodeEvent;

import me.johngrasinili.Functions;

public class onBlockExplode implements Listener {
    Functions Function = new Functions();

    @EventHandler
    public void _onBlockExplode(BlockExplodeEvent event) {
        Block target = event.getBlock();
        if (Function.isBlockProtected(target) != null) {
            event.setCancelled(true);
        }
    }
}
