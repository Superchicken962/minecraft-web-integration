package me.johngrasinili;

import java.util.HashMap;
import java.util.List;
import java.util.UUID;

import org.bukkit.Bukkit;
import org.bukkit.World;
import org.bukkit.block.Block;
import org.bukkit.scoreboard.Scoreboard;
import org.bukkit.scoreboard.ScoreboardManager;
import org.bukkit.scoreboard.Team;

import me.johngrasinili.classes.playerLocation;
import me.johngrasinili.classes.taskToComplete;
import me.johngrasinili.classes.worldMapSettings;

public class DataStorage {
    public static final HashMap<UUID, Boolean> protectBlockMode = new HashMap<UUID, Boolean>();
    public static final HashMap<Block, Boolean> protectedBlocks = new HashMap<Block, Boolean>();
    public static final HashMap<UUID, Boolean> autoBridge = new HashMap<UUID, Boolean>();
    public static final HashMap<UUID, Boolean> afkPlayers = new HashMap<UUID, Boolean>();

    static ScoreboardManager manager = Bukkit.getScoreboardManager();
    public static final Scoreboard scoreboard = manager.getNewScoreboard();
    public static final Team team_AFK = scoreboard.registerNewTeam("AFK");

    public static final Team team_JaiGame = scoreboard.registerNewTeam("JaiGame");

    // public static final defaultGamemodeForWorld[] worldGameModes = new defaultGamemodeForWorld[Bukkit.getWorlds().size()];
    public static final HashMap<String, worldMapSettings> worldMapSettings = new HashMap<String, worldMapSettings>();

    public static final World JaiGame = Bukkit.getWorld("jaigame");
    public static final World defaultWorld = Bukkit.getWorld("world");
    // public static final boolean JaiGameEnabled = false;

    public static final HashMap<UUID, List<taskToComplete>> AwaitingTaskCompletion = new HashMap<UUID, List<taskToComplete>>();

    // hold the last location of a player (currently used for teleporting back to same spot from another world)
    public static final HashMap<UUID, playerLocation> PlayerLastLocation = new HashMap<UUID, playerLocation>();

    // Get the plugin using the plugin name.
    public static final SocketClient ServerSocket = new SocketClient(Bukkit.getPluginManager().getPlugin("baby-gamers-mc-plugin").getConfig().getInt("socketPort", 3000));
}