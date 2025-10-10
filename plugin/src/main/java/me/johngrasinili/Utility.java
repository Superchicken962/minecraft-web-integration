package me.johngrasinili;

import java.net.URI;
import java.net.URL;

import org.bukkit.entity.Player;
import org.bukkit.profile.PlayerTextures;

public class Utility {

	/**
	 * Get skin uri for given player.
	 */
	public static URI getPlayerSkinUri(Player player) {
		URI uri = null;
		
		PlayerTextures texture = player.getPlayerProfile().getTextures();
		URL skinUrl = texture.getSkin();
		
		if (skinUrl == null) {
			return null;
		}
		try {
			uri = skinUrl.toURI();
		} catch(Exception e) {
			return null;
		}
		
		return uri;
	}

	/**
	 * Convert object to string, or returns null if object is null.
	 * 
	 * @return String or null
	 */
	public static String toStringOrNull(Object obj) {
		if (obj == null) return null;
		
		return obj.toString();
	}
}
