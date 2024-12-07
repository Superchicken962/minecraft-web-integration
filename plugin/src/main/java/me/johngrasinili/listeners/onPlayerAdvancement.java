package me.johngrasinili.listeners;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;

import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerAdvancementDoneEvent;

import me.johngrasinili.Functions;

public class onPlayerAdvancement implements Listener {
    @EventHandler
    public void onAdvancementUnlock(PlayerAdvancementDoneEvent event) throws IOException, InterruptedException, URISyntaxException {
        Functions Function = new Functions();

        Player player = event.getPlayer();

        URI playerskinurl = event.getPlayer().getPlayerProfile().getTextures().getSkin().toURI();

        if (event.getAdvancement().getDisplay() == null) return;

        String advancementName = event.getAdvancement().getDisplay().getTitle();
        String advancementDesc = event.getAdvancement().getDisplay().getDescription();
        String advancementIcon = event.getAdvancement().getDisplay().getIcon().getType().name();
        
        Function.sendAdvancementLog(player.getName(), player.getPing(), player.getAddress(), player.isOp(), playerskinurl, advancementName, advancementDesc, advancementIcon);
    }
}
