const updateBtn = document.querySelector(".updateBtn");
const adminSocket = io('/admin', {
    auth: {
        discord: MY_ID
    }
});

const progressBox = document.querySelector("textarea.textLog") || document.createElement("textarea");
progressBox.className = "textLog";
progressBox.disabled = true;

updateBtn.addEventListener("click", async() => {
    updateBtn.classList.add("disabled");
    updateBtn.before(progressBox);
    progressBox.value = "";

    adminSocket.emit("updateProject:start");
});

adminSocket.on("updateProject:progress", (data) => {
    console.log(progressBox.value);
    progressBox.value += `${data.message}\n`;
});