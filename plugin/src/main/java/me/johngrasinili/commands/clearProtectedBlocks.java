package me.johngrasinili.commands;

import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.plugin.Plugin;

import me.johngrasinili.Functions;
import org.bukkit.ChatColor;

import org.bukkit.command.Command;

public class clearProtectedBlocks implements CommandExecutor {
	private Functions Function = null;
	
	public clearProtectedBlocks(Plugin plugin) {
		Function = new Functions(plugin);
	}

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        
        if (!sender.isOp()) {
            sender.sendMessage(ChatColor.RED+"You do not have permission to use this command!");
            return true;
        }

        Function.clearProtectedBlocks();

        if (Function.protectedBlocksIsEmpty() == true) {
            sender.sendMessage(ChatColor.GREEN+"Removed protection from ALL protected blocks.");
        } else {
            sender.sendMessage(ChatColor.RED+"Unable to remove protection from all protected blocks.");
        }

        return true;
    }

}
