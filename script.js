let items = JSON.parse(localStorage.getItem("grocery-items")) || [];

const list = document.querySelector("#grocery-list");
const searchBar = document.querySelector("#search");

// Modal elements
const modal = document.querySelector("#modal");
const modalInput = document.querySelector("#modal-input");
const modalAdd = document.querySelector("#modal-add");
const modalClose = document.querySelector("#modal-close");

// THEME TOGGLE
document.querySelector("#theme-toggle").addEventListener("click", () => {
    document.body.classList.toggle("dark");
});

// SAVE TO STORAGE
function save() {
    localStorage.setItem("grocery-items", JSON.stringify(items));
}

// RENDER LIST
function renderList() {
    list.innerHTML = "";

    items.forEach(item => {
        const li = document.createElement("li");
        li.classList.toggle("checked", item.checked);

        li.innerHTML = `
            <input type="checkbox" ${item.checked ? "checked" : ""}>
            <label>${item.text}</label>
            <span class="delete-btn">🗑️</span>
        `;

        // checkbox toggle
        li.querySelector("input").addEventListener("change", () => {
            item.checked = !item.checked;
            save();
            renderList();
        });

        // delete button
        li.querySelector(".delete-btn").addEventListener("click", () => {
            li.classList.add("remove");
            setTimeout(() => {
                items = items.filter(i => i !== item);
                save();
                renderList();
            }, 250);
        });

        list.appendChild(li);
    });
}

// OPEN MODAL
document.querySelector("#add-button").addEventListener("click", () => {
    modal.classList.remove("hidden");
    modalInput.value = "";
    modalInput.focus();
});

// ADD ITEM
modalAdd.addEventListener("click", () => {
    const text = modalInput.value.trim();
    if (text) {
        items.push({ text, checked: false });
        save();
        renderList();
    }
    modal.classList.add("hidden");
});

// CLOSE MODAL
modalClose.addEventListener("click", () => {
    modal.classList.add("hidden");
});

// CLEAR ALL
document.querySelector("#clear-all").addEventListener("click", () => {
    if (confirm("Clear ALL items?")) {
        items = [];
        save();
        renderList();
    }
});

// SEARCH FILTER
searchBar.addEventListener("input", () => {
    const term = searchBar.value.toLowerCase();
    document.querySelectorAll("li").forEach(li => {
        const text = li.querySelector("label").innerText.toLowerCase();
        li.style.display = text.includes(term) ? "flex" : "none";
    });
});

// INITIAL RENDER
renderList();
