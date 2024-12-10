package me.johngrasinili;

import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;
import java.net.URI;
import java.util.HashMap;

public class SocketClient {
    private Socket serverSocket = null;
    private IO.Options options = null;

    // Create the socket instance with namespace /server.
    public SocketClient(int port) {
        URI namespaceUrl = URI.create(String.format("http://localhost:%d/server", port));

        this.options = IO.Options.builder()
            .setAuth(new HashMap<>())
            .build();

        this.serverSocket = IO.socket(namespaceUrl, this.options);
        this.serverSocket.connect();
    }

    public void setAuthToken(String token) {
        if (this.options == null) return;

        this.options.auth.put("token", token);
        this.serverSocket.disconnect().connect();
    }

    // Essentially an alias for listening for a socket event.
    public void listen(String event, Emitter.Listener callback) {
        this.serverSocket.on(event, callback);
    }

    public void emit(String event, Object... args) {
        this.serverSocket.emit(event, args);
    }
}