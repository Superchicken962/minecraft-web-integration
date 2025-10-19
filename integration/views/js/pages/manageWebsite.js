const updateBtn = document.querySelector(".updateBtn");
const adminSocket = io('/admin', {
    auth: {
        discord: MY_ID
    }
});

const progressBox = document.querySelector("textarea.textLog") || document.createElement("textarea");
progressBox.className = "textLog";
progressBox.disabled = true;

updateBtn?.addEventListener("click", async() => {
    updateBtn.classList.add("disabled");
    updateBtn.before(progressBox);
    progressBox.value = "";

    adminSocket.emit("updateProject:start");
});

adminSocket.on("updateProject:progress", (data) => {
    progressBox.value += `${data.message}\n`;
});


const checkUpdateBtn = document.querySelector(".checkUpdateBtn");
checkUpdateBtn?.addEventListener("click", () => {
    checkUpdateBtn.classList.add("disabled");
    
    fetch("/api/check-update", { method: "PATCH" }).then((res) => {
        checkUpdateBtn.innerHTML = `<i class="fa fa-check"></i>`;

        // Reload if an update is available now.
        if (res.status === 205) {
            window.location.reload();
            return;
        }

        const forceHint = document.createElement("p");
        forceHint.className = "hint";
        forceHint.innerHTML = `Or, <a class="forceUpdateBtn" href="#">force update</a> to redownload the files/plugin if necessary.`;

        const forceUpdateBtn = forceHint.querySelector(".forceUpdateBtn");
        forceUpdateBtn.addEventListener("click", () => {
            const check = confirm("Are you sure you want to force a \"re-update\"? This will redownload the files, and plugin if available.");
            if (!check) return;

            forceHint.innerHTML = "Forcing update...";
            adminSocket.emit("updateProject:start");
            window.location.reload();
        });

        checkUpdateBtn.after(forceHint);
    });
});

// Plugin config partt.
const pluginResp = document.querySelector(".pluginConfigResponse");
const configContainer = document.querySelector(".pluginConfig .inputs");
const saveBtn = document.querySelector("a.saveBtn");
saveBtn.addEventListener("click", savePluginConfig);

async function loadPluginConfig() {
    const req = await fetch("/api/config.yml");

    // Handle failed request.
    if (!req.ok) {
        configContainer.classList.add("hidden");
        pluginResp.className = "pluginConfigResponse alert error";

        let errorMsg = "An unknown error occured";
    
        // Use new error status for timed out response.
        if (req.status === 504) 
            errorMsg = "Connection timed out! Is the server offline?";
    
        pluginResp.textContent = errorMsg;
        return;
    }

    pluginResp.textContent = "";

    const config = await req.json();
    configContainer.innerHTML = "";

    for (const [key, val] of Object.entries(config)) {
        const inpDiv = document.createElement("div");
        inpDiv.className = "labeledInput";

        inpDiv.innerHTML = `
            <input class="input" id="${key}" name="${key}" value="${val}"/>
            <label for="${key}">${key}</label>
        `;

        configContainer.appendChild(inpDiv);
    }

    setElementsToMaxWidth("input");
    saveBtn.classList.remove("disabled");
    configContainer.classList.remove("hidden");
}
loadPluginConfig();

async function savePluginConfig() {
    saveBtn.classList.add("disabled");

    const headers = {
        "Content-type": "application/json"
    };

    const body = JSON.stringify({
        entries: getKeys("input")
    });

    const req = await fetch("/api/config.yml", { method: "POST", headers, body });
    if (!req.ok) {
        pluginResp.className = "pluginConfigResponse alert error";
        let errorMsg = "An unknown error occured";

        if (req.status === 504) 
            errorMsg = "Connection timed out! Is the server offline?";
    
        pluginResp.textContent = errorMsg;
        return;
    }

    pluginResp.textContent = "";
    saveBtn.textContent = "Saved!";

    setTimeout(() => {
        saveBtn.textContent = "Save";
        saveBtn.classList.remove("disabled"); 
    }, 3000);
}