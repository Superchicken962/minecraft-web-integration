package me.johngrasinili.commands;

import java.util.UUID;

import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;

import me.johngrasinili.Functions;
import net.md_5.bungee.api.ChatColor;

public class autoBridge implements CommandExecutor {
    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {

        if (!(sender instanceof Player)) {
            sender.sendMessage(ChatColor.RED+"Command can only be used by a player!");
            return true;
        }

        Player player = (Player) sender;
        UUID playerid = player.getUniqueId();

        Functions Function = new Functions();

        if (Function.getPlayerAutoBridge(playerid) == null) {
            Function.setPlayerAutoBridge(playerid, true);
            sender.sendMessage(ChatColor.GREEN+"Auto-Bridging Enabled");
        } else {
            Function.setPlayerAutoBridge(playerid, null);
            sender.sendMessage(ChatColor.RED+"Auto-Bridging Disabled");
        }

        return true;
    }
}
