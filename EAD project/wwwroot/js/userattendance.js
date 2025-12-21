// ========================================
// Global Variables & Configuration
// ========================================

// 'attendance' variable is defined in the Razor View:
// let attendance = @Html.Raw(Json.Serialize(Model));

let currentUser = {
    // We can pull the ID from the first record if it exists, or keep hardcoded for now
    userId: (attendance && attendance.length > 0) ? attendance[0].userId : 1,
    name: 'User', // You can pass this from C# ViewBag if needed
    username: 'user'
};

let attendanceRecords = [];
let selectedMonth = new Date();
let selectedAttendanceId = null;

// Configuration
const TEA_WATER_PRICE = 50; // Rs. 50 per day (Fixed cost if TeaWater bit is 1)

document.addEventListener('DOMContentLoaded', function () {
    initializeMonthPicker();
    setupEventListeners();

    // Initial Load
    loadUserAttendance();

    // Sidebar toggle for mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            sidebar.classList.toggle('show');
            sidebarOverlay.classList.toggle('show');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function () {
            sidebar.classList.remove('show');
            sidebarOverlay.classList.remove('show');
        });
    }

    // Set user name
    if (document.getElementById('userName')) {
        document.getElementById('userName').textContent = currentUser.name;
    }
});

function initializeMonthPicker() {
    const monthInput = document.getElementById('attendanceMonth');
    if (monthInput) {
        monthInput.value = formatMonthForInput(selectedMonth);
    }
    updateMonthDisplay();
}

function formatMonthForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

function formatMonthDisplay(date) {
    const options = { year: 'numeric', month: 'long' };
    return date.toLocaleDateString('en-US', options);
}

function updateMonthDisplay() {
    const monthDisplay = document.getElementById('selectedMonthDisplay');
    if (monthDisplay) {
        monthDisplay.textContent = formatMonthDisplay(selectedMonth);
    }
    // Reload attendance for new month
    loadUserAttendance();
}

// ========================================
// Event Listeners
// ========================================
function setupEventListeners() {
    // Month navigation
    const prevBtn = document.getElementById('prevMonthBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            selectedMonth.setMonth(selectedMonth.getMonth() - 1);
            document.getElementById('attendanceMonth').value = formatMonthForInput(selectedMonth);
            updateMonthDisplay();
        });
    }

    const nextBtn = document.getElementById('nextMonthBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            selectedMonth.setMonth(selectedMonth.getMonth() + 1);
            document.getElementById('attendanceMonth').value = formatMonthForInput(selectedMonth);
            updateMonthDisplay();
        });
    }

    const currBtn = document.getElementById('currentMonthBtn');
    if (currBtn) {
        currBtn.addEventListener('click', () => {
            selectedMonth = new Date();
            document.getElementById('attendanceMonth').value = formatMonthForInput(selectedMonth);
            updateMonthDisplay();
        });
    }

    const monthInput = document.getElementById('attendanceMonth');
    if (monthInput) {
        monthInput.addEventListener('change', (e) => {
            const [year, month] = e.target.value.split('-');
            selectedMonth = new Date(year, month - 1, 1);
            updateMonthDisplay();
        });
    }

    // Modal confirm buttons
    const confirmBtn = document.getElementById('confirmVerifyBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmVerification);
    }
}

// ========================================
// Load User Attendance (FROM C# DATA)
// ========================================
async function loadUserAttendance() {
    showLoading(true);

    try {
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth() + 1;

        // 1. Filter the global 'attendance' list passed from C# Model
        // We filter locally because the controller sent all history
        const filteredData = attendance.filter(record => {
            // Handle Case: Json.Serialize might make props camelCase or PascalCase
            const dateStr = record.date || record.Date;
            const recordDate = new Date(dateStr);
            return recordDate.getFullYear() === year && (recordDate.getMonth() + 1) === month;
        });

        // 2. Map Database Model to UI Logic
        attendanceRecords = filteredData.map(record => {
            const dateStr = record.date || record.Date;
            const dateObj = new Date(dateStr);

            // Handle Casing (Pascal vs Camel)
            const dbTeaWater = (record.teaWater !== undefined) ? record.teaWater : record.TeaWater;
            const dbFoodPrice = (record.foodPrice !== undefined) ? record.foodPrice : record.FoodPrice;
            const dbAttendanceId = (record.attendanceID !== undefined) ? record.attendanceID : record.AttendanceId;
            const dbUserId = (record.userID !== undefined) ? record.userID : record.UserId;

            // Calculations
            // Cost of Tea/Water is fixed (50) if boolean is true
            const teaWaterCost = dbTeaWater ? TEA_WATER_PRICE : 0;

            // DB has one 'FoodPrice'. We assign it to 'lunchPrice' for display purposes
            // since the DB doesn't distinguish between Lunch/Dinner prices.
            const foodCost = dbFoodPrice || 0;

            // Total Daily Cost
            const total = teaWaterCost + foodCost;

            return {
                attendanceId: dbAttendanceId,
                userId: dbUserId,
                date: dateStr.split('T')[0], // ISO Date
                dayName: dateObj.toLocaleDateString('en-US', { weekday: 'long' }),
                teaWater: dbTeaWater,
                foodPrice: foodCost,
                // UI Specific Mappings:
                lunchPrice: foodCost, // Mapping DB FoodPrice to Lunch column
                dinnerPrice: 0,       // Setting Dinner to 0 as DB structure is simple
                totalCost: total,
                sentToAdmin: false    // DB currently has no column for this, default to false
            };
        });

        renderAttendanceTable();
        updateStatistics();
        updateCostBreakdown();
        showLoading(false);
    } catch (error) {
        console.error('Error processing attendance data:', error);
        showToast('Failed to process attendance records', 'error');
        showLoading(false);
    }
}

// ========================================
// Render Attendance Table
// ========================================
function renderAttendanceTable() {
    const tbody = document.getElementById('attendanceTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (attendanceRecords.length === 0) {
        showEmptyState(true);
        return;
    }

    showEmptyState(false);

    attendanceRecords.forEach((record, index) => {
        const row = document.createElement('tr');

        const date = new Date(record.date);
        const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <span class="date-display">${formattedDate}</span>
            </td>
            <td>
                <span class="day-badge">${record.dayName}</span>
            </td>
            <td class="text-center">
                <i class="bi bi-${record.teaWater ? 'check-circle-fill status-icon present' : 'x-circle-fill status-icon absent'}"></i>
            </td>
            <td class="text-center">
                <!-- Using Lunch Column for Main Food Price -->
                <i class="bi bi-${record.lunchPrice > 0 ? 'check-circle-fill status-icon present' : 'x-circle-fill status-icon absent'}"></i>
                ${record.lunchPrice > 0 ? `<br><small class="text-muted">Rs. ${record.lunchPrice}</small>` : ''}
            </td>
            <td class="text-center">
                <!-- Dinner Column (Empty based on current DB Schema) -->
                <i class="bi bi-dash-circle status-icon absent" style="opacity: 0.5"></i>
            </td>
            <td class="text-end">
                <span class="cost-display">Rs. ${record.totalCost}</span>
            </td>
            <td class="text-center">
                <div class="action-btn-group" id="actions-${record.attendanceId}">
                    ${record.sentToAdmin
                ? `<button class="btn btn-sent" disabled>
                            <i class="bi bi-check-circle-fill me-1"></i>Sent
                           </button>`
                : `<button class="btn btn-verify" onclick="openVerifyModal(${record.attendanceId})">
                            <i class="bi bi-send me-1"></i>Verify
                           </button>`
            }
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });
}

// ========================================
// Update Statistics
// ========================================
function updateStatistics() {
    const totalDays = attendanceRecords.length;
    // Count days where food was eaten (Price > 0)
    const totalMeals = attendanceRecords.filter(r => r.lunchPrice > 0).length;
    const monthTotal = attendanceRecords.reduce((sum, r) => sum + r.totalCost, 0);

    setTextContent('totalDays', totalDays);
    setTextContent('totalMeals', totalMeals);
    setTextContent('monthTotal', `Rs. ${monthTotal}`);
    setTextContent('monthlyTotalCost', `Rs. ${monthTotal}`);
}

// ========================================
// Update Cost Breakdown
// ========================================
function updateCostBreakdown() {
    const teaWaterDays = attendanceRecords.filter(r => r.teaWater).length;
    // Using lunchPrice as the main food price container
    const lunchCount = attendanceRecords.filter(r => r.lunchPrice > 0).length;

    const teaWaterTotal = teaWaterDays * TEA_WATER_PRICE;
    const lunchTotal = attendanceRecords.reduce((sum, r) => sum + r.lunchPrice, 0);
    const grandTotal = teaWaterTotal + lunchTotal;

    setTextContent('teaWaterDays', teaWaterDays);
    setTextContent('teaWaterPrice', TEA_WATER_PRICE);
    setTextContent('teaWaterTotal', teaWaterTotal);

    setTextContent('lunchCount', lunchCount);
    setTextContent('lunchTotal', lunchTotal);

    // Zero out dinner stats for now
    setTextContent('dinnerCount', 0);
    setTextContent('dinnerTotal', 0);

    setTextContent('grandTotal', grandTotal);
}

// Helper to safely set text content
function setTextContent(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// ========================================
// Verification Modal
// ========================================
function openVerifyModal(attendanceId) {
    selectedAttendanceId = attendanceId;
    const record = attendanceRecords.find(r => r.attendanceId === attendanceId);

    if (!record) return;

    const date = new Date(record.date);
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const detailsHtml = `
        <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${formattedDate}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Tea/Water:</span>
            <span class="detail-value">${record.teaWater ? 'Yes (Rs. ' + TEA_WATER_PRICE + ')' : 'No'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Food (Meal):</span>
            <span class="detail-value">${record.lunchPrice > 0 ? 'Yes (Rs. ' + record.lunchPrice + ')' : 'No'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Total Cost:</span>
            <span class="detail-value" style="color: #198754; font-size: 1.1rem;">Rs. ${record.totalCost}</span>
        </div>
    `;

    const detailContainer = document.getElementById('verificationDetails');
    if (detailContainer) detailContainer.innerHTML = detailsHtml;

    const modalEl = document.getElementById('verifyModal');
    if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
}

async function confirmVerification() {
    try {
        const btn = document.getElementById('confirmVerifyBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sending...';

        // TODO: Create a C# Controller Action to handle this
        // const response = await fetch(`/Attendance/Verify`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ id: selectedAttendanceId })
        // });

        // Simulate API delay for now
        await new Promise(resolve => setTimeout(resolve, 800));

        // Update local record
        const record = attendanceRecords.find(r => r.attendanceId === selectedAttendanceId);
        if (record) {
            record.sentToAdmin = true;
        }

        // Close modal
        const modalEl = document.getElementById('verifyModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

        // Update UI
        renderAttendanceTable();

        showToast('Attendance verified successfully!', 'success');

        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-send me-2"></i>Send to Admin';
    } catch (error) {
        console.error('Error sending attendance:', error);
        showToast('Failed to send attendance', 'error');

        const btn = document.getElementById('confirmVerifyBtn');
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-send me-2"></i>Send to Admin';
    }
}

// ========================================
// UI Helper Functions
// ========================================
function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    const tableBody = document.getElementById('attendanceTableBody');

    if (loadingState && tableBody) {
        if (show) {
            loadingState.style.display = 'block';
            tableBody.innerHTML = '';
        } else {
            loadingState.style.display = 'none';
        }
    }
}

function showEmptyState(show) {
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
        emptyState.style.display = show ? 'block' : 'none';
    }
}

function showToast(message, type = 'success') {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} show`;
    toast.innerHTML = `
        <div class="toast-body d-flex align-items-center justify-content-between p-3">
            <span><i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'exclamation-circle'} me-2"></i>${message}</span>
            <button type="button" class="btn-close btn-close-white ms-3" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}