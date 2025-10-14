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
        }
    });
});