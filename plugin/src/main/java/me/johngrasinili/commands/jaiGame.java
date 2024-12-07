package me.johngrasinili.commands;

import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.World;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;

import me.johngrasinili.App;
import me.johngrasinili.Functions;
import me.johngrasinili.classes.playerLocation;
import me.johngrasinili.classes.taskToComplete;

public class jaiGame implements CommandExecutor {

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        Player p = (Player) sender;

        Functions Function = new Functions();

        p.sendMessage(""+ChatColor.BLUE+p.getWorld().getName());

        if (p.getWorld().getName().equals("jaigame")) {
            taskToComplete newTask = new taskToComplete(p.getUniqueId(), "leaveJaiGame_waitFirst");
            Function.addTaskToWaitFor(p.getUniqueId(), newTask);

            p.sendMessage(ChatColor.GOLD+"Leaving JaiGame in 3s... (Jump to cancel)");

            Bukkit.getServer().getScheduler().scheduleSyncDelayedTask(App.getPluginInstance(), new Runnable() {

                @Override
                public void run() {
                    // if the value exists, and is not "canceled" then the player has not moved!
                    Object taskCompletionState = Function.taskCompletionState(p.getUniqueId(), "leaveJaiGame_waitFirst");
                    if (taskCompletionState != null && taskCompletionState == "active") {
                        Function.removeAwaitedTask(p.getUniqueId(), "leaveJaiGame_waitFirst");

                        playerLocation playerLastLoc = Function.getPlayerLastLocation(p.getUniqueId());
                        if (playerLastLoc != null) {
                            p.teleport(playerLastLoc.getLocation());
                            // force bed respawn location so that player does not respawn back in JaiGame world
                            p.setBedSpawnLocation(playerLastLoc.getLocation(), true);
                        } else {
                            p.teleport(Function.getDefaultWorld().getSpawnLocation());
                        }
                    }
                }
                
            }, 60L); // 60 L = 3 sec, 20 ticks = 1 sec

            // p.sendMessage(ChatColor.RED+"You are already in the game! (Use /leave to go back)");
            return true;

            // when i come back to this, add a dev argument where only a specified player (jai) can use, and it sends to specific world with creative
        }

        World jaigame = Bukkit.getWorld("jaigame");

        if (jaigame == null) {
            p.sendMessage(ChatColor.RED+"Error: JaiGame does not exist!"); 
            return true;
        }
        
        p.sendMessage(ChatColor.RED+"Sorry! JaiGame has been temporarily disabled!");

        // // set player's location before teleporting, so when leaving they can be sent back there
        // Function.setPlayerLastLocation(p.getUniqueId(), p.getLocation());

        // p.sendMessage(ChatColor.GREEN+"Sending you to JaiGame!");
        // p.teleport(jaigame.getSpawnLocation());

        return true;
    }
    
}
