// ---------- DATA & STORAGE ----------
let lists = JSON.parse(localStorage.getItem("grocery-lists")) || null;
let currentListKey = localStorage.getItem("grocery-current-list") || "groceries";
let editingItemId = null;

// Default data if none stored
if (!lists) {
    lists = {
        groceries: {
            name: "Groceries",
            items: [
                { id: "1", text: "🥛 Milk", checked: false, category: "🥛 Dairy", qty: 1, price: "", priority: "normal", notes: "" },
                { id: "2", text: "🍞 Bread", checked: false, category: "🥖 Bakery", qty: 1, price: "", priority: "normal", notes: "" },
                { id: "3", text: "🥚 Eggs", checked: false, category: "🥛 Dairy", qty: 12, price: "", priority: "high", notes: "Get large" }
            ]
        }
    };
}

if (!lists[currentListKey]) {
    currentListKey = Object.keys(lists)[0];
}

const listEl = document.querySelector("#grocery-list");
const searchBar = document.querySelector("#search");
const tabsEl = document.querySelector("#tabs");

// Modal elements
const modal = document.querySelector("#modal");
const modalTitle = document.querySelector("#modal-title");
const modalInput = document.querySelector("#modal-input");
const modalCategory = document.querySelector("#modal-category");
const modalPriority = document.querySelector("#modal-priority");
const modalQty = document.querySelector("#modal-qty");
const modalPrice = document.querySelector("#modal-price");
const modalNotes = document.querySelector("#modal-notes");
const modalAdd = document.querySelector("#modal-add");
const modalClose = document.querySelector("#modal-close");
const suggestionsEl = document.querySelector("#suggestions");

// Progress elements
const progressCountEl = document.querySelector("#progress-count");
const progressTotalEl = document.querySelector("#progress-total");
const progressFillEl = document.querySelector("#progress-fill");

// Buttons
const themeToggleBtn = document.querySelector("#theme-toggle");
const voiceAddBtn = document.querySelector("#voice-add");
const addButton = document.querySelector("#add-button");
const clearAllBtn = document.querySelector("#clear-all");
const addListBtn = document.querySelector("#add-list");

// Confetti colors
const CONFETTI_COLORS = ["#ffcc00", "#ff6b6b", "#4ecdc4", "#ffe66d", "#ff9f1c"];

// Suggestions map
const SUGGESTIONS = {
    milk: ["🥣 Cereal", "🍪 Cookies", "☕ Coffee"],
    bread: ["🧈 Butter", "🧀 Cheese", "🍯 Honey"],
    eggs: ["🥓 Bacon", "🧂 Salt"],
    pasta: ["🍅 Tomato Sauce", "🧀 Parmesan"],
    rice: ["🍛 Curry", "🥢 Soy Sauce"]
};

function saveAll() {
    localStorage.setItem("grocery-lists", JSON.stringify(lists));
    localStorage.setItem("grocery-current-list", currentListKey);
}

function getCurrentList() {
    return lists[currentListKey];
}

function createId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ---------- TABS ----------
function renderTabs() {
    tabsEl.innerHTML = "";
    Object.entries(lists).forEach(([key, list]) => {
        const btn = document.createElement("button");
        btn.className = "tab-btn" + (key === currentListKey ? " active" : "");
        btn.textContent = list.name;
        btn.dataset.key = key;
        btn.addEventListener("click", () => {
            currentListKey = key;
            saveAll();
            renderTabs();
            renderList();
        });
        tabsEl.appendChild(btn);
    });
}

// ---------- PROGRESS ----------
function updateProgress() {
    const current = getCurrentList();
    const total = current.items.length;
    const done = current.items.filter(i => i.checked).length;

    progressCountEl.textContent = done;
    progressTotalEl.textContent = total;

    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    progressFillEl.style.width = percent + "%";

    if (total > 0 && done === total) {
        launchConfetti();
    }
}

// ---------- CONFETTI ----------
function launchConfetti() {
    const count = 60;
    for (let i = 0; i < count; i++) {
        const piece = document.createElement("div");
        piece.className = "confetti";
        piece.style.left = Math.random() * 100 + "vw";
        piece.style.backgroundColor = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        piece.style.animationDelay = (Math.random() * 0.5) + "s";
        document.body.appendChild(piece);
        setTimeout(() => piece.remove(), 2000);
    }
}

// ---------- RENDER LIST ----------
let draggedId = null;

function renderList() {
    listEl.innerHTML = "";
    const current = getCurrentList();
    let items = [...current.items];

    const searchTerm = searchBar.value.toLowerCase();
    if (searchTerm) {
        items = items.filter(item => item.text.toLowerCase().includes(searchTerm));
    }

    items.forEach(item => {
        const li = document.createElement("li");
        li.dataset.id = item.id;
        li.draggable = true;
        if (item.checked) li.classList.add("checked");
        if (item.priority === "high") li.classList.add("priority-high");
        if (item.priority === "low") li.classList.add("priority-low");

        // inner layout
        const inner = document.createElement("div");
        inner.className = "item-inner";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = item.checked;

        const textWrap = document.createElement("div");
        textWrap.className = "item-text-wrap";

        const title = document.createElement("div");
        title.className = "item-title";
        title.textContent = item.text;

        const meta = document.createElement("div");
        meta.className = "item-meta";
        const metaParts = [];
        if (item.category) metaParts.push(item.category);
        if (item.qty) metaParts.push("Qty: " + item.qty);
        if (item.price) metaParts.push("$" + Number(item.price).toFixed(2));
        if (item.notes) metaParts.push("📝 " + item.notes);
        meta.textContent = metaParts.join(" · ");

        textWrap.appendChild(title);
        textWrap.appendChild(meta);
        inner.appendChild(checkbox);
        inner.appendChild(textWrap);

        const editBtn = document.createElement("button");
        editBtn.className = "icon-btn small-icon";
        editBtn.textContent = "✏️";

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "🗑️";

        li.appendChild(inner);
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);

        // checkbox
        checkbox.addEventListener("change", () => {
            item.checked = checkbox.checked;
            saveAll();
            renderList();
        });

        // edit
        editBtn.addEventListener("click", () => {
            openModal(item);
        });

        // delete
        deleteBtn.addEventListener("click", () => {
            removeItemWithAnimation(item.id, li);
        });

        // swipe-to-delete
        let startX = null;
        li.addEventListener("touchstart", e => {
            startX = e.touches[0].clientX;
        });
        li.addEventListener("touchmove", e => {
            if (!startX) return;
            const dx = e.touches[0].clientX - startX;
            if (dx < -40) {
                li.style.transform = `translateX(${dx}px)`;
                li.style.opacity = "0.7";
            }
        });
        li.addEventListener("touchend", e => {
            const endX = e.changedTouches[0].clientX;
            if (startX && endX - startX < -80) {
                removeItemWithAnimation(item.id, li);
            } else {
                li.style.transform = "";
                li.style.opacity = "";
            }
            startX = null;
        });

        // drag/drop
        li.addEventListener("dragstart", () => {
            draggedId = item.id;
            li.classList.add("dragging");
        });

        li.addEventListener("dragend", () => {
            draggedId = null;
            li.classList.remove("dragging");
        });

        li.addEventListener("dragover", e => {
            e.preventDefault();
            const draggingEl = listEl.querySelector(".dragging");
            const siblings = [...listEl.querySelectorAll("li:not(.dragging)")];
            const next = siblings.find(sib => {
                return e.clientY <= sib.offsetTop + sib.offsetHeight / 2;
            });
            next ? listEl.insertBefore(draggingEl, next) : listEl.appendChild(draggingEl);
        });

        li.addEventListener("drop", () => {
            const newIds = [...listEl.querySelectorAll("li")].map(li => li.dataset.id);
            current.items = newIds.map(id => current.items.find(it => it.id === id));
            saveAll();
            renderList();
        });

        listEl.appendChild(li);
    });

    updateProgress();
}

function removeItemWithAnimation(id, li) {
    const current = getCurrentList();
    li.classList.add("remove");
    setTimeout(() => {
        current.items = current.items.filter(i => i.id !== id);
        saveAll();
        renderList();
    }, 250);
}

// ---------- MODAL ----------
function openModal(item = null) {
    editingItemId = item ? item.id : null;

    if (item) {
        modalTitle.textContent = "Edit Item";
        modalInput.value = item.text;
        modalCategory.value = item.category || "";
        modalPriority.value = item.priority || "normal";
        modalQty.value = item.qty || "";
        modalPrice.value = item.price || "";
        modalNotes.value = item.notes || "";
    } else {
        modalTitle.textContent = "Add New Item";
        modalInput.value = "";
        modalCategory.value = "";
        modalPriority.value = "normal";
        modalQty.value = "";
        modalPrice.value = "";
        modalNotes.value = "";
    }

    suggestionsEl.innerHTML = "";
    modal.classList.remove("hidden");
    modalInput.focus();
}

function closeModal() {
    modal.classList.add("hidden");
    editingItemId = null;
}

// suggestions
modalInput.addEventListener("input", () => {
    const val = modalInput.value.toLowerCase().trim();
    suggestionsEl.innerHTML = "";
    if (!val) return;

    const chips = [];
    Object.entries(SUGGESTIONS).forEach(([key, list]) => {
        if (val.includes(key)) list.forEach(x => chips.push(x));
    });

    chips.forEach(text => {
        const chip = document.createElement("button");
        chip.className = "suggestion-chip";
        chip.textContent = text;
        chip.addEventListener("click", () => {
            modalInput.value = text;
            suggestionsEl.innerHTML = "";
        });
        suggestionsEl.appendChild(chip);
    });
});

// save item
modalAdd.addEventListener("click", () => {
    const text = modalInput.value.trim();
    if (!text) return alert("Enter a name");

    const current = getCurrentList();
    const data = {
        text,
        category: modalCategory.value,
        priority: modalPriority.value,
        qty: modalQty.value ? Number(modalQty.value) : "",
        price: modalPrice.value ? Number(modalPrice.value) : "",
        notes: modalNotes.value.trim()
    };

    if (editingItemId) {
        Object.assign(current.items.find(i => i.id === editingItemId), data);
    } else {
        current.items.push({
            id: createId(),
            checked: false,
            ...data
        });
    }

    saveAll();
    closeModal();
    renderList();
});

modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

// ---------- THEME TOGGLE (Animated Moon → Sun) ----------

// Add overlay animation
function themeTransitionEffect() {
    const overlay = document.createElement("div");
    overlay.className = "theme-transition-overlay";
    document.body.appendChild(overlay);

    requestAnimationFrame(() => overlay.style.opacity = 1);

    setTimeout(() => {
        overlay.style.opacity = 0;
        setTimeout(() => overlay.remove(), 600);
    }, 400);
}

themeToggleBtn.addEventListener("click", () => {
    themeTransitionEffect();
    document.body.classList.toggle("dark");
});

// ---------- LIST MANAGEMENT ----------
addListBtn.addEventListener("click", () => {
    const name = prompt("New list name:");
    if (!name) return;
    const key = name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now().toString(36);
    lists[key] = { name, items: [] };
    currentListKey = key;
    saveAll();
    renderTabs();
    renderList();
});

addButton.addEventListener("click", () => openModal());

// clear all
clearAllBtn.addEventListener("click", () => {
    const current = getCurrentList();
    if (!current.items.length) return;
    if (confirm("Clear all?")) {
        current.items = [];
        saveAll();
        renderList();
    }
});

// search
searchBar.addEventListener("input", renderList);

// ---------- VOICE INPUT ----------
voiceAddBtn.addEventListener("click", () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Voice not supported.");

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.start();

    rec.onresult = e => {
        const transcript = e.results[0][0].transcript;
        openModal();
        modalInput.value = transcript;
    };
});


// DELETE LIST — no modal, instant action
const deleteListBtn = document.querySelector("#delete-list");

deleteListBtn.addEventListener("click", () => {
    const keys = Object.keys(lists);

    // Prevent deleting the last list
    if (keys.length <= 1) {
        alert("You cannot delete your only list.");
        return;
    }

    // Delete the current list
    delete lists[currentListKey];

    // Switch to the first list remaining
    currentListKey = Object.keys(lists)[0];

    saveAll();
    renderTabs();
    renderList();
});



// ---------- INIT ----------
renderTabs();
renderList();
