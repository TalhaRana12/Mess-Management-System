// ==========================================
// User Dashboard JavaScript - Linked with C#
// ==========================================

document.addEventListener('DOMContentLoaded', function () {
    // Safety check to ensure data is loaded
    if (typeof currentUser === 'undefined') {
        console.error("Data not loaded from Server");
        return;
    }

    initializeDashboard();
    setupSidebarToggle();
});

function initializeDashboard() {
    displayCurrentDate();
    displayUserName();
    loadStatistics();
    loadTodaysMenu();
    loadRecentBills();
    loadWeekAttendance();
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

    // Get username from model
    let rawName = currentUser.username || currentUser.name || "User";

    // Logic: If it contains '@', split it and take the first part
    if (rawName.includes('@')) {
        rawName = rawName.split('@')[0];
    }

    // Optional: Capitalize first letter
    rawName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    userNameElements.forEach(element => {
        element.textContent = rawName;
    });
}

// 3. Load Statistics
function loadStatistics() {
    let totalAttendance = 0;
    let totalMeals = 0;
    let currentMonthBill = 0;

    const now = new Date();
    const currentMonthIdx = now.getMonth();
    const currentYear = now.getFullYear();

    // Loop through real attendance data
    if (typeof attendances !== 'undefined') {
        attendances.forEach(record => {
            const recDate = new Date(record.attendanceDate);

            // Filter: Match Month and Year
            if (recDate.getMonth() === currentMonthIdx && recDate.getFullYear() === currentYear) {

                // Count Present Days
                if (record.food === true) {
                    totalAttendance++;
                    totalMeals++;
                } else if (record.teaWater === true) {
                    totalAttendance++;
                }

                // Sum up the Cost
                currentMonthBill += (record.foodPrice || 0);
            }
        });
    }

    // Calculate attendance rate
    const dayOfMonth = now.getDate();
    const attendanceRate = dayOfMonth > 0 ? Math.round((totalAttendance / dayOfMonth) * 100) : 0;

    // Update UI
    const elTotalAtt = document.getElementById('totalAttendance');
    if (elTotalAtt) elTotalAtt.textContent = totalAttendance;

    const elMealCount = document.getElementById('mealCount');
    if (elMealCount) elMealCount.textContent = totalMeals;

    const elAttRate = document.getElementById('attendanceRate');
    if (elAttRate) elAttRate.textContent = `${attendanceRate}%`;

    // Update Current Bill Box
    const elCurBill = document.getElementById('currentBill');
    if (elCurBill) elCurBill.textContent = `Rs. ${parseFloat(currentMonthBill).toLocaleString()}`;
}

// 4. Load Today's Menu (FIXED ALIGNMENT)
function loadTodaysMenu() {
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

    const elTodayDay = document.getElementById('todayDay');
    if (elTodayDay) elTodayDay.textContent = dayName;

    // Safety check for menu variable
    if (typeof menu === 'undefined') return;

    const todaysItems = menu.filter(m => (m.dayOfWeek || m.DayOfWeek) === dayName);
    const lunchItems = todaysItems.filter(m => (m.mealType || m.MealType) === 'Lunch');
    const dinnerItems = todaysItems.filter(m => (m.mealType || m.MealType) === 'Dinner');

    // Helper to render list with PRICES
    const renderList = (items, elementId, priceId) => {
        const ul = document.getElementById(elementId);
        const priceEl = document.getElementById(priceId);

        if (ul) {
            // Remove default list styling
            ul.style.listStyle = 'none';
            ul.style.paddingLeft = '0';

            if (items.length > 0) {
                // Map items to include Name AND Price
                ul.innerHTML = items.map(item => {
                    const name = item.dishName || item.DishName;
                    const price = item.price || item.Price || 0;

                    // FIX: Added text-align:left and flex-grow:1 to name span
                    return `
                    <li style="
                        display: flex;
                        width: 100%;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 6px;
                        border-bottom: 1px dashed #eee;
                        padding-bottom: 6px;
                    ">
                        <span style="text-align: left; flex-grow: 1;">${name}</span>
                        <span style="color: #198754; font-weight: 600; white-space: nowrap;">
                            Rs. ${price}
                        </span>
                    </li>`;

                }).join('');

                // Calculate total for the meal category
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
    if (typeof attendances === 'undefined') return;

    const daysToShow = 7;
    let attendanceHTML = '';
    const today = new Date();

    for (let i = daysToShow - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);

        const dateString = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNumber = d.getDate();

        const record = attendances.find(a => a.attendanceDate.startsWith(dateString));

        let statusClass = 'pending';
        let icon = '<i class="bi bi-dash-circle"></i>';

        if (record) {
            if (record.food === true) {
                statusClass = 'present';
                icon = '<i class="bi bi-check-circle-fill"></i>';
            } else if (record.teaWater === true) {
                statusClass = 'present';
                icon = '<i class="bi bi-cup-hot-fill"></i>';
            } else {
                statusClass = 'absent';
                icon = '<i class="bi bi-x-circle-fill"></i>';
            }
        } else {
            if (d < new Date().setHours(0, 0, 0, 0)) {
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

// Placeholders
function viewCurrentBill() {
    const billsSection = document.getElementById('recentBills');
    if (billsSection) billsSection.scrollIntoView({ behavior: 'smooth' });
}

function viewAttendance() {
    alert('Full attendance view coming soon!');
}

function raiseDispute() {
    alert('Dispute feature coming soon!');
}

function viewProfile() {
    alert(`Profile: ${currentUser.name}\nDepartment: ${currentUser.department}\nCNIC: ${currentUser.cnic}`);
}

setInterval(function () {
    loadStatistics();
    loadTodaysMenu();
}, 300000);