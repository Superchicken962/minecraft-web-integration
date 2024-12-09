const { Server } = require("socket.io");
const http = require("http");

const httpServer = http.createServer();

const io = new Server(httpServer, {"path": "/socket.io/"});
const PORT = 3000;

io.of("/server").on("connection", (socket) => {
    console.log("New connection to socket!", socket.id);
});

setInterval(() => {
    console.log("Emitting test message");
    io.of("/server").emit("discordChatRelay", {
        message: "Hi"
    });
}, 15000);

httpServer.listen(PORT, () => {
    console.log(`[Socket Test] Listening on port ${PORT}`);
});