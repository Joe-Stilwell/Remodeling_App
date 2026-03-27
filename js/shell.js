let widgetOrder = [];
const SPAWN_SLOTS = [{x:250,y:80},{x:280,y:110},{x:310,y:140},{x:340,y:170},{x:370,y:200}];

/* --- 1. WINDOW MANAGEMENT --- */
function focusWidget(widget) {
    if (!widget) return;
    widgetOrder = widgetOrder.filter(id => id !== widget.id);
    widgetOrder.unshift(widget.id);
    document.querySelectorAll('.widget-instance').forEach(w => w.style.zIndex = 100);
    widget.style.zIndex = 1000;

    // Sync Pills
    document.querySelectorAll('#widget-dock div').forEach(p => p.classList.remove('border-blue-600','ring-2','ring-blue-100'));
    const pill = document.getElementById(`pill-${widget.id}`);
    if (pill) pill.classList.add('border-blue-600','ring-2','ring-blue-100');

    // Sync Sidebar
    document.querySelectorAll('.sub-tab').forEach(tab => tab.classList.remove('active-tab-highlight'));
    const title = widget.querySelector('.widget-title-centered')?.innerText.trim();
    if (title) {
        document.querySelectorAll('.sub-tab').forEach(tab => {
            if (tab.innerText.trim() === title) tab.classList.add('active-tab-highlight');
        });
    }
}

function createPill(title, id) {
    const dock = document.getElementById('widget-dock');
    const pill = document.createElement('div');
    pill.id = `pill-${id}`;
    pill.className = "w-full py-2 px-3 bg-white border-l-4 border-blue-400 rounded-lg shadow-sm text-[11px] font-bold text-slate-600 cursor-pointer text-center select-none mb-2 hover:bg-slate-50 transition-all";
    pill.innerText = title;
    // Fix #6: Connect Pill click to visibility
    pill.onclick = () => window.toggleWidgetVisibility(id);
    dock.appendChild(pill);
    
    // Fix #7: Re-sort dock alphabetically
    const pills = Array.from(dock.children);
    pills.sort((a, b) => a.innerText.localeCompare(b.innerText)).forEach(p => dock.appendChild(p));
}

/* --- 2. THE SPAWNER --- */
async function spawnWidget(title = "New Widget") {
    const uniqueId = title.toLowerCase().replace(/\s+/g, '-') + "-" + Date.now();
    widgetOrder.push(uniqueId);
    try {
        const resp = await fetch('widgets/widget-template.html');
        const template = await resp.text();
        const widget = new DOMParser().parseFromString(template, 'text/html').body.firstChild;
        
        widget.id = uniqueId;
        widget.classList.add('widget-instance');
        widget.setAttribute('data-hidden', 'false');
        
        const count = document.querySelectorAll('.widget-instance').length;
        const pos = SPAWN_SLOTS[count % SPAWN_SLOTS.length];
        widget.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
        
        widget.style.width = "450px";
        widget.style.height = "250px";
        
        widget.querySelector('.widget-title-centered').innerText = title;
        document.getElementById('main-content').appendChild(widget);
        
        makeDraggable(widget);
        makeResizable(widget);
        createPill(title, uniqueId);
        focusWidget(widget);
        
        widget.addEventListener('mousedown', () => focusWidget(widget));
    } catch (err) { console.error("Spawn Error:", err); }
}

/* --- 3. PHYSICS ENGINE (Snap + Resize Snap) --- */
function makeDraggable(widget) {
    const header = widget.querySelector('.widget-header');
    if (!header) return;
    header.onmousedown = (e) => {
        if (e.target.closest('button')) return;
        e.preventDefault();
        focusWidget(widget);
        const mainRect = document.getElementById('main-content').getBoundingClientRect();
        const style = window.getComputedStyle(widget);
        const matrix = new WebKitCSSMatrix(style.transform);
        const offsetX = e.clientX - matrix.m41;
        const offsetY = e.clientY - matrix.m42;

        const onMouseMove = (me) => {
            let tx = me.clientX - offsetX;
            let ty = me.clientY - offsetY;
            const snap = 15;
            const maxX = mainRect.width - widget.offsetWidth;
            const maxY = mainRect.height - widget.offsetHeight;

            document.querySelectorAll('.widget-instance').forEach(n => {
                if (n === widget || n.getAttribute('data-hidden') === 'true') return;
                const nM = new WebKitCSSMatrix(window.getComputedStyle(n).transform);
                const nX = nM.m41, nY = nM.m42, nW = n.offsetWidth, nH = n.offsetHeight;

                if (Math.abs(ty - nY) < snap) ty = nY;
                if (Math.abs(ty - (nY + nH)) < snap) ty = nY + nH;
                if (Math.abs((ty + widget.offsetHeight) - nY) < snap) ty = nY - widget.offsetHeight;
                if (Math.abs(tx - nX) < snap) tx = nX;
                if (Math.abs(tx - (nX + nW)) < snap) tx = nX + nW;
                if (Math.abs((tx + widget.offsetWidth) - nX) < snap) tx = nX - widget.offsetWidth;
            });

            if (tx < 0) tx = 0; if (ty < 0) ty = 0;
            if (tx > maxX) tx = maxX; if (ty > maxY) ty = maxY;
            widget.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        };
        const onMouseUp = () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };
}

function makeResizable(widget) {
    const handle = widget.querySelector('.resizer-handle');
    if (!handle) return;
    handle.onmousedown = (e) => {
        e.preventDefault(); e.stopPropagation();
        focusWidget(widget);
        const sW = widget.offsetWidth, sH = widget.offsetHeight, sX = e.clientX, sY = e.clientY;
        const mainRect = document.getElementById('main-content').getBoundingClientRect();
        const matrix = new WebKitCSSMatrix(window.getComputedStyle(widget).transform);

        const onMouseMove = (me) => {
            let nW = sW + (me.clientX - sX);
            let nH = sH + (me.clientY - sY);
            const snap = 15;

            // Fix #3a: Resizing Snap Logic
            document.querySelectorAll('.widget-instance').forEach(n => {
                if (n === widget || n.getAttribute('data-hidden') === 'true') return;
                const nM = new WebKitCSSMatrix(window.getComputedStyle(n).transform);
                const nX = nM.m41, nY = nM.m42;
                
                if (Math.abs((matrix.m41 + nW) - nX) < snap) nW = nX - matrix.m41;
                if (Math.abs((matrix.m42 + nH) - nY) < snap) nH = nY - matrix.m42;
            });

            if (matrix.m41 + nW > mainRect.width) nW = mainRect.width - matrix.m41;
            if (matrix.m42 + nH > mainRect.height) nH = mainRect.height - matrix.m42;

            widget.style.width = Math.max(300, nW) + 'px';
            widget.style.height = Math.max(150, nH) + 'px';
        };
        const onMouseUp = () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };
}

/* --- 4. GLOBAL ACTIONS --- */
window.toggleWidgetVisibility = (id) => {
    const w = document.getElementById(id);
    const p = document.getElementById(`pill-${id}`);
    if (!w || !p) return;
    
    const isHidden = w.getAttribute('data-hidden') === 'true';
    
    if (isHidden) {
        // SHOWING THE WIDGET
        w.style.setProperty('display', 'flex', 'important');
        w.setAttribute('data-hidden', 'false');
        p.style.opacity = '1';
        p.style.filter = 'none';
        focusWidget(w);
    } else {
        // HIDING THE WIDGET
        w.style.setProperty('display', 'none', 'important');
        w.setAttribute('data-hidden', 'true');
        p.style.opacity = '0.4';
        p.style.filter = 'grayscale(100%)';
    }
};

window.shellMinimize = function(btn) {
    const widget = btn.closest('.widget-instance');
    if (widget && widget.id) {
        // Instead of forcing 'display: none', we use our existing visibility toggle
        // which is designed to handle the "Lights On/Off" logic safely.
        window.toggleWidgetVisibility(widget.id);
        console.log("Widget minimized via shellMinimize:", widget.id);
    }
};

window.toggleMaximize = (btn) => {
    const w = btn.closest('.widget-instance');
    if (!w) return;
    if (w.dataset.isMaximized === 'true') {
        w.style.width = w.dataset.prevW; w.style.height = w.dataset.prevH; 
        w.style.transform = w.dataset.prevTransform; w.dataset.isMaximized = 'false';
    } else {
        w.dataset.prevW = w.style.width; w.dataset.prevH = w.style.height; 
        w.dataset.prevTransform = w.style.transform;
        w.style.width = '100%'; w.style.height = '100%'; 
        w.style.transform = 'translate3d(0,0,0)'; w.dataset.isMaximized = 'true';
    }
};

window.closeWidget = (btn) => {
    const w = btn.closest('.widget-instance');
    document.getElementById(`pill-${w.id}`)?.remove();
    w.remove();
};

window.toggleSidebar = () => {
    const sidebar = document.getElementById('left-sidebar');
    sidebar.classList.toggle('sidebar-collapsed');
    
    if (sidebar.classList.contains('sidebar-collapsed')) {
        sidebar.style.width = '50px';
    } else {
        sidebar.style.width = '160px';
    }
};

window.setActive = (el) => { 
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active')); 
    el.classList.add('active'); 
};

window.setSubActive = (el) => {
    // ... your existing sub-active code here ...
};