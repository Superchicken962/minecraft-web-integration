package me.johngrasinili;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;

import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.GameMode;
import org.bukkit.Location;
import org.bukkit.World;
import org.bukkit.block.Block;
import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.entity.Player;
import org.bukkit.plugin.Plugin;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scoreboard.Scoreboard;
import org.bukkit.scoreboard.Team;
import org.bukkit.scoreboard.Team.Option;
import org.bukkit.scoreboard.Team.OptionStatus;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import me.johngrasinili.classes.PlayerAction;
import me.johngrasinili.classes.worldMapSettings;
import me.johngrasinili.classes.playerInfo;
import me.johngrasinili.classes.playerLocation;
import me.johngrasinili.classes.taskToComplete;

public class Functions {
    DataStorage data = new DataStorage();
    HashMap<UUID, Boolean> protectedBlockMode = DataStorage.protectBlockMode;
    HashMap<Block, Boolean> protectedBlocks = DataStorage.protectedBlocks;
    HashMap<UUID, Boolean> autoBridge = DataStorage.autoBridge;
    HashMap<UUID, Boolean> afkPlayers = DataStorage.afkPlayers;
    HashMap<String, worldMapSettings> worldMapSettings = DataStorage.worldMapSettings;
    HashMap<UUID, List<taskToComplete>> awaitingTaskComplete = DataStorage.AwaitingTaskCompletion;
    HashMap<UUID, playerLocation> playerLastLocations = DataStorage.PlayerLastLocation;
    public final SocketClient socket = DataStorage.ServerSocket;
    HashMap<UUID, Long> playerJoinTime = DataStorage.PlayerJoinTime;

    Team afkTeam = DataStorage.team_AFK;
    Team JaiGameTeam = DataStorage.team_JaiGame;
    Scoreboard scoreboard = DataStorage.scoreboard;
    
    private Plugin plugin = null;
    public Functions(Plugin plugin) {
    	this.plugin = plugin;
    }

    public Scoreboard getScoreboard() {
    	return scoreboard;
    }

    public void setProtectedBlock(Block block, Boolean value) {
        if (value != null) {
            protectedBlocks.put(block, value);            
        } else {
            protectedBlocks.remove(block);
        }
    }

    public Boolean isBlockProtected(Block block) {
        return protectedBlocks.get(block);
    }
    
    public void setProtectionModeForPlayer(UUID uuid, Boolean mode) {
        if (mode == true) {
            protectedBlockMode.put(uuid, mode);
        } else {
            protectedBlockMode.remove(uuid);
        }
    }

    public Boolean getProtectionModeForPlayer(UUID uuid) {
        return protectedBlockMode.get(uuid);
    }

    public void clearProtectedBlocks() {
        protectedBlocks.clear();
    }

    public Boolean protectedBlocksIsEmpty() {
        return protectedBlocks.isEmpty();
    }

    public void setPlayerAutoBridge(UUID uuid, Boolean mode) {
        autoBridge.put(uuid, mode);
    }

    public Boolean getPlayerAutoBridge(UUID uuid) {
        return autoBridge.get(uuid);
    }

    public Boolean isPlayerAFK(UUID uuid) {
        if (afkPlayers.get(uuid) != null) {
            return true;
        } else {
            return false;
        }
    }

    public void togglePlayerAFK(UUID uuid) {
        afkTeam.setOption(Team.Option.COLLISION_RULE, Team.OptionStatus.NEVER);
        afkTeam.setPrefix(ChatColor.GREEN+"[AFK] "+ChatColor.WHITE);

        if (!isPlayerAFK(uuid)) {
            afkPlayers.put(uuid, true);
            afkTeam.addEntry(Bukkit.getOfflinePlayer(uuid).getName());
            // System.out.println(afkTeam.getEntries().toString());
            return;
        }
        afkPlayers.remove(uuid);
        afkTeam.removeEntry(Bukkit.getOfflinePlayer(uuid).getName());
    }

    public void removePlayerFromAFK(UUID uuid) {
        afkPlayers.remove(uuid);
        afkTeam.removeEntry(Bukkit.getOfflinePlayer(uuid).getName());
    }

    public void enableAFK(Player player) {
        player.setCollidable(false);
        afkTeam.addEntry(player.getName());
        player.setInvulnerable(true);
    }

    public void disableAFK(Player player) {
        player.setCollidable(true);
        afkTeam.removeEntry(player.getName());
        player.setInvulnerable(false);
    }

    public void addPlayerToScoreboard(Player player) {
        player.setScoreboard(scoreboard);
    }

    public void addOnlinePlayersToScoreboard() {
        for (Player player : Bukkit.getOnlinePlayers()) {
            player.setScoreboard(scoreboard);
        }
    }

    // Remove the player from all storage/hashmaps - mainly for player leaving.
    public void clearPlayerFromStorage(Player player) {
        // Make sure to actually disable AFK mode.
        disableAFK(player);

        UUID id = player.getUniqueId();

        afkPlayers.remove(id);
        protectedBlockMode.remove(id);
        autoBridge.remove(id);
        playerJoinTime.remove(id);
    }

    public void sendLogsToServer(String logmessage) throws IOException, InterruptedException {

        HashMap<String, String> values = new HashMap<String, String>();
    
        values.put("log.content", logmessage);
        Date date = new Date();
        values.put("eventTime", Long.toString(date.getTime()));
        values.put("token", ("socketAuthToken"));

        ObjectMapper objectmapper = new ObjectMapper();
        String reqBody = objectmapper.writeValueAsString(values);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("http://127.0.0.1:80/api/post/log/console"))
            .setHeader("Content-Type", "application/json")
            .version(HttpClient.Version.HTTP_1_1)
            .POST(HttpRequest.BodyPublishers.ofString(reqBody))
            .build();

        client.sendAsync(request, HttpResponse.BodyHandlers.ofString());

    }

    public void sendLogsToServer(String chatMessage, String senderUsername, int senderPing, InetSocketAddress senderIp, Boolean senderIsOperator, URI senderSkinUrl) throws IOException, InterruptedException {

        HashMap<String, String> values = new HashMap<String, String>();
    
        values.put("message.sender.username", senderUsername);
        values.put("message.sender.ip", senderIp.toString());
        values.put("message.sender.ping", Integer.toString(senderPing));
        values.put("message.sender.isOp", senderIsOperator.toString());
        values.put("message.sender.skinUrl", senderSkinUrl.toString());
        values.put("message.content", chatMessage); 
        Date date = new Date();
        values.put("eventTime", Long.toString(date.getTime()));
        values.put("token", "Y+ZdEW3ZiQVGOXaW4gjo2Ikl4SyeeshDFD6Kp2WlqmpoYMAawXSZX7G+Gz9nboBK"); 

        ObjectMapper objectmapper = new ObjectMapper();
        String reqBody = objectmapper.writeValueAsString(values);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("http://127.0.0.1:80/api/post/log/chat"))
            .setHeader("Content-Type", "application/json")
            .version(HttpClient.Version.HTTP_1_1)
            .POST(HttpRequest.BodyPublishers.ofString(reqBody))
            .build();

        client.sendAsync(request, HttpResponse.BodyHandlers.ofString());

    }

    public void sendLogsToServer(String playerName, int playerPing, InetSocketAddress playerIp, Boolean playerIsOperator, URI senderSkinUrl, String JoinOrLeave, String JoinOrLeaveMessage) throws IOException, InterruptedException {

        HashMap<String, String> values = new HashMap<String, String>();
    
        values.put("player.username", playerName);
        values.put("player.ip", playerIp.toString());
        values.put("player.ping", Integer.toString(playerPing));
        values.put("player.isOp", playerIsOperator.toString());
        values.put("player.skinUrl", senderSkinUrl.toString());
        values.put("eventMessage", JoinOrLeaveMessage);
        Date date = new Date();
        values.put("eventTime", Long.toString(date.getTime()));
        values.put("token", "Y+ZdEW3ZiQVGOXaW4gjo2Ikl4SyeeshDFD6Kp2WlqmpoYMAawXSZX7G+Gz9nboBK"); 

        ObjectMapper objectmapper = new ObjectMapper();
        String reqBody = objectmapper.writeValueAsString(values);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("http://127.0.0.1:80/api/post/log/"+JoinOrLeave))
            .setHeader("Content-Type", "application/json")
            .version(HttpClient.Version.HTTP_1_1)
            .POST(HttpRequest.BodyPublishers.ofString(reqBody))
            .build();

        client.sendAsync(request, HttpResponse.BodyHandlers.ofString());

    }

    public void sendLogsToServer(String playerName, int playerPing, Boolean playerIsOperator, URI senderSkinUrl, String deathMessage, Player playerKiller) throws IOException, InterruptedException {

        HashMap<String, String> values = new HashMap<String, String>();
    
        values.put("player.username", playerName);
        values.put("player.ping", Integer.toString(playerPing));
        values.put("player.isOp", playerIsOperator.toString());
        values.put("player.skinUrl", senderSkinUrl.toString());
        values.put("deathMessage", deathMessage);
        if (playerKiller != null) {
            values.put("killer.username", playerKiller.getName());
            values.put("killer.ping", Integer.toString(playerKiller.getPing()));
            values.put("killer.isOp", Boolean.toString(playerKiller.isOp()));
        }
        Date date = new Date();
        values.put("eventTime", Long.toString(date.getTime()));
        values.put("token", "Y+ZdEW3ZiQVGOXaW4gjo2Ikl4SyeeshDFD6Kp2WlqmpoYMAawXSZX7G+Gz9nboBK"); 

        ObjectMapper objectmapper = new ObjectMapper();
        String reqBody = objectmapper.writeValueAsString(values);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("http://127.0.0.1:80/api/post/log/player_death"))
            .setHeader("Content-Type", "application/json")
            .version(HttpClient.Version.HTTP_1_1)
            .POST(HttpRequest.BodyPublishers.ofString(reqBody))
            .build();

        client.sendAsync(request, HttpResponse.BodyHandlers.ofString());

    }

    public void sendServerStartedLog() throws JsonProcessingException {
        HashMap<String, String> values = new HashMap<String, String>();

        Date date = new Date();
        values.put("eventTime", Long.toString(date.getTime()));
        values.put("token", "Y+ZdEW3ZiQVGOXaW4gjo2Ikl4SyeeshDFD6Kp2WlqmpoYMAawXSZX7G+Gz9nboBK"); 

        ObjectMapper objectmapper = new ObjectMapper();
        String reqBody = objectmapper.writeValueAsString(values);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("http://127.0.0.1:80/api/post/log/server_start"))
            .setHeader("Content-Type", "application/json")
            .version(HttpClient.Version.HTTP_1_1)
            .POST(HttpRequest.BodyPublishers.ofString(reqBody))
            .build();

        client.sendAsync(request, HttpResponse.BodyHandlers.ofString());
    }

    public void sendAdvancementLog(String playerName, int playerPing, InetSocketAddress playerIp, Boolean playerIsOperator, URI playerSkinUrl, String AdvancementName, String AdvancementDesc, String AdvancementIconItem) throws IOException, InterruptedException {

        HashMap<String, String> values = new HashMap<String, String>();
    
        values.put("player.username", playerName);
        values.put("player.ip", playerIp.toString());
        values.put("player.ping", Integer.toString(playerPing));
        values.put("player.isOp", playerIsOperator.toString());
        values.put("player.skinUrl", playerSkinUrl.toString());
        values.put("event.advancementName", AdvancementName);
        values.put("event.advancementDesc", AdvancementDesc);
        values.put("event.advancementIcon", AdvancementIconItem);
        Date date = new Date();
        values.put("eventTime", Long.toString(date.getTime()));
        values.put("token", "Y+ZdEW3ZiQVGOXaW4gjo2Ikl4SyeeshDFD6Kp2WlqmpoYMAawXSZX7G+Gz9nboBK"); 

        ObjectMapper objectmapper = new ObjectMapper();
        String reqBody = objectmapper.writeValueAsString(values);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("http://127.0.0.1:80/api/post/log/player_advancement"))
            .setHeader("Content-Type", "application/json")
            .version(HttpClient.Version.HTTP_1_1)
            .POST(HttpRequest.BodyPublishers.ofString(reqBody))
            .build();

        client.sendAsync(request, HttpResponse.BodyHandlers.ofString());

    }

    public void logPlayerAction(playerInfo playerinfo, PlayerAction action) throws JsonProcessingException {
        HashMap<String, Object> values = new HashMap<String, Object>();

        Date date = new Date();
        values.put("player", playerinfo);
        values.put("action", action);
        values.put("adminOnly", true);
        values.put("eventTime", Long.toString(date.getTime()));
        values.put("token", "Y+ZdEW3ZiQVGOXaW4gjo2Ikl4SyeeshDFD6Kp2WlqmpoYMAawXSZX7G+Gz9nboBK");

        ObjectMapper objectmapper = new ObjectMapper();
        String reqBody = objectmapper.writeValueAsString(values);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("http://127.0.0.1:80/api/post/action"))
            .setHeader("Content-type", "application/json")
            .version(HttpClient.Version.HTTP_1_1)
            .POST(HttpRequest.BodyPublishers.ofString(reqBody))
            .build();
        
        client.sendAsync(request, HttpResponse.BodyHandlers.ofString());

    }


    public void setGameModeForWorld(String WorldName, GameMode gamemode) {
        worldMapSettings settings = new worldMapSettings(WorldName, gamemode);
        worldMapSettings.put(WorldName, settings);
    }

    public GameMode getGameModeForWorld(String WorldName) {
        worldMapSettings map = worldMapSettings.get(WorldName);

        if (map == null) {
            return GameMode.SURVIVAL; // by default, set gamemode to survival
        }

        return map.getGameMode();
    }

    public void addTaskToWaitFor(UUID playerId, taskToComplete task) {
        List<taskToComplete> existingTasks = awaitingTaskComplete.get(playerId);

        if (existingTasks == null) {
            existingTasks = new ArrayList<taskToComplete>(); // if player is not found in hashmap, create the new empty list to then add to 
        }
        
        existingTasks.add(task); // add the task to either the new, or existing list

        awaitingTaskComplete.put(playerId, existingTasks); // put it into the hashmap
    }

    public void removeAwaitedTask(UUID playerId, String taskname) {
        List<taskToComplete> existingTasks = awaitingTaskComplete.get(playerId);

        if (existingTasks == null) {
            return; // do nothing more as there are no tasks found
        }

        // remove tasks that match the given task name
        existingTasks.removeIf(task -> task.getTaskName().equals(taskname));

        // put the tasks back into the hashmap for the player uuid
        awaitingTaskComplete.put(playerId, existingTasks);
    }

    public String taskCompletionState(UUID playerId, String taskname) {
        List<taskToComplete> existingTasks = awaitingTaskComplete.get(playerId);

        if (existingTasks == null) {
            return null; // if the task is not found, return null.
        }

        // loop through the tasks, and if there are any with a matching taskname, return false as the task has not been completed yet
        for (taskToComplete task: existingTasks) {
            if (task.getTaskName().equals(taskname)) {
                return task.getCompletionState();
            }
        }

        return null; // if nothing is returned by now, just return null
    }

    public World getDefaultWorld() {
        return Bukkit.getWorld("world");
    }

    public void setPlayerLastLocation(UUID playerid, Location location) {
        playerLocation locationinfo = new playerLocation(playerid, location, location.getWorld());
        playerLastLocations.put(playerid, locationinfo);
    }

    public playerLocation getPlayerLastLocation(UUID playerid) {
        return playerLastLocations.get(playerid);
    }

    public void joinJaiGameTeam(UUID uuid) {
        JaiGameTeam.setPrefix(ChatColor.AQUA+"[JaiGame] "+ChatColor.WHITE);
        JaiGameTeam.setOption(Option.NAME_TAG_VISIBILITY, OptionStatus.ALWAYS);

        String pName = Bukkit.getOfflinePlayer(uuid).getName();

        if (pName != null) {
            JaiGameTeam.addEntry(pName);
        }
    }

    public void leaveJaiGameTeam(UUID uuid) {
        String pName = Bukkit.getOfflinePlayer(uuid).getName();

        if (pName != null) {
            JaiGameTeam.removeEntry(pName);
        }
    }

    public Boolean isUserInJaiGameTeam(String username) {
        return JaiGameTeam.getEntries().contains(username);
    }

    public void sendFakeChatMessage(String username, String content) {
        String message = String.format("<%s> %s", username, content);

        Bukkit.getServer().broadcastMessage(message);
    }

    public void setPlayerJoinTime(UUID playerId) {
        playerJoinTime.put(playerId, System.currentTimeMillis());
    }

    public void deletePlayerJoinTime(UUID playerId) {
        playerJoinTime.remove(playerId);
    }

    // Get the different between time from join and now.
    public Long getPlayerSessionTime(UUID playerId) {
        Long nowTime = System.currentTimeMillis();
        Long storedTime = playerJoinTime.get(playerId);

        if (storedTime == null) {
            return 0L;
        }

        Long difference = nowTime - storedTime;
        return difference;
    }

    // ideas for more stuff:
    // -command to change drops of block and/or entity
	
	// log item usage / blocks destroyed (send to nodejs server?)
	// setup websocket to easily communicate with nodejs server (?)

    // afk command:
    // -Prevents mobs from targetting player
    // -Disables player to player collisions for player
    // -Deactivates when player moves
    // -Allows attack inputs (for fishing farms)
}
