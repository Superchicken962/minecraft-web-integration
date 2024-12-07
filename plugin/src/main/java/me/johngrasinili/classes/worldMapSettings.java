package me.johngrasinili.classes;

import org.bukkit.GameMode;

public class worldMapSettings {
    private String worldname;
    private GameMode gamemode;

    public worldMapSettings(String worldname, GameMode gamemode) {
        this.worldname = worldname;
        this.gamemode = gamemode;
    }

    public String getWorldName() {
        return worldname;
    }

    public GameMode getGameMode() {
        return gamemode;
    }
}
