package me.johngrasinili.listeners;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import me.johngrasinili.Functions;
import net.md_5.bungee.api.ChatColor;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;

public class onPlayerJoin implements Listener {
    @EventHandler
    public void onJoin(PlayerJoinEvent event) throws IOException, InterruptedException, URISyntaxException {
        if (event.getPlayer().getName().equalsIgnoreCase("Brocc_Is_Eternal")) {
            event.setJoinMessage(ChatColor.YELLOW+event.getPlayer().getName());
        }

        // send to logs
        
        Functions Function = new Functions();

        Function.addPlayerToScoreboard(event.getPlayer());

        Player player = event.getPlayer();
        URI senderSkinUrl = player.getPlayerProfile().getTextures().getSkin().toURI();

        Function.sendLogsToServer(player.getName(), player.getPing(), player.getAddress(), player.isOp(), senderSkinUrl, "join", "%p joined the game");
        
    }
}
