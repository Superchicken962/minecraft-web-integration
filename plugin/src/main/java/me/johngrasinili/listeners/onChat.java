package me.johngrasinili.listeners;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URISyntaxException;

import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.AsyncPlayerChatEvent;
import org.bukkit.plugin.Plugin;

import me.johngrasinili.Functions;

public class onChat implements Listener {
	private Functions Function = null;
	
	public onChat(Plugin plugin) {
		Function = new Functions(plugin);
	}

    @EventHandler
    public void onPlayerChat(AsyncPlayerChatEvent event) throws IOException, InterruptedException, URISyntaxException {

        String message = event.getMessage();
        String senderName = event.getPlayer().getName();
        int senderPing = event.getPlayer().getPing();
        InetSocketAddress senderIp = event.getPlayer().getAddress();
        Boolean senderIsOp = event.getPlayer().isOp();
        URI senderSkinUrl = event.getPlayer().getPlayerProfile().getTextures().getSkin().toURI();

        Function.sendLogsToServer(message, senderName, senderPing, senderIp, senderIsOp, senderSkinUrl);

    }
}
