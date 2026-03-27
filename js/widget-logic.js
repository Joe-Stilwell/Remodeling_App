/** WIDGET-LOGIC.JS v1.0 
 * Specific behaviors for individual widget types
 */

window.initWidgetLogic = function(widgetId) {
    const widget = document.getElementById(widgetId);
    if (!widget) return;

    // We pull the title to decide which logic to run
    const title = widget.querySelector('.widget-title-centered')?.innerText.toUpperCase();
    
    console.log(`System: Running specialized logic for [${title}]`);

    // --- ROLODEX / PHONE BOOK LOGIC ---
    if (title === 'ROLODEX') {
        setupRolodex(widget);
    }

    // --- NEW CLIENT LOGIC ---
    if (title === 'NEW CLIENT') {
        setupNewClientForm(widget);
    }
};

/** Specific behavior for the Rolodex */
function setupRolodex(widget) {
    const content = widget.querySelector('.widget-content-area');
    // Example: You could add a 'Search' listener specifically for this window here
    console.log("Rolodex-specific listeners active.");
}

/** Specific behavior for the New Client Form */
function setupNewClientForm(widget) {
    // Example: Auto-focus the first input field
    const firstInput = widget.querySelector('input');
    if (firstInput) firstInput.focus();
}