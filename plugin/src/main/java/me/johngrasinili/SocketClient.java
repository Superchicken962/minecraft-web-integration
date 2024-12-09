package me.johngrasinili;

import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;
import java.net.URI;

public class SocketClient {
    private Socket serverSocket = null;

    // Create the socket instance with namespace /server.
    public SocketClient(int port) {
        URI namespaceUrl = URI.create(String.format("http://localhost:%d/server", port));

        IO.Options options = IO.Options.builder()
            .build();

        this.serverSocket = IO.socket(namespaceUrl, options);
        this.serverSocket.connect();
    }

    // Essentially an alias for listening for a socket event.
    public void listen(String event, Emitter.Listener callback) {
        this.serverSocket.on(event, callback);
    }

    public void emit(String event, Object... args) {
        this.serverSocket.emit(event, args);
    }
}