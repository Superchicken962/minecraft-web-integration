const { Server } = require("socket.io");
const http = require("http");

const httpServer = http.createServer();

const io = new Server(httpServer, {"path": "/socket.io/"});
const PORT = 3003;

const authToken = "y#67RX1PtVa8VNWt2u_3gVMoXy$PZ$_IYhUpulAQ6$u15NwWPk";

io.of("/server").on("connection", (socket) => {
    const authorised = (socket.handshake.auth?.token === authToken);

    // Close unauthorised connections.
    if (!authorised) {
        socket.disconnect(true);
    }
});

setInterval(() => {
    console.log("Emitting test message");
    io.of("/server").emit("discordChatRelay", {
        username: "TestUsername",
        message: "Hi from test code",
        authToken
    });
}, 15000);

httpServer.listen(PORT, () => {
    console.log(`[Socket Test] Listening on port ${PORT}`);
});