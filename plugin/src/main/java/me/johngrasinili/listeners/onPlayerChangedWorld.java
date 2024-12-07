package me.johngrasinili.listeners;

import org.bukkit.GameMode;
import org.bukkit.World;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerChangedWorldEvent;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;

import me.johngrasinili.Functions;

public class onPlayerChangedWorld implements Listener {
    @EventHandler 
    public void onPlayerChangeWorld(PlayerChangedWorldEvent event) {
        Player p = event.getPlayer();
        World joiningWorld = p.getWorld();

        Functions Function = new Functions();

        if (joiningWorld.getName().equals("jaigame")) {
            Function.joinJaiGameTeam(p.getUniqueId());
            PotionEffect saturation = new PotionEffect(PotionEffectType.SATURATION, 100000, 0, false, true);
            p.addPotionEffect(saturation);
        } else {
            Function.leaveJaiGameTeam(p.getUniqueId());
        }

        GameMode gamemode = Function.getGameModeForWorld(p.getWorld().getName()); // will return survival by default if nothing else specified

        p.setGameMode(gamemode);
    }
}
