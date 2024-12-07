package me.johngrasinili.listeners;

import java.io.IOException;

import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.server.ServerLoadEvent;

import me.johngrasinili.Functions;

public class onServerLoad implements Listener {
    @EventHandler
    public void onServerStart(ServerLoadEvent event) throws IOException, InterruptedException {
        Functions Function = new Functions();

        Function.sendServerStartedLog();
    }
}
