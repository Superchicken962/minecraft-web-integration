// Connect to normal & admin sockets - admin socket will reject connection if not authorised.
const socket = io();
const adminSocket = io('/admin', {
    auth: {
        discord: MY_ID
    }
});

const logsContainer = document.querySelector(".logsContainer");
const logs = logsContainer.querySelector(".logs");

/**
 * Creates and appends log element to page.
 * 
 * @param { String | Number } time - Log send date/timestamp.
 * @param { String } html - Html to give the log element - include element with "time" class to embed time.
 */
function log(time, html) {
    const dateSent = new Date(parseInt(time));
    const element = document.createElement("div");
    element.className = "log";

    element.innerHTML = html;

    const timeElement = element.querySelector(".time");
    if (timeElement) timeElement.textContent = dateSent.toLocaleString();

    element.style.color = "white";
    logs.appendChild(element);
}

socket.on("log:chat", (socket) => {
    log(socket.event.time, `
        <div class="chatMessage">
            <img class="avatar" src="https://minotar.net/helm/${socket.sender.username}"/>
            <b>${socket.sender.username}</b>
            <span class="content">${socket.message.content}</span>
            <span class="time"></span>
        </div>
    `);
});

socket.on("log:playerjoinorleave", (socket) => {
    console.log(socket);
    log(socket.event.time, `
        <div class="joinLeave">
            <img class="avatar" src="https://minotar.net/helm/${socket.player.username}"/>
            <span class="message" style="color:#FFFF55">${socket.event.message.replace("%p", socket.player.username)}</span>
            <span class="time"></span>
        </div>
    `);
});


adminSocket.on("log:console", (socket) => {
    log(socket.event.time, `
        <div class="consoleLog">
            <p>${socket.content}</p>
        </div>
    `);
});


socket.on("log:playerdeath", (socket) => {
    log(socket.event.time, `
        <div class="joinLeave">
            <img class="avatar" src="https://minotar.net/helm/${socket.player.username}"/>
            <span class="message" style="color:#FFFF55">${socket.event.deathMessage.replace("%p", socket.player.username)}</span>
            <span class="time"></span>
        </div>
    `);
});

socket.on("log:serverstart", (socket) => {
    log(socket.event.time, `
        <div class="chatMessage">
            <span class="content">${socket.event.message}</span>
            <span class="time"></span>
        </div>
    `);
});

socket.on("log:playeradvancement", (socket) => {
    log(socket.event.time, `
        <div class="advancement">
            <img class="avatar" src="https://minotar.net/helm/${socket.player.username}"/>
            <span class="message" style="color:#FFFF55">${socket.player.username} has made the advancement <span class="advancementName">[${socket.event.advancement.name}]</span></span>
            <span class="time"></span>
        </div>
    `);

    tippy(".advancementName", {
        content: socket.event.advancement?.description ?? "Unknown",
        theme: "light"
    });
});

socket.on("action:*", (socket) => {
    console.log(socket.eventTime);
    var datesent = new Date(parseInt(socket.eventTime));
    var p = document.createElement("p");
    p.innerHTML = `<span style="color:grey;">${datesent.toLocaleString()} </span><span style="color:red;">[Server Log]</span> ${socket.player.username} has crafted ${socket.action.itemCrafted} (x${socket.action.amountCrafted})`;
    p.style.color = "white";
    document.body.appendChild(p);
});

adminSocket.on("disconnect", (msg) => {
    console.warn("Disconnected from admin socket");
});

adminSocket.on("unauthorised", (msg) => {
    console.warn(msg);
});