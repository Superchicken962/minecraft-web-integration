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
import org.bukkit.OfflinePlayer;
import org.bukkit.Statistic;
import org.bukkit.World;
import org.bukkit.Statistic.Type;
import org.bukkit.block.Block;
import org.bukkit.entity.Player;
import org.bukkit.scoreboard.Scoreboard;
import org.bukkit.scoreboard.Team;
import org.bukkit.scoreboard.Team.Option;
import org.bukkit.scoreboard.Team.OptionStatus;

import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.annotation.JsonAutoDetect.Visibility;
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

    Team afkTeam = DataStorage.team_AFK;
    Team JaiGameTeam = DataStorage.team_JaiGame;
    Scoreboard scoreboard = DataStorage.scoreboard;

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

    public void clearPlayerFromStorage(UUID uuid) {
        afkPlayers.remove(uuid);
        protectedBlockMode.remove(uuid);
        autoBridge.remove(uuid);
    }

    public void sendLogsToServer(String logmessage) throws IOException, InterruptedException {

        HashMap<String, String> values = new HashMap<String, String>();
    
        values.put("log.content", logmessage); 
        Date date = new Date();
        values.put("eventTime", Long.toString(date.getTime()));
        values.put("token", "Y+ZdEW3ZiQVGOXaW4gjo2Ikl4SyeeshDFD6Kp2WlqmpoYMAawXSZX7G+Gz9nboBK"); 

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

    public void updateStatistics() throws JsonProcessingException {
        HashMap<String, Object> values = new HashMap<String, Object>();
        
        List<world_stats> statistics = new ArrayList<world_stats>();

        for (Statistic stat : Statistic.values()) { // for each statistic

            if (stat.getType() != Type.UNTYPED) continue;

            List<player_stat> players = new ArrayList<player_stat>();

            OfflinePlayer[] offlineplayers = Bukkit.getOfflinePlayers();
            for (OfflinePlayer player : offlineplayers) { // iterate through offlineplayers array
                int playerstat = player.getStatistic(stat);
                String username = player.getName();
                UUID uuid = player.getUniqueId();

                player_stat playerobj = new player_stat(username, uuid, Integer.toString(playerstat));
                players.add(playerobj);
            }

            world_stats stats = new world_stats(stat.toString(), players);
            statistics.add(stats);
        }

        Date date = new Date();
        String time = Long.toString(date.getTime());
        String token = "Y+ZdEW3ZiQVGOXaW4gjo2Ikl4SyeeshDFD6Kp2WlqmpoYMAawXSZX7G+Gz9nboBK";

        values.put("updateTime", time);
        values.put("token", token);
        values.put("statistics", statistics);
        
        ObjectMapper objectmapper = new ObjectMapper();
        objectmapper.setVisibility(PropertyAccessor.FIELD, Visibility.ANY);
        String reqBody = objectmapper.writeValueAsString(values);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("http://127.0.0.1:80/api/update/stats"))
            .setHeader("Content-Type", "application/json")
            .version(HttpClient.Version.HTTP_1_1)
            .POST(HttpRequest.BodyPublishers.ofString(reqBody))
            .build();

        client.sendAsync(request, HttpResponse.BodyHandlers.ofString());
    }

    public class world_stats {
        private String statname;
        private List<player_stat> players;

        public world_stats(String statname, List<player_stat> players) {
            this.statname = statname;
            this.players = players;
        }

        public String getStatname() {
            return statname;
        }

        public List<player_stat> getPlayers() {
            return players;
        }
    }

    public class player_stat {
        private String username;
        private UUID uuid;
        private String value;

        public player_stat(String username, UUID uuid, String value) {
            this.username = username;
            this.uuid = uuid;
            this.value = value;
        }

        public String getUsername() {
            return username;
        }

        public UUID getUUID() {
            return uuid;
        }

        public String getValue() {
            return value;
        }
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
