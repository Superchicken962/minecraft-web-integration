package me.johngrasinili.commands;

import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;

import net.md_5.bungee.api.ChatColor;

public class test implements CommandExecutor {
    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {

        // Player player = (Player) sender;

        // Functions Function = new Functions();

        // Scoreboard scoreboard = Function.getScoreboard();

        // Objective objective = scoreboard.registerNewObjective("test", Criteria.DUMMY, ChatColor.RED+"AFK");
        // objective.setDisplaySlot(DisplaySlot.BELOW_NAME);

        // player.setScoreboard(scoreboard);

        sender.sendMessage(ChatColor.RED+"does nothing");

        return true;
    }
}
