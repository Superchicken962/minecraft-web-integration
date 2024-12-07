package me.johngrasinili;
import org.bukkit.plugin.Plugin;
import org.bukkit.plugin.java.JavaPlugin;

import me.johngrasinili.commands.autoBridge;
import me.johngrasinili.commands.clearProtectedBlocks;
import me.johngrasinili.commands.jaiGame;
import me.johngrasinili.commands.protectBlocks;
import me.johngrasinili.commands.test;
import me.johngrasinili.commands.toggleAFK;
import me.johngrasinili.commands.updateStats;
import me.johngrasinili.listeners.onBlockBreak;
import me.johngrasinili.listeners.onBlockExplode;
import me.johngrasinili.listeners.onBlockPhysChange;
import me.johngrasinili.listeners.onChat;
import me.johngrasinili.listeners.onEntityDamagedByEntity;
import me.johngrasinili.listeners.onPlayerAdvancement;
import me.johngrasinili.listeners.onPlayerChangedWorld;
import me.johngrasinili.listeners.onPlayerDeath;
// import me.johngrasinili.listeners.onPlayerDropItem;
import me.johngrasinili.listeners.onItemCrafted;
import me.johngrasinili.listeners.onPlayerJoin;
import me.johngrasinili.listeners.onPlayerLeave;
import me.johngrasinili.listeners.onPlayerMove;
import me.johngrasinili.listeners.onPlayerRespawn;
import me.johngrasinili.listeners.onServerLoad;

import java.io.IOException;
import java.util.logging.Handler;
import java.util.logging.Level;
import java.util.logging.LogRecord;

import org.bukkit.Bukkit;
import org.bukkit.GameMode;
import org.bukkit.GameRule;
import org.bukkit.World;
import org.bukkit.WorldCreator;
import org.bukkit.event.Listener;

public class App extends JavaPlugin implements Listener {

    public static Plugin instance = null;

    @Override
    public void onEnable() {
        instance = this;

        getLogger().info("Baby-gamers plugin enabled!");
        getServer().getPluginManager().registerEvents(new onPlayerJoin(), this);
        getServer().getPluginManager().registerEvents(new onBlockBreak(), this);
        getServer().getPluginManager().registerEvents(new onBlockExplode(), this);
        getServer().getPluginManager().registerEvents(new onBlockPhysChange(), this);
        getServer().getPluginManager().registerEvents(new onPlayerMove(), this);
        getServer().getPluginManager().registerEvents(new onChat(), this);
        getServer().getPluginManager().registerEvents(new onPlayerLeave(), this);
        getServer().getPluginManager().registerEvents(new onPlayerDeath(), this);
        getServer().getPluginManager().registerEvents(new onServerLoad(), this);
        getServer().getPluginManager().registerEvents(new onPlayerAdvancement(), this);
        getServer().getPluginManager().registerEvents(new onItemCrafted(), this);
        // getServer().getPluginManager().registerEvents(new onPlayerDropItem(), this);
        getServer().getPluginManager().registerEvents(new onEntityDamagedByEntity(), this);
        getServer().getPluginManager().registerEvents(new onPlayerChangedWorld(), this);
        getServer().getPluginManager().registerEvents(new onPlayerRespawn(), this);

        getCommand("protectBlocks").setExecutor(new protectBlocks());
        getCommand("clearProtectedBlocks").setExecutor(new clearProtectedBlocks());
        getCommand("autoBridge").setExecutor(new autoBridge());
        getCommand("test").setExecutor(new test());
        getCommand("updateStats").setExecutor(new updateStats());
        getCommand("afk").setExecutor(new toggleAFK());
        getCommand("jaigame").setExecutor(new jaiGame());

        Functions Function = new Functions();

        World JaiGameWorld = Bukkit.createWorld(new WorldCreator("jaigame")); // create the jaigame world
        JaiGameWorld.setGameRule(GameRule.KEEP_INVENTORY, true); // make sure this is true, I fucked up and lost my armour and enchanted swords...
        Function.setGameModeForWorld("jaigame", GameMode.ADVENTURE); // set gamemode for players to be set as when loading in to world

        Function.addOnlinePlayersToScoreboard();

        Handler handler = new Handler() {
            
            @Override
            public void publish(LogRecord record) {
                String msg = record.getMessage();
                try {
                    Function.sendLogsToServer(msg);
                } catch (IOException err) {
                    err.printStackTrace();
                } catch (InterruptedException err) {
                    err.printStackTrace();
                }
            }

            @Override
            public void flush() {

            }

            @Override
            public void close() throws SecurityException {

            }
        };

        getServer().getLogger().setUseParentHandlers(true);
        getServer().getLogger().setLevel(Level.ALL);
        getServer().getLogger().addHandler(handler);

    }

    @Override
    public void onDisable() {
        instance = null;
        getLogger().info("Baby-Gamers plugin disabled");
    }

    public static Plugin getPluginInstance(){
        return instance;
    }

}