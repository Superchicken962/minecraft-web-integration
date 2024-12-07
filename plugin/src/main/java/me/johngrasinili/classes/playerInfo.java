package me.johngrasinili.classes;

import java.net.InetSocketAddress;
import java.util.UUID;

public class playerInfo {
    private String username;
    private UUID uuid;
    private InetSocketAddress ip;
    private int ping;

    public playerInfo(String username, UUID uuid, InetSocketAddress ip, int ping) {
        this.username = username;
        this.uuid = uuid;
        this.ip = ip;
        this.ping = ping;
    }

    public String getUsername() {
        return username;
    }

    public UUID getUUID() {
        return uuid;
    }

    public InetSocketAddress getIp() {
        return ip;
    }

    public int getPing() {
        return ping;
    }
}
