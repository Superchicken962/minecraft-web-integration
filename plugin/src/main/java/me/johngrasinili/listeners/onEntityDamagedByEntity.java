package me.johngrasinili.listeners;

import org.bukkit.entity.Entity;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityDamageByEntityEvent;

import me.johngrasinili.Functions;
import net.md_5.bungee.api.ChatColor;

public class onEntityDamagedByEntity implements Listener {
    @EventHandler
    public void entityDamaged(EntityDamageByEntityEvent event) {
        Entity damager = event.getDamager();
        if (damager instanceof Player) {
            Functions Function = new Functions();
            if (!Function.isPlayerAFK(damager.getUniqueId())) return; // do nothing if attacker is not afk

            Function.removePlayerFromAFK(damager.getUniqueId()); // remove afk status of attacker
            Function.disableAFK((Player) damager); // cast damager to Player class, then disable player's afk
            damager.sendMessage(ChatColor.RED+"Your status of AFK has been removed because you attacked another entity!");
        }
    }
}
