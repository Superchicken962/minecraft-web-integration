package me.johngrasinili.listeners;

import org.bukkit.Material;
import org.bukkit.entity.EntityType;
import org.bukkit.entity.Item;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerDropItemEvent;

public class onPlayerDropItem implements Listener {
    @EventHandler
    public void playerDropItem(PlayerDropItemEvent event) throws InterruptedException {
        Item item = event.getItemDrop();
        Material type = item.getItemStack().getType();
        if (type == Material.SALMON) {
            item.remove();
            item.getItemStack().getAmount();
            for (int i = 0; i < item.getItemStack().getAmount(); i++) {
                item.getWorld().spawnEntity(item.getLocation(), EntityType.SALMON);
            }
        }
    }
}
