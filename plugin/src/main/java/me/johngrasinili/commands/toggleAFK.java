package me.johngrasinili.commands;

import java.util.UUID;
import me.johngrasinili.Functions;
import net.md_5.bungee.api.ChatColor;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.bukkit.plugin.Plugin;

public class toggleAFK implements CommandExecutor {
	private Functions Function = null;
	
	public toggleAFK(Plugin plugin) {
		Function = new Functions(plugin);
	}
	
    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {

        if (!(sender instanceof Player)) {
            sender.sendMessage(ChatColor.RED+"Command can only be used by a player!");
            return true;
        }

        Player player = (Player) sender;
        
        UUID playeruuid = player.getUniqueId();
        Boolean isAfk = Function.isPlayerAFK(playeruuid);

        if (Function.isUserInJaiGameTeam(player.getName())) {
            sender.sendMessage(ChatColor.RED+"You cannot be marked as 'AFK' while in the JaiGame world!");
            return true;
        }

        if (!isAfk) {
            sender.sendMessage(ChatColor.GREEN+"You are now marked as 'AFK'");
            Function.enableAFK(player);
        } else {
            sender.sendMessage(ChatColor.RED+"You are no longer marked as 'AFK'");
            Function.disableAFK(player);
        }
        
        Function.togglePlayerAFK(playeruuid);

        return true;
    }
}
