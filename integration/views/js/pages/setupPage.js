const showAllFields = (localStorage.getItem("setupPage:showAllFields") || "false");

function updateFieldsVisibility() {
    const show = (localStorage.getItem("setupPage:showAllFields") || "false");

    const validLabels = document.querySelectorAll("p.label.valid");
    if (show === "true") {
        showElements(...validLabels);
    } else {
        hideElements(...validLabels);
    }
}

const showFieldsToggle = document.querySelector(".showAllFieldsToggle");
if (showAllFields === "true") {
    showFieldsToggle.checked = true;
}

showFieldsToggle.addEventListener("input", function() {
    // Update local storage item then call to update the visiblity which then checks the local storage item.
    localStorage.setItem("setupPage:showAllFields", this.checked);
    updateFieldsVisibility();
});

updateFieldsVisibility();