const actionButtons = document.querySelectorAll(".serverAction.btn");

for (const actionBtn of actionButtons) {
    actionBtn.addEventListener("click", function() {
        const action = this.getAttribute("data-action");
        // TODO: Disable button.

        const options = {
            body : JSON.stringify({ action }),
            headers: {
                "Content-type": "application/json"
            },
            method: "POST"
        };

        fetch("/manage/api/serverAction", options).then(() => {
            window.location.reload();
        });
    });
}

// Connect to normal & admin sockets - admin socket will reject connection if not authorised.
const socket = io();
const adminSocket = io('/admin', {
    auth: {
        discord: MY_ID
    }
});

// Log server logs to page.
adminSocket.on("server:log", logServerLog);
adminSocket.on("server:error", logServerLog);

const logsContainer = document.querySelector(".serverLogs .logs");

function logServerLog(data) {
    const logElement = document.createElement("p");
    logElement.className = "log";
    logElement.textContent = data;

    logsContainer.appendChild(logElement);

    scrollToBottomOfLogs();
}

/**
 * Adjusts logs container to 
 */
function scrollToBottomOfLogs() {
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

const clearLogsBtn = document.querySelector(".clearLogsBtn");
clearLogsBtn.addEventListener("click", () => {
    fetch("/manage/api/logs/clear").then(() => {
        window.location.reload();
    })
});

scrollToBottomOfLogs();