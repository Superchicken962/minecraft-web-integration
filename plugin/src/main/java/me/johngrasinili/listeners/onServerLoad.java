package me.johngrasinili.listeners;

import java.io.IOException;

import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.server.ServerLoadEvent;
import org.bukkit.plugin.Plugin;

import me.johngrasinili.Functions;

public class onServerLoad implements Listener {
	private Functions Function = null;
	
	public onServerLoad(Plugin plugin) {
		Function = new Functions(plugin);
	}
	
    @EventHandler
    public void onServerStart(ServerLoadEvent event) throws IOException, InterruptedException {
        Function.sendServerStartedLog();
    }
}
