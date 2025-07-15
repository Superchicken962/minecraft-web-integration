package me.johngrasinili.commands;

import java.util.UUID;

import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.bukkit.plugin.Plugin;

import me.johngrasinili.Functions;
import net.md_5.bungee.api.ChatColor;

public class protectBlocks implements CommandExecutor {
	private Functions Function = null;
	
	public protectBlocks(Plugin plugin) {
		Function = new Functions(plugin);
	}

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        
        if (!sender.isOp()) {
            sender.sendMessage(ChatColor.RED+"You do not have permission to use this command!");
            return true;
        }

        if (!(sender instanceof Player)) {
            sender.sendMessage(ChatColor.RED+"This command must be executed by a player!");
            return true;
        }

        Player player = (Player) sender;
        UUID playerid = player.getUniqueId();

        if (Function.getProtectionModeForPlayer(playerid) == null) {
            Function.setProtectionModeForPlayer(playerid, true);
            sender.sendMessage(ChatColor.GREEN+"Protection Block Mode Enabled! (Hit a block to mark it as protected)");
        } else {
            Function.setProtectionModeForPlayer(playerid, false);
            sender.sendMessage(ChatColor.RED+"Protection Block Mode Disabled");
        }
        
        return true;
    }
    
}