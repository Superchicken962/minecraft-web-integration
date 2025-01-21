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
            <img class="avatar" src="${socket.sender.avatarUrl}"/>
            <b>${socket.sender.username}</b>
            <span class="content">${socket.message.content}</span>
            <span class="time"></span>
        </div>
    `);
});

socket.on("log:playerjoinorleave", (socket) => {
    log(socket.event.time, `
        <div class="joinLeave">
            <img class="avatar" src="${socket.player.avatarUrl}"/>
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
    var datesent = new Date(parseInt(socket.event.time));
    var p = document.createElement("p");
    var message = socket.event.deathMessage.replace("%p", "<span class='player_name' style='color:#FFFF55;'>"+socket.player.username+"</span>").replace("%k", "<span class='killer_name' style='color:#FFFF55;'>"+socket.killer.username+"</span>");
    p.innerHTML = `<span style="color:grey;">${datesent.toLocaleString()} </span><span style="color:red;">[Server Log]</span> ${message}`;
    p.style.color = "white";
    document.body.appendChild(p);
});

socket.on("log:serverstart", (socket) => {
    var datesent = new Date(parseInt(socket.event.time));
    var p = document.createElement("p");
    p.innerHTML = `<span style="color:grey;">${datesent.toLocaleString()} </span><span style="color:red;">[Server Log]</span> ${socket.event.message}`;
    p.style.color = "white";
    document.body.appendChild(p);
});

socket.on("log:playeradvancement", (socket) => {
    var datesent = new Date(parseInt(socket.event.time));
    var p = document.createElement("p");
    p.innerHTML = `<span style="color:grey;">${datesent.toLocaleString()} </span><span style="color:red;">[Server Log]</span> ${socket.player.username} has made the advancement [${socket.event.advancement.name}]`;
    p.style.color = "white";
    document.body.appendChild(p);
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