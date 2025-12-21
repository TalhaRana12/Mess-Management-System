/* =========================================================
   CONSTANTS & CONFIGURATION
========================================================= */
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEALS = ['Lunch', 'Dinner'];

const COMPULSORY_ITEMS = [
    { dishName: 'Tea', price: 20 },
    { dishName: 'Water', price: 10 }
];

/* =========================================================
   DATA PROCESSING (Convert DB List to Nested Object)
========================================================= */

// 1. Get the raw data from the Razor variable defined in your View
// We use a safety check in case 'menu' is undefined to prevent errors
const rawDbMenu = (typeof menu !== 'undefined' && menu !== null) ? menu : [];

// 2. Initialize the structure the rest of the code expects
const menuData = {};

// Initialize empty arrays for every day/meal
DAYS.forEach(day => {
    menuData[day] = {
        Lunch: [],
        Dinner: []
    };
});

// 3. Populate menuData from the Database List
rawDbMenu.forEach(item => {
    // Handle property casing (C# might send PascalCase or camelCase)
    const day = item.dayOfWeek || item.DayOfWeek;
    const meal = item.mealType || item.MealType;
    const name = item.dishName || item.DishName;
    const price = item.price || item.Price;

    // Check if the mandatory flag exists in DB, otherwise default to false
    // (Compulsory items like Tea are also handled by helper function later)
    const isMandatory = item.isMandatory || item.IsMandatory || false;

    // Push to the correct bucket if valid
    if (menuData[day] && menuData[day][meal]) {
        menuData[day][meal].push({
            dishName: name,
            price: parseFloat(price), // Ensure it's a number
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

/**
 * Ensures Tea and Water are present in the data for the specific day/meal.
 * Marks them as mandatory.
 */
function ensureCompulsoryItems(day, meal) {
    // Safety check if data is missing
    if (!menuData[day]) menuData[day] = { Lunch: [], Dinner: [] };
    if (!menuData[day][meal]) menuData[day][meal] = [];

    COMPULSORY_ITEMS.forEach(ci => {
        // Check if item exists (case-insensitive)
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
            // Ensure existing compulsory items (if came from DB) are marked properly
            const item = menuData[day][meal].find(i => i.dishName.toLowerCase() === ci.dishName.toLowerCase());
            if (item) item.isMandatory = true;
        }
    });
}

/* =========================================================
   RENDERING LOGIC
========================================================= */

function renderMeal(day, meal) {
    // 1. Ensure compulsory items exist in data
    ensureCompulsoryItems(day, meal);

    const key = getDayKey(day);
    const mealLower = meal.toLowerCase();

    // 2. Get DOM elements
    const tbody = document.getElementById(`${key}-${mealLower}`);
    const totalEl = document.getElementById(`${key}-${mealLower}-total`);

    if (!tbody || !totalEl) return { total: 0, compulsory: 0 };

    tbody.innerHTML = '';

    let total = 0;
    let compulsoryTotal = 0;

    // 3. Loop through items and generate HTML
    menuData[day][meal].forEach(item => {
        total += item.price;
        if (item.isMandatory) compulsoryTotal += item.price;

        tbody.insertAdjacentHTML('beforeend', `
            <tr class="${item.isMandatory ? 'mandatory-item' : ''}">
                <td>
                    ${item.dishName}
                    ${item.isMandatory ? '<span class="badge bg-warning text-dark ms-2">Compulsory</span>' : ''}
                </td>
                <td>Rs. ${item.price}</td>
            </tr>
        `);
    });

    // 4. Update Meal Total
    totalEl.innerHTML = `Rs. ${total} <small class="text-muted">(Compulsory: Rs. ${compulsoryTotal})</small>`;

    return { total, compulsoryTotal };
}

function renderDay(day) {
    let dayTotal = 0;
    let dayCompulsory = 0;

    // Render both meals
    MEALS.forEach(meal => {
        const result = renderMeal(day, meal);
        dayTotal += result.total;
        dayCompulsory += result.compulsoryTotal;
    });

    // Update Day Total
    const totalId = `${getDayKey(day)}-total`;
    const dayTotalEl = document.getElementById(totalId);

    if (dayTotalEl) {
        dayTotalEl.innerText = `Rs. ${dayTotal}`;
    }
}

function updateWeeklySummary() {
    let weeklyTotal = 0;
    let compulsoryTotal = 0;
    let itemCount = 0;

    DAYS.forEach(day => {
        MEALS.forEach(meal => {
            if (menuData[day] && menuData[day][meal]) {
                menuData[day][meal].forEach(item => {
                    weeklyTotal += item.price;
                    itemCount++;
                    if (item.isMandatory) compulsoryTotal += item.price;
                });
            }
        });
    });

    const weeklyTotalEl = document.getElementById('weeklyTotal');
    const totalItemsEl = document.getElementById('totalItems');
    const avgDailyEl = document.getElementById('avgDaily');

    if (weeklyTotalEl) {
        weeklyTotalEl.innerHTML = `Rs. ${weeklyTotal} <small class="d-block text-muted">(Compulsory: Rs. ${compulsoryTotal})</small>`;
    }
    if (totalItemsEl) {
        totalItemsEl.innerText = itemCount;
    }
    if (avgDailyEl) {
        avgDailyEl.innerText = `Rs. ${Math.round(weeklyTotal / 7)}`;
    }
}

//function highlightToday() {
//    const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
//    const today = names[new Date().getDay()];
//    const key = getDayKey(today);

//    // Update Banner
//    const todayDayEl = document.getElementById('todayDay');
//    const todayDateEl = document.getElementById('todayDate');

//    if (todayDayEl) todayDayEl.innerText = today;
//    if (todayDateEl) todayDateEl.innerText = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

//    // Highlight Card
//    document.querySelectorAll('.menu-card').forEach(c => c.classList.remove('today'));
//    document.querySelector(`.menu-card[data-day="${key}"]`)?.classList.add('today');
//}
function highlightToday() {
    const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = names[new Date().getDay()];
    const key = getDayKey(today);

    // 1. Update Top Banner (Existing Logic)
    const todayDayEl = document.getElementById('todayDay');
    const todayDateEl = document.getElementById('todayDate');

    if (todayDayEl) todayDayEl.innerText = today;
    if (todayDateEl) todayDateEl.innerText = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // 2. Reset Previous Highlights
    // Remove the 'today' class from all cards
    document.querySelectorAll('.menu-card').forEach(c => c.classList.remove('today'));

    // Remove any existing "Today" badges to prevent duplicates
    document.querySelectorAll('.today-badge').forEach(b => b.remove());

    // 3. Highlight Today's Card
    const todayCard = document.querySelector(`.menu-card[data-day="${key}"]`);

    if (todayCard) {
        // Add border/shadow styling
        todayCard.classList.add('today');

        // Find the header (Assuming your HTML has a .card-header containing an h5 or similar)
        const cardHeader = todayCard.querySelector('.card-header h5') || todayCard.querySelector('.card-header');

        if (cardHeader) {
            // Create the Badge Element
            const badge = document.createElement('span');
            badge.className = 'badge bg-success ms-2 today-badge'; // Bootstrap classes
            badge.style.fontSize = '0.7em';
            badge.style.verticalAlign = 'middle';
            badge.innerText = 'Today';

            // Append it next to the Day Name
            cardHeader.appendChild(badge);
        }
    }
}
/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Render cards for all days
    DAYS.forEach(renderDay);

    // 2. Calculate totals
    updateWeeklySummary();

    // 3. Highlight current day
    highlightToday();

    // 4. Sidebar toggle (if exists)
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('show');
    });
});