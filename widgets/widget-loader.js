/**
 * SPAWN WIDGET
 * This function clones the template, gives it a name, 
 * and puts it on the screen.
 */
async function spawnWidget(widgetName) {
    // 1. Find the workspace where the widget should live
    const workspace = document.getElementById('workspace-area'); 
    if (!workspace) return console.error("System: Workspace area not found!");

    // 2. Fetch the HTML template
    try {
        const response = await fetch('widgets/widget-template.html');
        const htmlString = await response.text();

        // 3. Create a temporary element to hold the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString.trim();
        const newWidget = tempDiv.firstChild;

        // 4. Assign a unique ID (e.g., "New Vendor" becomes "new-vendor-widget")
        const uniqueId = widgetName.toLowerCase().replace(/\s+/g, '-') + '-widget';
        newWidget.id = uniqueId;

        // 5. Set the Title inside the widget header
        const titleSpan = newWidget.querySelector('.widget-title-centered');
        if (titleSpan) titleSpan.innerText = widgetName;

        // 6. Add it to the screen!
        workspace.appendChild(newWidget);

        // 7. Initialize the movement logic (Draggable/Resizable)
        if (window.initWidgetLogic) {
            window.initWidgetLogic(uniqueId);
        }

        console.log(`System: ${widgetName} spawned successfully.`);

    } catch (error) {
        console.error("System: Failed to load widget template:", error);
    }
}