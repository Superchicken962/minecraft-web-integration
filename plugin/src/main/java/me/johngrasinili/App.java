package me.johngrasinili;
import java.io.IOException;
import java.util.logging.Handler;
import java.util.logging.Level;
import java.util.logging.LogRecord;
import me.johngrasinili.commands.autoBridge;
import me.johngrasinili.commands.clearProtectedBlocks;
import me.johngrasinili.commands.jaiGame;
import me.johngrasinili.commands.protectBlocks;
import me.johngrasinili.commands.test;
import me.johngrasinili.commands.toggleAFK;
import me.johngrasinili.listeners.onBlockBreak;
import me.johngrasinili.listeners.onBlockExplode;
import me.johngrasinili.listeners.onBlockPhysChange;
import me.johngrasinili.listeners.onChat;
import me.johngrasinili.listeners.onEntityDamagedByEntity;
import me.johngrasinili.listeners.onItemCrafted;
import me.johngrasinili.listeners.onPlayerAdvancement;
import me.johngrasinili.listeners.onPlayerChangedWorld;
import me.johngrasinili.listeners.onPlayerDeath;
import me.johngrasinili.listeners.onPlayerJoin;
import me.johngrasinili.listeners.onPlayerLeave;
import me.johngrasinili.listeners.onPlayerMove;
import me.johngrasinili.listeners.onPlayerRespawn;
import me.johngrasinili.listeners.onServerLoad;
import org.bukkit.Bukkit;
import org.bukkit.GameMode;
import org.bukkit.GameRule;
import org.bukkit.OfflinePlayer;
import org.bukkit.Statistic;
import org.bukkit.World;
import org.bukkit.WorldCreator;
import org.bukkit.entity.Player;
import org.bukkit.event.Listener;
import org.bukkit.plugin.Plugin;
import org.bukkit.plugin.java.JavaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.sun.tools.javac.launcher.Main;

public class App extends JavaPlugin implements Listener {

    public static Plugin instance = null;

    @Override
    public void onEnable() {
        instance = this;

        getLogger().info("Minecraft web integration plugin enabled!");
        getServer().getPluginManager().registerEvents(new onPlayerJoin(instance), this);
        getServer().getPluginManager().registerEvents(new onBlockBreak(instance), this);
        getServer().getPluginManager().registerEvents(new onBlockExplode(instance), this);
        getServer().getPluginManager().registerEvents(new onBlockPhysChange(instance), this);
        getServer().getPluginManager().registerEvents(new onPlayerMove(instance), this);
        getServer().getPluginManager().registerEvents(new onChat(instance), this);
        getServer().getPluginManager().registerEvents(new onPlayerLeave(instance), this);
        getServer().getPluginManager().registerEvents(new onPlayerDeath(instance), this);
        getServer().getPluginManager().registerEvents(new onServerLoad(instance), this);
        getServer().getPluginManager().registerEvents(new onPlayerAdvancement(instance), this);
        getServer().getPluginManager().registerEvents(new onItemCrafted(instance), this);
        // getServer().getPluginManager().registerEvents(new onPlayerDropItem(), this);
        getServer().getPluginManager().registerEvents(new onEntityDamagedByEntity(instance), this);
        getServer().getPluginManager().registerEvents(new onPlayerChangedWorld(instance), this);
        getServer().getPluginManager().registerEvents(new onPlayerRespawn(instance), this);

        getCommand("protectBlocks").setExecutor(new protectBlocks(instance));
        getCommand("clearProtectedBlocks").setExecutor(new clearProtectedBlocks(instance));
        getCommand("autoBridge").setExecutor(new autoBridge(instance));
        getCommand("test").setExecutor(new test(instance));
        getCommand("afk").setExecutor(new toggleAFK(instance));
        getCommand("jaigame").setExecutor(new jaiGame(instance));

        this.saveDefaultConfig();

        Functions Function = new Functions(instance);

        World JaiGameWorld = Bukkit.createWorld(new WorldCreator("jaigame")); // create the jaigame world
        JaiGameWorld.setGameRule(GameRule.KEEP_INVENTORY, true); // make sure this is true, I fucked up and lost my armour and enchanted swords...
        Function.setGameModeForWorld("jaigame", GameMode.ADVENTURE); // set gamemode for players to be set as when loading in to world

        Function.addOnlinePlayersToScoreboard();

        // Add the auth token from the config to the socket.
        Function.socket.setAuthToken(this.getConfig().getString("socketAuthToken"));

        Function.socket.listen("askServer", (Object... args) -> {
            try {
                JSONObject response = (JSONObject) args[0];
                
                String eventName = response.getString("event");
                String id = response.getString("id");
                String authToken = response.getString("authToken");
                
                // Dismiss message if it doesn't contain 
	            String socketToken = this.getConfig().getString("socketAuthToken");
	            if (!authToken.equals(socketToken)) return;

                JSONObject dataToRespond = new JSONObject();

                dataToRespond.put("id", id);

                // TODO: Consider expanding this into a callback based system, where we can add events with a function rather than adding into a switch.

                // Add different data depending on the event called.
                switch(eventName.toLowerCase()) {
                    // Find all online players and add to response data.
                    case "getonlineplayers":
                        JSONArray players = new JSONArray();
                        
                        for (Player player : Bukkit.getOnlinePlayers()) {
                            JSONObject playerInfo = new JSONObject();
                            
                            playerInfo.put("username", player.getName());
                            playerInfo.put("time", Function.getPlayerSessionTime(player.getUniqueId()));
                            playerInfo.put("ping", player.getPing());

                            players.put(playerInfo);
                        }
                        
                        dataToRespond.put("onlinePlayers", players);
                        break;
 
                    case "getplayerstats":
                        JSONObject allPlayers = new JSONObject();

                        // Loop through offline players and get values for all stats.
                        for (OfflinePlayer player : Bukkit.getServer().getOfflinePlayers()) {
                            JSONObject playerStats = new JSONObject();

                            // Loop through statistics and add to player object.
                            for (Statistic stat : Statistic.values()) {
                                // Get statistic if it is not a substatistic.
                                if (!stat.isSubstatistic()) {
                                    playerStats.put(stat.toString(), player.getStatistic(stat));
                                }
                            }

                            allPlayers.put(player.getUniqueId().toString(), playerStats);
                        }

                        dataToRespond.put("allPlayers", allPlayers);
                        break;
                        
                    case "discordchatrelay":
                        String username = response.getString("username");
                        String message = response.getString("message");
                        
                        Function.sendFakeChatMessage(username, message);
                        dataToRespond.put("success", true);
                    	break;
                    	
                    case "getconfig":
                    	dataToRespond.put("config", this.getConfig().saveToString());
                    	dataToRespond.put("success", true);
                    	break;
                    	
                    case "updateconfig":
                    	JSONArray cfg = response.getJSONArray("values");
                    	int changesMade = 0;
                    	
                    	for (int i = 0; i < cfg.length(); i++) {                    		
                    		try {
                    			JSONObject obj = cfg.getJSONObject(i);
                    			
                    			String key = obj.getString("key");
                    			Object value = obj.get("value");

                    			this.getConfig().set(key, value);
                    			changesMade++;
                    		} catch (Exception e) {}
                    	}
                    	
                    	// If changes were made, this was successful so save config to file.
                    	if (changesMade > 0) {
                    	
                    		this.saveConfig();
                    		dataToRespond.put("success", true);
                    	
                    	} else {                    		
                    		dataToRespond.put("success", false);
                    	}
                    	
                    	break;
                }

                Function.socket.emit("askServer:response", dataToRespond);

            } catch (JSONException ex) {
                Bukkit.getLogger().log(Level.INFO, "Error receiving socket message: {0}", ex);
            }
        });


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
        getLogger().info("Minecraft web integration plugin disabled");
    }

    public static Plugin getPluginInstance(){
        return instance;
    }

}