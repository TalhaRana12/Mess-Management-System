const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const COMPULSORY_ITEMS = [
    { dishName: 'Tea', price: 50 },
    { dishName: 'Water', price: 0 }
];


function getDayKey(day) {
    return day.toLowerCase();
}

function isCompulsoryItem(name) {
    return COMPULSORY_ITEMS.some(
        c => c.dishName.toLowerCase() === name.toLowerCase()
    );
}



function createEmptyWeek() {
    const week = {};
    DAYS.forEach(d => week[d] = { Lunch: [], Dinner: [] });
    return week;
}

const menuData = (groupedMenuData || []).reduce((acc, item) => {
    acc[item.dayOfWeek] ??= { Lunch: [], Dinner: [] };

    acc[item.dayOfWeek][item.mealType].push({
        menuId: item.menuId ?? null,
        dayOfWeek: item.dayOfWeek,
        mealType: item.mealType,
        dishName: item.dishName,
        price: Number(item.price),
        isMandatory: item.isMandatory
    });

    return acc;
}, createEmptyWeek());


function ensureCompulsoryItems(items, day, meal) {
    COMPULSORY_ITEMS.forEach(c => {
        if (!items.some(i => i.dishName.toLowerCase() === c.dishName.toLowerCase())) {
            items.push({
                menuId: null,
                dayOfWeek: day,
                mealType: meal,
                dishName: c.dishName,
                price: c.price,
                isMandatory: true
            });
        }
    });
    return items;
}

DAYS.forEach(day => {
    menuData[day].Lunch = ensureCompulsoryItems(menuData[day].Lunch, day, 'Lunch');
    menuData[day].Dinner = ensureCompulsoryItems(menuData[day].Dinner, day, 'Dinner');
});



document.addEventListener('DOMContentLoaded', () => {
    DAYS.forEach(updateMenuCard);
    updateWeeklySummary();
    highlightToday();
});


function updateMenuCard(day) {
    renderMeal(day, 'Lunch');
    renderMeal(day, 'Dinner');
    updateDayTotal(day);
}

function renderMeal(day, meal) {
    const key = getDayKey(day);
    const body = document.getElementById(`${key}-${meal.toLowerCase()}`);
    const totalEl = document.getElementById(`${key}-${meal.toLowerCase()}-total`);

    let total = 0, mandatory = 0;
    body.innerHTML = '';

    menuData[day][meal].forEach(i => {
        total += i.price;
        if (i.isMandatory) mandatory += i.price;

        body.insertAdjacentHTML('beforeend', `
            <tr class="${i.isMandatory ? 'mandatory-item' : ''}">
                <td>${i.dishName}
                    ${i.isMandatory ? '<span class="badge bg-warning text-dark ms-2">Compulsory</span>' : ''}
                </td>
                <td>Rs. ${i.price}</td>
            </tr>
        `);
    });

    totalEl.innerHTML = `Rs. ${total} <small class="text-muted">(Compulsory: Rs. ${mandatory})</small>`;
}

function updateDayTotal(day) {
    const key = getDayKey(day);
    const lunch = menuData[day].Lunch.reduce((s, i) => s + i.price, 0);
    const dinner = menuData[day].Dinner.reduce((s, i) => s + i.price, 0);
    document.getElementById(`${key}-total`).innerText = `Rs. ${lunch + dinner}`;
}


function updateWeeklySummary() {
    let total = 0, mandatory = 0, count = 0;

    DAYS.forEach(d => {
        ['Lunch', 'Dinner'].forEach(m => {
            menuData[d][m].forEach(i => {
                total += i.price;
                count++;
                if (i.isMandatory) mandatory += i.price;
            });
        });
    });

    document.getElementById('weeklyTotal').innerHTML =
        `Rs. ${total} <small class="d-block text-muted">(Compulsory: Rs. ${mandatory})</small>`;

    document.getElementById('totalItems').innerText = count;
    document.getElementById('avgDaily').innerText = `Rs. ${Math.round(total / 7)}`;
}



function highlightToday() {
    const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = names[new Date().getDay()];
    const key = getDayKey(today);

    document.getElementById('todayDay').innerText = today;
    document.getElementById('todayDate').innerText =
        new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    document.querySelectorAll('.menu-card').forEach(c => c.classList.remove('today'));
    document.querySelector(`.menu-card[data-day="${key}"]`)?.classList.add('today');
}



let currentEditDay = null;
const editMenuModal = new bootstrap.Modal(document.getElementById('editMenuModal'));

function editDayMenu(day) {
    currentEditDay = day.charAt(0).toUpperCase() + day.slice(1);
    document.getElementById('editDayName').innerText = currentEditDay;

    ['lunch', 'dinner'].forEach(meal => {
        const container = document.getElementById(`${meal}ItemsContainer`);
        container.innerHTML = '';

        menuData[currentEditDay][meal === 'lunch' ? 'Lunch' : 'Dinner']
            .forEach(i => container.appendChild(createMenuItemRow(i)));
    });

    editMenuModal.show();
}

function createMenuItemRow(item) {
    const compulsory = isCompulsoryItem(item.dishName);

    const row = document.createElement('div');
    row.className = 'menu-item-row';
    row.innerHTML = `
        <input type="text" name="dishName" value="${item.dishName}" ${compulsory ? 'readonly' : ''}>
        <input type="number" name="price" value="${item.price}" ${compulsory ? 'readonly' : ''}>
        ${!compulsory ? `
        <button class="btn-remove-item" onclick="removeMenuItem(this)">
            <i class="bi bi-trash-fill"></i>
        </button>` : ''}
    `;
    return row;
}

function addMenuItem(meal) {
    document.getElementById(`${meal}ItemsContainer`)
        .appendChild(createMenuItemRow({ dishName: '', price: 0 }));
}

function removeMenuItem(btn) {
    btn.closest('.menu-item-row').remove();
}

/* =========================================================
   SAVE MENU → DATABASE
========================================================= */

async function saveMenuToDatabase(payload) {
    const response = await fetch('/Menu/SaveMenu_api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg);
    }
}

document.getElementById('saveMenuBtn').addEventListener('click', async () => {
    if (!currentEditDay) return;

    const payload = [];

    ['lunch', 'dinner'].forEach(meal => {
        document.querySelectorAll(`#${meal}ItemsContainer .menu-item-row`)
            .forEach(row => {
                const dish = row.querySelector('[name="dishName"]').value.trim();
                const price = parseFloat(row.querySelector('[name="price"]').value) || 0;

                if (dish) {
                    payload.push({
                        dayOfWeek: currentEditDay,
                        mealType: meal === 'lunch' ? 'Lunch' : 'Dinner',
                        dishName: dish,
                        price: price,
                        isMandatory: isCompulsoryItem(dish)
                    });
                }
            });
    });

    try {
        await saveMenuToDatabase(payload);

        menuData[currentEditDay].Lunch =
            ensureCompulsoryItems(payload.filter(p => p.mealType === 'Lunch'), currentEditDay, 'Lunch');

        menuData[currentEditDay].Dinner =
            ensureCompulsoryItems(payload.filter(p => p.mealType === 'Dinner'), currentEditDay, 'Dinner');

        updateMenuCard(currentEditDay);
        updateWeeklySummary();
        editMenuModal.hide();
    }
    catch (err) {
        alert(err.message);
    }
});



document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('show');
});
// Sidebar Toggle for Mobile
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.querySelector('.sidebar');

// Create overlay element
const overlay = document.createElement('div');
overlay.className = 'sidebar-overlay';
document.body.appendChild(overlay);

if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('show');
        overlay.classList.toggle('show');
    });
}

// Close sidebar when clicking overlay
overlay.addEventListener('click', () => {
    sidebar.classList.remove('show');
    overlay.classList.remove('show');
});

// Close sidebar when window is resized to desktop
window.addEventListener('resize', () => {
    if (window.innerWidth > 767.98) {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
    }
});