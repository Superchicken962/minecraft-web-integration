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

const commandInput = document.querySelector("select.chatSelect");
commandInput.addEventListener("input", selectCommand);
const inputSuggestions = document.querySelector("datalist#commandSuggestion");

// TODO: Perhaps move to a separate file.
const COMMANDS = {
    "say": {},
    "w": { display: "whisper" },
    "time": {
        sub: [
            { name: "Set Day", value: "set day" },
            { name: "Set Night", value: "set night" },
            { name: "Set Noon", value: "set noon" },
            { name: "Set Midnight", value: "set midnight" },
        ]
    },
    "whitelist": {
        sub: [
            { name: "Enable Whitelist", value: "on" },
            { name: "Disable Whitelist", value: "off" },
            { name: "Show Whitelist", value: "list" },
            { name: "Add Player to Whitelist", value: "add " },
            { name: "Remove Player from Whitelist", value: "remove " },
        ]
    }
};

/**
 * Adds commands from object into input.
 */
function addCommandsToInput() {
    commandInput.innerHTML = "";

    const newOpt = (text = "", value = "") => {
        const opt = document.createElement("option");
        opt.textContent = `/${text}`;
        opt.value = value;
        commandInput.appendChild(opt);

        return opt;
    }

    newOpt();

    for (const [command, details] of Object.entries(COMMANDS)) {
        const opt = newOpt((details?.display || command), command);
    }

    loadSelectedCommand();
}

function loadSelectedCommand() {
    const selected = localStorage.getItem("manageServer.selectedCommand");
    const options = {};
    [...commandInput.querySelectorAll("option")].map(o => options[o.value] = o);
    
    // Select option if it was previously saved, and if is still a valid option.
    if (selected && selected in options) {
        commandInput.value = options[selected].value;
        updateSubInput(selected);
    }
}
function selectCommand() {
    const cmd = commandInput.value;
    localStorage.setItem("manageServer.selectedCommand", cmd);
    updateSubInput(cmd);
}

function updateSubInput(command) {
    // Clear suggestions first.
    inputSuggestions.innerHTML = "";

    // Check if command has "sub commands."
    const subCmds = COMMANDS[command]?.sub;
    if (!subCmds || subCmds.length === 0) return;

    for (const sub of subCmds) {
        const opt = document.createElement("option");
        opt.textContent = sub.name;
        opt.value = sub.value;

        inputSuggestions.appendChild(opt);
    }
}

addCommandsToInput();