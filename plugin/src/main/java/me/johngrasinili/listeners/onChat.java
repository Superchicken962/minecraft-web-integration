package me.johngrasinili.listeners;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URISyntaxException;

import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.AsyncPlayerChatEvent;
import org.bukkit.plugin.Plugin;

import me.johngrasinili.Functions;
import me.johngrasinili.Utility;

public class onChat implements Listener {
	private Functions Function = null;
	
	public onChat(Plugin plugin) {
		Function = new Functions(plugin);
	}

    @EventHandler
    public void onPlayerChat(AsyncPlayerChatEvent event) throws IOException, InterruptedException, URISyntaxException {

    	Player player = event.getPlayer();
    	
        String message = event.getMessage();
        String senderName = player.getName();
        int senderPing = player.getPing();
        InetSocketAddress senderIp = player.getAddress();
        Boolean senderIsOp = player.isOp();
        URI senderSkinUrl = Utility.getPlayerSkinUri(player);

        Function.sendLogsToServer(message, senderName, senderPing, senderIp, senderIsOp, senderSkinUrl);

    }
}
