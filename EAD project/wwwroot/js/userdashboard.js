// ==========================================
// User Dashboard JavaScript - Linked with C#
// ==========================================

// Global Configuration
const TEA_WATER_PRICE = 50; // Rs. 50 per Meal

document.addEventListener('DOMContentLoaded', function () {
    // Safety check
    if (typeof currentUser === 'undefined') {
        console.warn("User Data not loaded from Server.");
    }

    initializeDashboard();
    setupSidebarToggle();
});

function initializeDashboard() {
    displayCurrentDate();
    displayUserName();
    loadTodaysMenu();
    loadRecentBills();
    loadWeekAttendance();
}

// Helper to safely check boolean from DB (Handles true, "true", 1)
function isTrue(val) {
    return val === true || val === "true" || val === 1;
}

// 1. Display current date
function displayCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const today = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = today.toLocaleDateString('en-US', options);
    }
}

// 2. Display Username
function displayUserName() {
    const userNameElements = document.querySelectorAll('#userName, #userNameBanner');
    if (typeof currentUser === 'undefined') return;

    let rawName = currentUser.username || currentUser.name || "User";
    if (rawName.includes('@')) {
        rawName = rawName.split('@')[0];
    }
    rawName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    userNameElements.forEach(element => {
        element.textContent = rawName;
    });
}

// 3. Load Statistics (FIXED LOGIC)
//function () {
//    let totalAttendanceDays = 0;
//    let totalMeals = 0;
//    let currentMonthBill = 0;

//    const now = new Date();
//    const currentMonthIdx = now.getMonth(); // 0-11
//    const currentYear = now.getFullYear();

//    // Set to store unique days (removes duplicates if lunch & dinner on same day)
//    const uniquePresentDays = new Set();

//    if (typeof attendances !== 'undefined' && attendances !== null) {
//        attendances.forEach(record => {
//            // Safe Property Access
//            const dateStr = record.attendanceDate || record.AttendanceDate;
//            const isFood = isTrue(record.food || record.Food);
//            const isTea = isTrue(record.teaWater || record.TeaWater);
//            const price = record.foodPrice || record.FoodPrice || 0;

//            if (!dateStr) return;

//            const recDate = new Date(dateStr);

//            // Filter: Match Current Month and Year
//            if (recDate.getMonth() === currentMonthIdx && recDate.getFullYear() === currentYear) {

//                // --- BILL CALCULATION ---
//                // 1. Add Food Price
//                currentMonthBill += price;

//                // 2. Add Tea/Water Price (Add for EVERY instance)
//                if (isTea) {
//                    currentMonthBill += TEA_WATER_PRICE;
//                }

//                // --- COUNTS ---
//                if (isFood) {
//                    totalMeals++;
//                }

//                // --- ATTENDANCE TRACKING ---
//                // If they took Food OR Tea, mark this DATE as present
//                if (isFood || isTea) {
//                    // Use ISO string YYYY-MM-DD to handle unique days correctly
//                    const dateKey = dateStr.split('T')[0];
//                    uniquePresentDays.add(dateKey);
//                }
//            }
//        });
//    }

//    // Total unique days user visited the mess
//    totalAttendanceDays = uniquePresentDays.size;

//    // --- PERCENTAGE CALCULATION ---
//    // Option A: (Days Present / Days Passed in Month) -> Shows "Consistency"
//    // Option B: (Days Present / Total Days in Month) -> Shows "Monthly Utilization"

//    // We use Option B (Total Days in Month) to avoid "100%" on Day 1
//    const totalDaysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();

//    let attendanceRate = 0;
//    if (totalDaysInMonth > 0) {
//        attendanceRate = Math.round((totalAttendanceDays / totalDaysInMonth) * 100);
//    }

//    // Update UI Elements
//    const elTotalAtt = document.getElementById('totalAttendance');
//    if (elTotalAtt) elTotalAtt.textContent = totalAttendanceDays;

//    const elMealCount = document.getElementById('mealCount');
//    if (elMealCount) elMealCount.textContent = totalMeals;

//    const elAttRate = document.getElementById('attendanceRate');
//    if (elAttRate) elAttRate.textContent = `${attendanceRate}%`;

//    const elCurBill = document.getElementById('currentBill');
//    if (elCurBill) elCurBill.textContent = `Rs. ${parseFloat(currentMonthBill).toLocaleString()}`;
//}

// 4. Load Today's Menu
function loadTodaysMenu() {
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

    const elTodayDay = document.getElementById('todayDay');
    if (elTodayDay) elTodayDay.textContent = dayName;

    if (typeof menu === 'undefined') return;

    const todaysItems = menu.filter(m => (m.dayOfWeek || m.DayOfWeek) === dayName);
    const lunchItems = todaysItems.filter(m => (m.mealType || m.MealType) === 'Lunch');
    const dinnerItems = todaysItems.filter(m => (m.mealType || m.MealType) === 'Dinner');

    const renderList = (items, elementId, priceId) => {
        const ul = document.getElementById(elementId);
        const priceEl = document.getElementById(priceId);

        if (ul) {
            ul.style.listStyle = 'none';
            ul.style.paddingLeft = '0';

            if (items.length > 0) {
                ul.innerHTML = items.map(item => {
                    const name = item.dishName || item.DishName;
                    const price = item.price || item.Price || 0;
                    return `
                    <li style="display: flex; width: 100%; justify-content: space-between; align-items: center; margin-bottom: 6px; border-bottom: 1px dashed #eee; padding-bottom: 6px;">
                        <span style="text-align: left; flex-grow: 1;">${name}</span>
                        <span style="color: #198754; font-weight: 600; white-space: nowrap;">Rs. ${price}</span>
                    </li>`;
                }).join('');

                const totalPrice = items.reduce((sum, item) => sum + (item.price || item.Price || 0), 0);
                if (priceEl) priceEl.textContent = `Rs. ${totalPrice}`;
                return totalPrice;
            } else {
                ul.innerHTML = '<li class="text-muted" style="text-align:left;">No items served</li>';
                if (priceEl) priceEl.textContent = 'Rs. 0';
                return 0;
            }
        }
        return 0;
    };

    const lunchTotal = renderList(lunchItems, 'lunchItems', 'lunchPrice');
    const dinnerTotal = renderList(dinnerItems, 'dinnerItems', 'dinnerPrice');

    const elTotal = document.getElementById('todayTotal');
    if (elTotal) elTotal.textContent = `Rs. ${lunchTotal + dinnerTotal}`;
}

// 5. Load Recent Bills
function loadRecentBills() {
    const billListElement = document.getElementById('recentBills');
    if (!billListElement) return;

    if (typeof bill === 'undefined' || !bill || bill.length === 0) {
        billListElement.innerHTML = '<p class="text-muted">No bills generated yet</p>';
        return;
    }

    const sortedBills = [...bill].sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
    });

    const getMonthName = (monthNum) => {
        const date = new Date();
        date.setMonth(monthNum - 1);
        return date.toLocaleString('en-US', { month: 'long' });
    };

    const billsHTML = sortedBills.slice(0, 3).map(b => {
        const statusClass = b.isPaid ? 'paid' : 'unpaid';
        const statusText = b.isPaid ? 'PAID' : 'UNPAID';
        const monthName = getMonthName(b.month);

        return `
        <div class="bill-item">
            <div class="bill-info">
                <div class="bill-month">${monthName} ${b.year}</div>
            </div>
            <div class="bill-amount">Rs. ${b.grandTotal}</div>
            <span class="bill-status ${statusClass}">${statusText}</span>
        </div>
    `;
    }).join('');

    billListElement.innerHTML = billsHTML;
}

// 6. Load Week Attendance
function loadWeekAttendance() {
    const weekAttendanceElement = document.getElementById('weekAttendance');
    if (!weekAttendanceElement) return;
    if (typeof attendances === 'undefined' || attendances === null) return;

    const daysToShow = 7;
    let attendanceHTML = '';
    const today = new Date();

    for (let i = daysToShow - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);

        const dateString = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNumber = d.getDate();

        // Check if ANY record exists for this specific date
        const hasRecord = attendances.some(a => {
            const aDate = a.attendanceDate || a.AttendanceDate;
            const hasFood = isTrue(a.food || a.Food);
            const hasTea = isTrue(a.teaWater || a.TeaWater);

            // Match Date AND ensure they were actually present (Food or Tea)
            return aDate && aDate.startsWith(dateString) && (hasFood || hasTea);
        });

        let statusClass = 'pending';
        let icon = '<i class="bi bi-dash-circle"></i>';

        if (hasRecord) {
            statusClass = 'present';
            icon = '<i class="bi bi-check-circle-fill"></i>';
        } else {
            const dateNoTime = new Date(d).setHours(0, 0, 0, 0);
            const todayNoTime = new Date().setHours(0, 0, 0, 0);

            if (dateNoTime < todayNoTime) {
                statusClass = 'absent';
                icon = '<i class="bi bi-x-circle-fill"></i>';
            }
        }

        attendanceHTML += `
            <div class="attendance-day ${statusClass}">
                <div class="attendance-day-name">${dayName}</div>
                <div class="attendance-day-icon">${icon}</div>
                <div class="attendance-day-date">${dayNumber}</div>
            </div>
        `;
    }

    weekAttendanceElement.innerHTML = attendanceHTML;
}

// Sidebar Logic
function setupSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');

    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            sidebar.classList.toggle('show');
            overlay.classList.toggle('show');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', function () {
            sidebar.classList.remove('show');
            overlay.classList.remove('show');
        });
    }

    window.addEventListener('resize', () => {
        if (window.innerWidth > 767.98) {
            sidebar.classList.remove('show');
            overlay.classList.remove('show');
        }
    });
}

function viewCurrentBill() {
    const billsSection = document.getElementById('recentBills');
    if (billsSection) billsSection.scrollIntoView({ behavior: 'smooth' });
}

function viewAttendance() {
    window.location.href = '/Userattendance/user_attendance';
}

function raiseDispute() {
    alert('Dispute feature coming soon!');
}

function viewProfile() {
    if (typeof currentUser !== 'undefined') {
        alert(`Profile: ${currentUser.name}`);
    }
}

// Auto-refresh stats every 5 minutes
setInterval(function () {
    loadTodaysMenu();
}, 300000);