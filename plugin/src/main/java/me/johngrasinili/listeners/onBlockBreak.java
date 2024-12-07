package me.johngrasinili.listeners;

import java.util.UUID;

import org.bukkit.block.Block;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockBreakEvent;

import me.johngrasinili.Functions;
import net.md_5.bungee.api.ChatColor;

public class onBlockBreak implements Listener {
    Functions Function = new Functions();
    
    @EventHandler
    public void onBreakBlock(BlockBreakEvent event) {
        Player player = event.getPlayer();
        UUID playerid = player.getUniqueId();
        Block target = event.getBlock();

        if (Function.getProtectionModeForPlayer(playerid) != null) {

            if (Function.isBlockProtected(target) != null) {
                Function.setProtectedBlock(target, null);
                player.sendMessage(ChatColor.RED+"The block: "+target.getBlockData()+" is now unprotected");
            } else {
                Function.setProtectedBlock(target, true);
                player.sendMessage(ChatColor.GREEN+"The block: "+target.getBlockData()+" is now protected!");
            }

            event.setCancelled(true);
        } else {

            if (Function.isBlockProtected(target) != null) {
                event.setCancelled(true);
                player.sendMessage(ChatColor.RED+"This block is protected!");
            }

        }

    }
}
