package me.johngrasinili.listeners;

import org.bukkit.block.Block;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockPhysicsEvent;

import me.johngrasinili.Functions;

public class onBlockPhysChange implements Listener {
    Functions Function = new Functions();

    @EventHandler
    public void onBlockPhysicsChange(BlockPhysicsEvent event) {
        Block target = event.getBlock();
        if (Function.isBlockProtected(target) != null) {
            event.setCancelled(true);
        }
    }
}
