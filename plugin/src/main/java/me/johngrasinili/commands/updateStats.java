package me.johngrasinili.commands;

import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;

import com.fasterxml.jackson.core.JsonProcessingException;

import me.johngrasinili.Functions;
import net.md_5.bungee.api.ChatColor;

import org.bukkit.command.Command;

public class updateStats implements CommandExecutor {
    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        
        if (!sender.isOp()) return true;

        Functions Function = new Functions();

        try {
            Function.updateStatistics();
        } catch (JsonProcessingException err) {
            err.printStackTrace();
        }

        sender.sendMessage(ChatColor.GOLD+"Updated Stats");
        
        return true;
    }
}