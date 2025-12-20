// User Dashboard JavaScript

// Sample data (In production, this would come from backend API)
const currentUser = {
    name: "Ahmed Ali",
    id: "MEM001",
    email: "ahmed.ali@example.com"
};
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
// Sample menu data
const weeklyMenu = {
    Monday: {
        lunch: { items: ["Rice", "Dal", "Chicken Curry", "Salad"], price: 120 },
        dinner: { items: ["Roti", "Vegetable Curry", "Rice", "Raita"], price: 100 }
    },
    Tuesday: {
        lunch: { items: ["Biryani", "Raita", "Salad"], price: 150 },
        dinner: { items: ["Roti", "Dal", "Paneer", "Rice"], price: 110 }
    },
    Wednesday: {
        lunch: { items: ["Rice", "Fish Curry", "Dal", "Salad"], price: 140 },
        dinner: { items: ["Roti", "Mixed Vegetable", "Rice"], price: 100 }
    },
    Thursday: {
        lunch: { items: ["Pulao", "Chicken Curry", "Raita", "Salad"], price: 130 },
        dinner: { items: ["Roti", "Dal Makhani", "Rice", "Pickle"], price: 110 }
    },
    Friday: {
        lunch: { items: ["Rice", "Mutton Curry", "Dal", "Salad"], price: 160 },
        dinner: { items: ["Roti", "Paneer Masala", "Rice", "Raita"], price: 120 }
    },
    Saturday: {
        lunch: { items: ["Fried Rice", "Manchurian", "Soup"], price: 130 },
        dinner: { items: ["Roti", "Chicken Curry", "Rice", "Salad"], price: 140 }
    },
    Sunday: {
        lunch: { items: ["Special Biryani", "Raita", "Salad", "Sweet"], price: 180 },
        dinner: { items: ["Roti", "Dal", "Mixed Veg", "Rice"], price: 100 }
    }
};

// Sample attendance data
const monthlyAttendance = [
    { date: "2025-12-14", status: "present", meals: 2, tea: 1 },
    { date: "2025-12-15", status: "present", meals: 2, tea: 2 },
    { date: "2025-12-16", status: "absent", meals: 0, tea: 0 },
    { date: "2025-12-17", status: "present", meals: 1, tea: 1 },
    { date: "2025-12-18", status: "present", meals: 2, tea: 2 },
    { date: "2025-12-19", status: "present", meals: 2, tea: 1 },
    { date: "2025-12-20", status: "pending", meals: 0, tea: 0 }
];

// Sample bill data
const bills = [
    { month: "December 2025", amount: 3500, status: "unpaid", date: "Due: Dec 25, 2025" },
    { month: "November 2025", amount: 3200, status: "paid", date: "Paid: Nov 28, 2025" },
    { month: "October 2025", amount: 3400, status: "paid", date: "Paid: Oct 30, 2025" }
];

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function () {
    initializeDashboard();
    setupSidebarToggle();
});

// Initialize all dashboard components
function initializeDashboard() {
    displayCurrentDate();
    displayUserName();
    loadStatistics();
    loadTodaysMenu();
    loadRecentBills();
    loadWeekAttendance();
}

// Display current date
function displayCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = today.toLocaleDateString('en-US', options);
}

// Display user name
function displayUserName() {
    const userNameElements = document.querySelectorAll('#userName, #userNameBanner');
    userNameElements.forEach(element => {
        element.textContent = currentUser.name;
    });
}

// Load statistics
function loadStatistics() {
    // Calculate statistics from attendance data
    let totalAttendance = 0;
    let totalMeals = 0;
    let totalBill = 0;

    // Calculate total possible days (excluding today if pending)
    const totalDays = monthlyAttendance.length;
    const completedDays = monthlyAttendance.filter(record => record.status !== 'pending').length;

    monthlyAttendance.forEach(record => {
        if (record.status === 'present') {
            totalAttendance++;
            totalMeals += record.meals;
        }
    });

    // Calculate attendance rate percentage
    const attendanceRate = completedDays > 0 ? Math.round((totalAttendance / completedDays) * 100) : 0;

    // Calculate estimated bill (example calculation)
    totalBill = (totalMeals * 115);

    // Update stat cards
    document.getElementById('totalAttendance').textContent = totalAttendance;
    document.getElementById('mealCount').textContent = totalMeals;
    document.getElementById('attendanceRate').textContent = `${attendanceRate}%`;
    document.getElementById('currentBill').textContent = `Rs. ${totalBill}`;
}

// Load today's menu
function loadTodaysMenu() {
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

    // Update day badge
    document.getElementById('todayDay').textContent = dayName;

    // Get today's menu
    const todayMenu = weeklyMenu[dayName];

    if (todayMenu) {
        // Load lunch items
        const lunchItemsElement = document.getElementById('lunchItems');
        lunchItemsElement.innerHTML = todayMenu.lunch.items.map(item => `<li>${item}</li>`).join('');
        document.getElementById('lunchPrice').textContent = `Rs. ${todayMenu.lunch.price}`;

        // Load dinner items
        const dinnerItemsElement = document.getElementById('dinnerItems');
        dinnerItemsElement.innerHTML = todayMenu.dinner.items.map(item => `<li>${item}</li>`).join('');
        document.getElementById('dinnerPrice').textContent = `Rs. ${todayMenu.dinner.price}`;

        // Calculate and display total
        const total = todayMenu.lunch.price + todayMenu.dinner.price;
        document.getElementById('todayTotal').textContent = `Rs. ${total}`;
    }
}

// Load recent bills
function loadRecentBills() {
    const billListElement = document.getElementById('recentBills');

    if (bills.length === 0) {
        billListElement.innerHTML = '<p class="text-muted">No bills available</p>';
        return;
    }

    const billsHTML = bills.map(bill => `
        <div class="bill-item">
            <div class="bill-info">
                <div class="bill-month">${bill.month}</div>
                <div class="bill-date">${bill.date}</div>
            </div>
            <div class="bill-amount">Rs. ${bill.amount}</div>
            <span class="bill-status ${bill.status}">${bill.status.toUpperCase()}</span>
        </div>
    `).join('');

    billListElement.innerHTML = billsHTML;
}

// Load week attendance
function loadWeekAttendance() {
    const weekAttendanceElement = document.getElementById('weekAttendance');

    // Get last 7 days
    const last7Days = monthlyAttendance.slice(-7);

    const attendanceHTML = last7Days.map(record => {
        const date = new Date(record.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNumber = date.getDate();

        let icon = '<i class="bi bi-clock-fill"></i>';
        if (record.status === 'present') {
            icon = '<i class="bi bi-check-circle-fill"></i>';
        } else if (record.status === 'absent') {
            icon = '<i class="bi bi-x-circle-fill"></i>';
        }

        return `
            <div class="attendance-day ${record.status}">
                <div class="attendance-day-name">${dayName}</div>
                <div class="attendance-day-icon">${icon}</div>
                <div class="attendance-day-date">${dayNumber}</div>
            </div>
        `;
    }).join('');

    weekAttendanceElement.innerHTML = attendanceHTML;
}

// Setup sidebar toggle for mobile
function setupSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');

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
}

// Quick action functions
function viewCurrentBill() {
    alert('Redirecting to current bill details...');
    // In production: window.location.href = 'bills.html';
}

function viewAttendance() {
    alert('Redirecting to attendance page...');
    // In production: window.location.href = 'attendance.html';
}

function raiseDispute() {
    alert('Opening dispute form...');
    // In production: Open a modal or redirect to dispute page
}

function viewProfile() {
    alert('Redirecting to profile page...');
    // In production: window.location.href = 'profile.html';
}

// Auto-refresh data every 5 minutes
setInterval(function () {
    loadStatistics();
    loadTodaysMenu();
}, 300000); // 5 minutes
