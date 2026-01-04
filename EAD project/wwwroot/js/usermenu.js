/* =========================================================
   CONSTANTS & CONFIGURATION
========================================================= */
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEALS = ['Lunch', 'Dinner'];

const COMPULSORY_ITEMS = [
    { dishName: 'Tea', price: 30 },
    { dishName: 'Water', price: 20 }
];

/* =========================================================
   DATA PROCESSING
========================================================= */
const rawDbMenu = (typeof menu !== 'undefined' && menu !== null) ? menu : [];

const menuData = {};
DAYS.forEach(day => {
    menuData[day] = { Lunch: [], Dinner: [] };
});

rawDbMenu.forEach(item => {
    const day = item.dayOfWeek || item.DayOfWeek;
    const meal = item.mealType || item.MealType;
    const name = item.dishName || item.DishName;
    const price = item.price || item.Price;
    const isMandatory = item.isMandatory || item.IsMandatory || false;

    if (menuData[day] && menuData[day][meal]) {
        menuData[day][meal].push({
            dishName: name,
            price: parseFloat(price),
            isMandatory: isMandatory
        });
    }
});

/* =========================================================
   HELPER FUNCTIONS
========================================================= */
function getDayKey(day) {
    return day.toLowerCase();
}

function ensureCompulsoryItems(day, meal) {
    if (!menuData[day]) menuData[day] = { Lunch: [], Dinner: [] };
    if (!menuData[day][meal]) menuData[day][meal] = [];

    COMPULSORY_ITEMS.forEach(ci => {
        const exists = menuData[day][meal].some(i =>
            i.dishName.toLowerCase() === ci.dishName.toLowerCase()
        );

        if (!exists) {
            menuData[day][meal].push({
                dishName: ci.dishName,
                price: ci.price,
                isMandatory: true
            });
        } else {
            const item = menuData[day][meal].find(i => i.dishName.toLowerCase() === ci.dishName.toLowerCase());
            if (item) item.isMandatory = true;
        }
    });
}

/* =========================================================
   RENDERING LOGIC
========================================================= */
function renderMeal(day, meal) {
    ensureCompulsoryItems(day, meal);

    const key = getDayKey(day);
    const mealLower = meal.toLowerCase();
    const tbody = document.getElementById(`${key}-${mealLower}`);
    const totalEl = document.getElementById(`${key}-${mealLower}-total`);

    if (!tbody || !totalEl) return { total: 0, compulsory: 0 };

    tbody.innerHTML = '';
    let total = 0;
    let compulsoryTotal = 0;

    menuData[day][meal].forEach(item => {
        total += item.price;
        if (item.isMandatory) compulsoryTotal += item.price;

        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td>
                    ${item.dishName}
                    ${item.isMandatory ? '<span class="badge bg-warning text-dark ms-2" style="font-size:0.7em">Compulsory</span>' : ''}
                </td>
                <td>Rs. ${item.price}</td>
            </tr>
        `);
    });

    totalEl.innerHTML = `Rs. ${total}`;
    return { total, compulsoryTotal };
}

function renderDay(day) {
    let dayTotal = 0;
    MEALS.forEach(meal => {
        const result = renderMeal(day, meal);
        dayTotal += result.total;
    });

    const totalId = `${getDayKey(day)}-total`;
    const dayTotalEl = document.getElementById(totalId);
    if (dayTotalEl) dayTotalEl.innerText = `Rs. ${dayTotal}`;
}

function updateWeeklySummary() {
    let weeklyTotal = 0;
    let itemCount = 0;

    DAYS.forEach(day => {
        MEALS.forEach(meal => {
            if (menuData[day] && menuData[day][meal]) {
                menuData[day][meal].forEach(item => {
                    weeklyTotal += item.price;
                    itemCount++;
                });
            }
        });
    });

    const weeklyTotalEl = document.getElementById('weeklyTotal');
    const totalItemsEl = document.getElementById('totalItems');
    const avgDailyEl = document.getElementById('avgDaily');

    if (weeklyTotalEl) weeklyTotalEl.innerText = `Rs. ${weeklyTotal}`;
    if (totalItemsEl) totalItemsEl.innerText = itemCount;
    if (avgDailyEl) avgDailyEl.innerText = `Rs. ${Math.round(weeklyTotal / 7)}`;
}

function highlightToday() {
    const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = names[new Date().getDay()];
    const key = getDayKey(today);

    // Update Banner
    const todayDayEl = document.getElementById('todayDay');
    const todayDateEl = document.getElementById('todayDate');
    if (todayDayEl) todayDayEl.innerText = today;
    if (todayDateEl) todayDateEl.innerText = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Highlight Card
    document.querySelectorAll('.menu-card').forEach(c => c.classList.remove('today'));
    document.querySelectorAll('.today-badge-card').forEach(b => b.remove());

    const todayCard = document.querySelector(`.menu-card[data-day="${key}"]`);
    if (todayCard) {
        todayCard.classList.add('today');
        const cardHeader = todayCard.querySelector('.menu-card-header .day-info');
        if (cardHeader) {
            const badge = document.createElement('span');
            badge.className = 'badge bg-success ms-2 today-badge-card';
            badge.style.fontSize = '0.7em';
            badge.innerText = 'Today';
            cardHeader.appendChild(badge);
        }
    }
}

/* =========================================================
   INITIALIZATION (FIXED LOGIC)
========================================================= */
//document.addEventListener('DOMContentLoaded', () => {
//    // 1. Data Rendering
//    DAYS.forEach(renderDay);
//    updateWeeklySummary();
//    highlightToday();

//    // 2. Responsive Sidebar Logic
//    const sidebarToggle = document.getElementById('sidebarToggle');
//    const sidebar = document.querySelector('.sidebar');
//    const overlay = document.getElementById('sidebarOverlay');

//    // Function to Close Sidebar
//    const closeSidebar = (e) => {
//        // Prevent ghost clicks on touch devices
//        if (e && e.type === 'touchstart') {
//            e.preventDefault();
//        }

//        sidebar.classList.remove('show');
//        overlay.classList.remove('show');
//    };

//    // Function to Open/Toggle Sidebar
//    const toggleSidebar = (e) => {
//        e.preventDefault();
//        e.stopPropagation();
//        sidebar.classList.toggle('show');
//        overlay.classList.toggle('show');
//    };

//    // 3. Attach Event Listeners
//    if (sidebarToggle) {
//        sidebarToggle.addEventListener('click', toggleSidebar);
//    }

//    if (overlay) {
//        // Use 'click' for desktop
//        overlay.addEventListener('click', closeSidebar);
//        // Use 'touchstart' for immediate mobile response
//        overlay.addEventListener('touchstart', closeSidebar, { passive: false });
//    }

//    // Auto-close when switching to Desktop view
//    window.addEventListener('resize', () => {
//        if (window.innerWidth > 991.98) {
//            closeSidebar();
//        }
//    });
//});
/* =========================================================
   INITIALIZATION
========================================================= */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Data Rendering
    DAYS.forEach(renderDay);
    updateWeeklySummary();
    highlightToday();

    // 2. Responsive Sidebar Logic
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    // Function to Close Sidebar
    const closeSidebar = (e) => {
        if (e && e.type === 'touchstart') e.preventDefault();
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
    };

    // Function to Toggle Sidebar
    const toggleSidebar = (e) => {
        e.preventDefault();
        e.stopPropagation();
        sidebar.classList.toggle('show');
        overlay.classList.toggle('show');
    };

    // --- CRITICAL FIX: Stop clicks inside sidebar from closing it ---
    if (sidebar) {
        sidebar.addEventListener('click', (e) => {
            e.stopPropagation(); // This prevents the click from reaching the overlay logic
        });

        // Also prevent touch events inside sidebar from bubbling
        sidebar.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        }, { passive: true });
    }
    // ---------------------------------------------------------------

    // 3. Attach Event Listeners
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
        overlay.addEventListener('touchstart', closeSidebar, { passive: false });
    }

    // Auto-close when switching to Desktop view
    window.addEventListener('resize', () => {
        if (window.innerWidth > 991.98) {
            closeSidebar();
        }
    });
});