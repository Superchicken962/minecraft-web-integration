/**
 * Hides elements by setting their display to none.
 * 
 * @param  { ...HTMLElement } elements - Elements to hide.
 */
function hideElements(...elements) {
    elements.forEach(el => {
        el.style.display = "none";
    });
}

/**
 * Show elements by setting their display to block.
 * 
 * @param  { ...HTMLElement } elements - Elements to hide.
 */
function showElements(...elements) {
    elements.forEach(el => {
        el.style.display = "block";
    });
}

/**
 * Get all name/value data from elements matching selector.
 * 
 * @param { String } selector 
 * @returns 
 */
function getKeys(selector) {
    const elements = document.querySelectorAll(selector);
    const keys = {};

    for (const element of elements) {
        keys[element.name] = element.value;
    }

    return keys;
}