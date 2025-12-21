// User Attendance Management System
// ========================================

// Global Variables
let currentUser = {
    userId: 1,
    name: 'Ahmed Ali',
    username: 'ahmed.ali'
};

let attendanceRecords = [];
let selectedMonth = new Date();
let selectedAttendanceId = null;
const TEA_WATER_PRICE = 50; // Rs. 50 per day

// ========================================
// Initialize
// ========================================
document.addEventListener('DOMContentLoaded', function () {
    initializeMonthPicker();
    setupEventListeners();
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
    document.getElementById('userName').textContent = currentUser.name;
});

// ========================================
// Month Picker Functions
// ========================================
function initializeMonthPicker() {
    const monthInput = document.getElementById('attendanceMonth');

    // Set current month
    monthInput.value = formatMonthForInput(selectedMonth);
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
    monthDisplay.textContent = formatMonthDisplay(selectedMonth);

    // Reload attendance for new month
    loadUserAttendance();
}

// ========================================
// Event Listeners
// ========================================
function setupEventListeners() {
    // Month navigation
    document.getElementById('prevMonthBtn').addEventListener('click', () => {
        selectedMonth.setMonth(selectedMonth.getMonth() - 1);
        document.getElementById('attendanceMonth').value = formatMonthForInput(selectedMonth);
        updateMonthDisplay();
    });

    document.getElementById('nextMonthBtn').addEventListener('click', () => {
        selectedMonth.setMonth(selectedMonth.getMonth() + 1);
        document.getElementById('attendanceMonth').value = formatMonthForInput(selectedMonth);
        updateMonthDisplay();
    });

    document.getElementById('currentMonthBtn').addEventListener('click', () => {
        selectedMonth = new Date();
        document.getElementById('attendanceMonth').value = formatMonthForInput(selectedMonth);
        updateMonthDisplay();
    });

    document.getElementById('attendanceMonth').addEventListener('change', (e) => {
        const [year, month] = e.target.value.split('-');
        selectedMonth = new Date(year, month - 1, 1);
        updateMonthDisplay();
    });

    // Modal confirm buttons
    document.getElementById('confirmVerifyBtn').addEventListener('click', confirmVerification);
}

// ========================================
// Load User Attendance
// ========================================
async function loadUserAttendance() {
    showLoading(true);

    try {
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth() + 1;

        // Simulated API call - Replace with actual C# API endpoint
        // const response = await fetch(`/api/Attendance/GetUserAttendance?userId=${currentUser.userId}&year=${year}&month=${month}`);
        // attendanceRecords = await response.json();

        // Mock attendance data based on your table structure
        attendanceRecords = generateMockAttendance(year, month);

        renderAttendanceTable();
        updateStatistics();
        updateCostBreakdown();
        showLoading(false);
    } catch (error) {
        console.error('Error loading attendance:', error);
        showToast('Failed to load attendance records', 'error');
        showLoading(false);
    }
}

// Generate mock attendance data for demonstration
function generateMockAttendance(year, month) {
    const records = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

        // Generate random attendance for demonstration
        const hasTeaWater = Math.random() > 0.1; // 90% chance
        const hasLunch = hasTeaWater && Math.random() > 0.3; // 70% of tea/water days
        const hasDinner = hasTeaWater && Math.random() > 0.4; // 60% of tea/water days

        // Random lunch and dinner prices (based on menu)
        const lunchPrice = hasLunch ? (Math.floor(Math.random() * 3) + 1) * 50 + 100 : 0; // 150-250
        const dinnerPrice = hasDinner ? (Math.floor(Math.random() * 2) + 1) * 50 + 50 : 0; // 100-150

        // Calculate total cost: Tea/Water (if present) + Lunch + Dinner
        const totalCost = (hasTeaWater ? TEA_WATER_PRICE : 0) + lunchPrice + dinnerPrice;

        // Random sent to admin status
        const sentToAdmin = day < new Date().getDate() && Math.random() > 0.6; // Some sent

        records.push({
            attendanceId: records.length + 1,
            userId: currentUser.userId,
            date: date.toISOString().split('T')[0],
            dayName: dayName,
            teaWater: hasTeaWater,
            food: hasLunch || hasDinner, // Food bit indicates any meal consumption
            foodPrice: lunchPrice + dinnerPrice,
            lunchPrice: lunchPrice,
            dinnerPrice: dinnerPrice,
            totalCost: totalCost,
            sentToAdmin: sentToAdmin
        });
    }

    return records;
}

// ========================================
// Render Attendance Table
// ========================================
function renderAttendanceTable() {
    const tbody = document.getElementById('attendanceTableBody');
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
                <i class="bi bi-${record.lunchPrice > 0 ? 'check-circle-fill status-icon present' : 'x-circle-fill status-icon absent'}"></i>
                ${record.lunchPrice > 0 ? `<br><small class="text-muted">Rs. ${record.lunchPrice}</small>` : ''}
            </td>
            <td class="text-center">
                <i class="bi bi-${record.dinnerPrice > 0 ? 'check-circle-fill status-icon present' : 'x-circle-fill status-icon absent'}"></i>
                ${record.dinnerPrice > 0 ? `<br><small class="text-muted">Rs. ${record.dinnerPrice}</small>` : ''}
            </td>
            <td class="text-end">
                <span class="cost-display">Rs. ${record.totalCost}</span>
            </td>
            <td class="text-center">
                <div class="action-btn-group" id="actions-${record.attendanceId}">
                    ${record.sentToAdmin
                ? `<button class="btn btn-sent" disabled>
                            <i class="bi bi-check-circle-fill me-1"></i>Sent to Admin
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
// Filter Attendance
// ========================================
function filterAttendance() {
    renderAttendanceTable();
    updateStatistics();
}

// ========================================
// Update Statistics
// ========================================
function updateStatistics() {
    const totalDays = attendanceRecords.length;
    const totalMeals = attendanceRecords.filter(r => r.lunchPrice > 0 || r.dinnerPrice > 0).length;
    const monthTotal = attendanceRecords.reduce((sum, r) => sum + r.totalCost, 0);

    document.getElementById('totalDays').textContent = totalDays;
    document.getElementById('totalMeals').textContent = totalMeals;
    document.getElementById('monthTotal').textContent = `Rs. ${monthTotal}`;
    document.getElementById('monthlyTotalCost').textContent = `Rs. ${monthTotal}`;
}

// ========================================
// Update Cost Breakdown
// ========================================
function updateCostBreakdown() {
    const teaWaterDays = attendanceRecords.filter(r => r.teaWater).length;
    const lunchCount = attendanceRecords.filter(r => r.lunchPrice > 0).length;
    const dinnerCount = attendanceRecords.filter(r => r.dinnerPrice > 0).length;

    const teaWaterTotal = teaWaterDays * TEA_WATER_PRICE;
    const lunchTotal = attendanceRecords.reduce((sum, r) => sum + r.lunchPrice, 0);
    const dinnerTotal = attendanceRecords.reduce((sum, r) => sum + r.dinnerPrice, 0);
    const grandTotal = teaWaterTotal + lunchTotal + dinnerTotal;

    document.getElementById('teaWaterDays').textContent = teaWaterDays;
    document.getElementById('teaWaterPrice').textContent = TEA_WATER_PRICE;
    document.getElementById('teaWaterTotal').textContent = teaWaterTotal;

    document.getElementById('lunchCount').textContent = lunchCount;
    document.getElementById('lunchTotal').textContent = lunchTotal;

    document.getElementById('dinnerCount').textContent = dinnerCount;
    document.getElementById('dinnerTotal').textContent = dinnerTotal;

    document.getElementById('grandTotal').textContent = grandTotal;
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
            <span class="detail-label">Lunch:</span>
            <span class="detail-value">${record.lunchPrice > 0 ? 'Yes (Rs. ' + record.lunchPrice + ')' : 'No'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Dinner:</span>
            <span class="detail-value">${record.dinnerPrice > 0 ? 'Yes (Rs. ' + record.dinnerPrice + ')' : 'No'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Total Cost:</span>
            <span class="detail-value" style="color: #198754; font-size: 1.1rem;">Rs. ${record.totalCost}</span>
        </div>
    `;

    document.getElementById('verificationDetails').innerHTML = detailsHtml;

    const modal = new bootstrap.Modal(document.getElementById('verifyModal'));
    modal.show();
}

async function confirmVerification() {
    try {
        const btn = document.getElementById('confirmVerifyBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sending...';

        // Simulated API call - Replace with actual C# API endpoint
        // const response = await fetch(`/api/Attendance/SendToAdmin`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         attendanceId: selectedAttendanceId,
        //         userId: currentUser.userId
        //     })
        // });

        // if (!response.ok) throw new Error('Failed to send');

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update local record
        const record = attendanceRecords.find(r => r.attendanceId === selectedAttendanceId);
        if (record) {
            record.sentToAdmin = true;
        }

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('verifyModal'));
        modal.hide();

        // Update UI
        renderAttendanceTable();
        updateStatistics();

        showToast('Attendance sent to admin for verification!', 'success');

        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-send me-2"></i>Send to Admin';
    } catch (error) {
        console.error('Error sending attendance:', error);
        showToast('Failed to send attendance to admin', 'error');

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

    if (show) {
        loadingState.style.display = 'block';
        tableBody.innerHTML = '';
    } else {
        loadingState.style.display = 'none';
    }
}

function showEmptyState(show) {
    const emptyState = document.getElementById('emptyState');
    emptyState.style.display = show ? 'block' : 'none';
}

function showToast(message, type = 'success') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} show`;
    toast.innerHTML = `
        <div class="toast-body d-flex align-items-center justify-content-between p-3">
            <span><i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'exclamation-circle'} me-2"></i>${message}</span>
            <button type="button" class="btn-close btn-close-white ms-3" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;

    toastContainer.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.remove();
    }, 4000);
}
