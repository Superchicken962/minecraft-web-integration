async function save() {
    const configKeys = getKeys(".configKey");
    const secretKeys = getKeys(".secretKey");

    const headers = {
        "Content-type": "application/json"
    };

    const body = JSON.stringify({
        config: configKeys,
        secret: secretKeys
    });

    saveBtn.style.display = "none";

    const req = await fetch("/configure", { body, headers, method: "POST" });

    const respEl = document.querySelector(".requestResponse");

    if (req.status !== 200) {
        respEl.textContent = `Failed to Save (${req.statusText})`;
        respEl.className = "btn requestResponse bad";

        respEl.onclick = () => {
            respEl.textContent = "";
            saveBtn.style.display = "block";
        }

        return;
    }

    respEl.textContent = "Saved!";
    respEl.className = "btn requestResponse good";

}

const saveBtn = document.querySelector(".saveBtn");
saveBtn.addEventListener("click", save);