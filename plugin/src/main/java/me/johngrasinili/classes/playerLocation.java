package me.johngrasinili.classes;

import java.util.UUID;

import org.bukkit.Location;
import org.bukkit.World;

public class playerLocation {
    private UUID playerid;
    private Location location;
    private World world;

    public playerLocation(UUID playerid, Location location, World world) {
        this.playerid = playerid;
        this.location = location;
        this.world = world;
    }

    public UUID getPlayerId() {
        return playerid;
    }

    public Location getLocation() {
        return location;
    }

    public World getWorld() {
        return world;
    }
}
