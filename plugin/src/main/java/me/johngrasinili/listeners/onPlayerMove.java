package me.johngrasinili.listeners;

import java.util.UUID;
import me.johngrasinili.Functions;
import org.bukkit.ChatColor;
import org.bukkit.Location;
import org.bukkit.World;
import org.bukkit.block.Block;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerMoveEvent;
import org.bukkit.inventory.ItemStack;
import org.bukkit.plugin.Plugin;

public class onPlayerMove implements Listener {
	private Functions Function = null;
	
	public onPlayerMove(Plugin plugin) {
		Function = new Functions(plugin);
	}
    
    @EventHandler
    public void _onPlayerMove(PlayerMoveEvent event) {
        Player player = event.getPlayer();
        UUID playerid = player.getUniqueId();

        if (Function.getPlayerAutoBridge(playerid) != null) {
            Location loc = event.getTo();
            int x = loc.getBlockX();
            int y = loc.getBlockY();
            int z = loc.getBlockZ();

            World world = player.getWorld();
            Block blockbelow = world.getBlockAt(x,y-1,z);

            ItemStack helditem = player.getInventory().getItemInMainHand();

            if (!helditem.getType().isBlock() || !helditem.getType().isSolid() || helditem.getType().isAir() || !blockbelow.getType().toString().equalsIgnoreCase("AIR")) {
                return;
            }

            blockbelow.setType(helditem.getType());
            helditem.setAmount(helditem.getAmount()-1);
        };

        if (Function.isPlayerAFK(playerid)) {
            Double xFrom = event.getFrom().getX();
            Double zFrom = event.getFrom().getZ();

            Double xTo = event.getTo().getX();
            Double zTo = event.getTo().getZ();

            // player.sendMessage("x: "+xFrom+", "+xTo+" Matches = ("+(xFrom.equals(xTo))+")");
            // player.sendMessage("z: "+zFrom+", "+zTo+" Matches = ("+(zFrom.equals(zTo))+")");

            if (!xFrom.equals(xTo) && !zFrom.equals(zTo)) { // remove afk status for moving, but not for looking around
                player.sendMessage(ChatColor.RED+"Your status of AFK has been removed because you moved!");
                Function.removePlayerFromAFK(playerid);
                Function.disableAFK(player);
            }
        }

        // check if taskcompletionstate is false
        String jaiGameTaskWait = Function.taskCompletionState(playerid, "leaveJaiGame_waitFirst");
        if (jaiGameTaskWait == "active") {
            Double yFrom = event.getFrom().getY();
            Double yTo = event.getTo().getY();

            if (!yFrom.equals(yTo)) {
                player.sendMessage(ChatColor.RED+"Your teleport out of JaiGame has been canceled because you jumped!");
                Function.removeAwaitedTask(playerid, "leaveJaiGame_waitFirst");
            }
        }
    }
}
