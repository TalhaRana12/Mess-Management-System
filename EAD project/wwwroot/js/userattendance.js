// ========================================
// 1. DATA INITIALIZATION
// ========================================

// Safely handle data passed from C# (Razor)
let safeAttendanceData = (typeof attendance !== 'undefined' && attendance !== null) ? attendance : [];
let safeRequestData = (typeof requests !== 'undefined' && requests !== null) ? requests : [];

// User Identity
let currentUser = {
    userId: (safeAttendanceData.length > 0) ? (safeAttendanceData[0].userId || safeAttendanceData[0].UserId) : 0,
    name: 'User',
    username: 'user'
};

// Global State
let attendanceRecords = [];
let selectedMonth = new Date();
let selectedAttendanceId = null;

// Configuration
const TEA_WATER_PRICE = 50; // Rs. 50 per day fixed cost

// ========================================
// 2. DOCUMENT READY & EVENTS
// ========================================
document.addEventListener('DOMContentLoaded', function () {
    initializeMonthPicker();
    setupEventListeners();

    // Initial Load
    loadUserAttendance();

    // Sidebar toggle (Mobile)
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            sidebar.classList.toggle('show');
            if (sidebarOverlay) sidebarOverlay.classList.toggle('show');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function () {
            sidebar.classList.remove('show');
            sidebarOverlay.classList.remove('show');
        });
    }

    // Set user name in UI
    if (document.getElementById('userName')) {
        document.getElementById('userName').textContent = currentUser.name;
    }
});

function setupEventListeners() {
    // Month Navigation
    const prevBtn = document.getElementById('prevMonthBtn');
    const nextBtn = document.getElementById('nextMonthBtn');
    const currBtn = document.getElementById('currentMonthBtn');
    const monthInput = document.getElementById('attendanceMonth');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            selectedMonth.setMonth(selectedMonth.getMonth() - 1);
            updateMonthInputAndDisplay();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            selectedMonth.setMonth(selectedMonth.getMonth() + 1);
            updateMonthInputAndDisplay();
        });
    }

    if (currBtn) {
        currBtn.addEventListener('click', () => {
            selectedMonth = new Date();
            updateMonthInputAndDisplay();
        });
    }

    if (monthInput) {
        monthInput.addEventListener('change', (e) => {
            const [year, month] = e.target.value.split('-');
            selectedMonth = new Date(year, month - 1, 1);
            updateMonthDisplay();
        });
    }

    // Verify Modal Confirmation Button
    const confirmBtn = document.getElementById('confirmVerifyBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmVerification);
    }
}

// ========================================
// 3. DATE & DISPLAY HELPERS
// ========================================
function initializeMonthPicker() {
    updateMonthInputAndDisplay();
}

function updateMonthInputAndDisplay() {
    const monthInput = document.getElementById('attendanceMonth');
    const monthDisplay = document.getElementById('selectedMonthDisplay');

    if (monthInput) monthInput.value = formatMonthForInput(selectedMonth);
    if (monthDisplay) monthDisplay.textContent = formatMonthDisplay(selectedMonth);

    // Reload Data
    loadUserAttendance();
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

// ========================================
// 4. CORE LOGIC: LOAD & PROCESS DATA
// ========================================
async function loadUserAttendance() {
    showLoading(true);

    try {
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth() + 1;

        // Check if data exists
        if (!safeAttendanceData || safeAttendanceData.length === 0) {
            console.warn("No attendance data found.");
            attendanceRecords = [];
            renderAttendanceTable();
            showLoading(false);
            return;
        }

        // Filter for selected month
        const filteredData = safeAttendanceData.filter(record => {
            const dateStr = record.attendanceDate || record.AttendanceDate;
            if (!dateStr) return false;
            const recordDate = new Date(dateStr);
            return recordDate.getFullYear() === year && (recordDate.getMonth() + 1) === month;
        });

        // ---------------------------------------------------------
        // MAP REQUESTS TO ATTENDANCE IDs
        // ---------------------------------------------------------
        // Create a lookup: { 101: "Pending", 102: "Approved" }
        const requestMap = {};
        if (safeRequestData.length > 0) {
            safeRequestData.forEach(req => {
                const attId = req.attendanceId || req.AttendanceId;
                const status = req.status || req.Status;
                requestMap[attId] = status;
            });
        }

        // ---------------------------------------------------------
        // GROUPING LOGIC (Merge Lunch/Dinner/Tea)
        // ---------------------------------------------------------
        const groupedData = {};

        filteredData.forEach(record => {
            const dateStr = record.attendanceDate || record.AttendanceDate;

            // Safe Property Access (Handles CamelCase or PascalCase)
            const mealTypeRaw = record.mealType || record.MealType || "";
            const rawPrice = (record.foodPrice !== undefined) ? record.foodPrice : record.FoodPrice;
            const teaWater = (record.teaWater !== undefined) ? record.teaWater : record.TeaWater;
            const isFood = (record.food !== undefined) ? record.food : record.Food;
            const attId = (record.attendanceId !== undefined) ? record.attendanceId : record.AttendanceId;
            const uId = (record.userId !== undefined) ? record.userId : record.UserId;

            const foodPrice = parseFloat(rawPrice) || 0;

            // Check if this specific attendance ID has a request
            const existingStatus = requestMap[attId];

            if (!groupedData[dateStr]) {
                groupedData[dateStr] = {
                    attendanceId: attId,
                    userId: uId,
                    date: dateStr,
                    dayName: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' }),
                    teaWater: false,
                    hasLunch: false,
                    lunchPrice: 0,
                    hasDinner: false,
                    dinnerPrice: 0,
                    // Status Logic
                    requestStatus: existingStatus,
                    sentToAdmin: (existingStatus !== undefined && existingStatus !== null)
                };
            }

            const currentDay = groupedData[dateStr];

            // Merge Tea/Water
            if (teaWater === true) currentDay.teaWater = true;

            // Merge Food
            const type = mealTypeRaw.toLowerCase().trim();
            if (type.includes("lunch")) {
                if (isFood === true) {
                    currentDay.hasLunch = true;
                    currentDay.lunchPrice = foodPrice;
                }
            }
            else if (type.includes("dinner")) {
                if (isFood === true) {
                    currentDay.hasDinner = true;
                    currentDay.dinnerPrice = foodPrice;
                }
            }
        });

        // Convert Map to Array & Calculate Totals
        attendanceRecords = Object.values(groupedData).map(day => {
            const teaWaterCost = day.teaWater ? TEA_WATER_PRICE : 0;
            const lPrice = parseFloat(day.lunchPrice) || 0;
            const dPrice = parseFloat(day.dinnerPrice) || 0;
            const total = teaWaterCost + lPrice + dPrice;

            return {
                ...day,
                lunchPrice: lPrice,
                dinnerPrice: dPrice,
                totalCost: total
            };
        });

        // Sort by Date
        attendanceRecords.sort((a, b) => new Date(a.date) - new Date(b.date));

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
// 5. RENDER TABLE
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

        // Button Logic: Styling based on Status
        let btnHtml = '';

        if (record.sentToAdmin) {
            // Determine Color and Icon based on Status
            let btnClass = "btn-secondary";
            let iconClass = "bi-clock-history";
            let statusText = record.requestStatus || "Sent"; // Default to "Sent" if null

            // Normalize string for comparison
            const statusUpper = statusText.toUpperCase();

            if (statusUpper === "APPROVED") {
                btnClass = "btn-success";
                iconClass = "bi-check-circle-fill";
            } else if (statusUpper === "REJECTED" || statusUpper === "DECLINED") {
                btnClass = "btn-danger";
                iconClass = "bi-x-circle-fill";
            } else if (statusUpper === "PENDING") {
                btnClass = "btn-warning"; // Bootstrap warning is yellow
                iconClass = "bi-hourglass-split";
            }

            // Render Disabled Status Button
            btnHtml = `
                <button class="btn ${btnClass} btn-sm" disabled style="opacity:1; cursor: default; font-weight: 500; color: ${btnClass === 'btn-warning' ? '#000' : '#fff'};">
                    <i class="bi ${iconClass} me-1"></i>${statusText}
                </button>`;
        } else {
            // Render Active Verify Button
            btnHtml = `
                <button class="btn btn-verify" onclick="openVerifyModal(${record.attendanceId})">
                    <i class="bi bi-send me-1"></i>Verify
                </button>`;
        }

        row.innerHTML = `
            <td>${index + 1}</td>
            <td><span class="date-display">${formattedDate}</span></td>
            <td><span class="day-badge">${record.dayName}</span></td>
            
            <td class="text-center">
                <i class="bi bi-${record.teaWater ? 'check-circle-fill status-icon present' : 'x-circle-fill status-icon absent'}"></i>
            </td>
            
            <td class="text-center">
                <i class="bi bi-${record.hasLunch ? 'check-circle-fill status-icon present' : 'x-circle-fill status-icon absent'}"></i>
                ${record.lunchPrice > 0 ? `<br><small class="text-muted">Rs. ${record.lunchPrice}</small>` : ''}
            </td>
            
            <td class="text-center">
                <i class="bi bi-${record.hasDinner ? 'check-circle-fill status-icon present' : 'x-circle-fill status-icon absent'}"></i>
                ${record.dinnerPrice > 0 ? `<br><small class="text-muted">Rs. ${record.dinnerPrice}</small>` : ''}
            </td>
            
            <td class="text-end">
                <span class="cost-display">Rs. ${record.totalCost}</span>
            </td>
            
            <td class="text-center">
                <div class="action-btn-group" id="actions-${record.attendanceId}">
                    ${btnHtml}
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });
}

// ========================================
// 6. STATISTICS
// ========================================
function updateStatistics() {
    const totalDays = attendanceRecords.length;
    let totalMeals = 0;

    attendanceRecords.forEach(r => {
        if (r.hasLunch) totalMeals++;
        if (r.hasDinner) totalMeals++;
    });

    const monthTotal = attendanceRecords.reduce((sum, r) => sum + r.totalCost, 0);

    setTextContent('totalDays', totalDays);
    setTextContent('totalMeals', totalMeals);
    setTextContent('monthTotal', `Rs. ${monthTotal}`);
    setTextContent('monthlyTotalCost', `Rs. ${monthTotal}`);
}

function updateCostBreakdown() {
    const teaWaterDays = attendanceRecords.filter(r => r.teaWater).length;
    const teaWaterTotal = teaWaterDays * TEA_WATER_PRICE;

    const lunchCount = attendanceRecords.filter(r => r.hasLunch).length;
    const lunchTotal = attendanceRecords.reduce((sum, r) => sum + r.lunchPrice, 0);

    const dinnerCount = attendanceRecords.filter(r => r.hasDinner).length;
    const dinnerTotal = attendanceRecords.reduce((sum, r) => sum + r.dinnerPrice, 0);

    const grandTotal = teaWaterTotal + lunchTotal + dinnerTotal;

    setTextContent('teaWaterDays', teaWaterDays);
    setTextContent('teaWaterPrice', TEA_WATER_PRICE);
    setTextContent('teaWaterTotal', teaWaterTotal);
    setTextContent('lunchCount', lunchCount);
    setTextContent('lunchTotal', lunchTotal);
    setTextContent('dinnerCount', dinnerCount);
    setTextContent('dinnerTotal', dinnerTotal);
    setTextContent('grandTotal', grandTotal);
}

function setTextContent(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// ========================================
// 7. VERIFICATION MODAL & API
// ========================================
function openVerifyModal(attendanceId) {
    selectedAttendanceId = attendanceId;
    const record = attendanceRecords.find(r => r.attendanceId === attendanceId);

    if (!record) return;

    const formattedDate = new Date(record.date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const detailsHtml = `
        <div class="detail-row"><span class="detail-label">Date:</span><span class="detail-value">${formattedDate}</span></div>
        <div class="detail-row"><span class="detail-label">Tea/Water:</span><span class="detail-value">${record.teaWater ? 'Yes (Rs. ' + TEA_WATER_PRICE + ')' : 'No'}</span></div>
        <div class="detail-row"><span class="detail-label">Lunch:</span><span class="detail-value">${record.hasLunch ? 'Yes (Rs. ' + record.lunchPrice + ')' : 'No'}</span></div>
        <div class="detail-row"><span class="detail-label">Dinner:</span><span class="detail-value">${record.hasDinner ? 'Yes (Rs. ' + record.dinnerPrice + ')' : 'No'}</span></div>
        <div class="detail-row"><span class="detail-label">Total Cost:</span><span class="detail-value" style="color: #198754; font-size: 1.1rem;">Rs. ${record.totalCost}</span></div>
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
    const btn = document.getElementById('confirmVerifyBtn');

    // Safety checks
    if (!selectedAttendanceId) {
        showToast('Error: No attendance selected.', 'error');
        return;
    }
    if (!currentUser.userId) {
        showToast('Error: User ID not found.', 'error');
        return;
    }

    try {
        // 1. UI Loading State
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sending...';

        // 2. Payload
        const payload = {
            AttendanceId: parseInt(selectedAttendanceId),
            UserId: parseInt(currentUser.userId)
        };

        // 3. API Call
        const response = await fetch('/Userattendance/verify_request_api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // 4. Handle Errors
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to send request");
        }

        // 5. Success - Update Local State Immediately
        const record = attendanceRecords.find(r => r.attendanceId === selectedAttendanceId);
        if (record) {
            record.sentToAdmin = true;
            record.requestStatus = "Pending"; // Immediate feedback
        }

        // Close Modal
        const modalEl = document.getElementById('verifyModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

        // Re-render
        renderAttendanceTable();
        showToast('Attendance verified successfully! Status: Pending', 'success');

    } catch (error) {
        console.error('Error sending attendance:', error);
        showToast(error.message, 'error');
    } finally {
        // Reset Button
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-send me-2"></i>Send to Admin';
    }
}

// ========================================
// 8. UI HELPERS (Toast, Loading)
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
    if (emptyState) emptyState.style.display = show ? 'block' : 'none';
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
        </div>`;

    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}