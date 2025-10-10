package me.johngrasinili.listeners;

import org.bukkit.entity.Entity;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityDamageByEntityEvent;
import org.bukkit.plugin.Plugin;

import me.johngrasinili.Functions;
import org.bukkit.ChatColor;

public class onEntityDamagedByEntity implements Listener {
	private Functions Function = null;
	
	public onEntityDamagedByEntity(Plugin plugin) {
		Function = new Functions(plugin);
	}
	
    @EventHandler
    public void entityDamaged(EntityDamageByEntityEvent event) {
        Entity damager = event.getDamager();
        if (damager instanceof Player) {
            if (!Function.isPlayerAFK(damager.getUniqueId())) return; // do nothing if attacker is not afk

            Function.removePlayerFromAFK(damager.getUniqueId()); // remove afk status of attacker
            Function.disableAFK((Player) damager); // cast damager to Player class, then disable player's afk
            damager.sendMessage(ChatColor.RED+"Your status of AFK has been removed because you attacked another entity!");
        }
    }
}
