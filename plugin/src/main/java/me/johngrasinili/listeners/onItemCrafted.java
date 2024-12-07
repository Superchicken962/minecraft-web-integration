package me.johngrasinili.listeners;

import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.inventory.CraftItemEvent;

import com.fasterxml.jackson.core.JsonProcessingException;

import me.johngrasinili.Functions;
import me.johngrasinili.classes.PlayerAction;
import me.johngrasinili.classes.playerInfo;

public class onItemCrafted implements Listener {
    @EventHandler
    public void itemCrafted(CraftItemEvent event) throws JsonProcessingException {
        Functions Function = new Functions();

        String result = event.getRecipe().getResult().getType().toString();
        int amount = event.getRecipe().getResult().getAmount();

        Player player = (Player) event.getInventory().getHolder();
        
        playerInfo playerinfo = new playerInfo(player.getName(), player.getUniqueId(), player.getAddress(), player.getPing());

        PlayerAction action = new PlayerAction("craftItem", result, amount);

        Function.logPlayerAction(playerinfo, action);
    }
}
