let safeAttendanceData = (typeof attendance !== 'undefined' && attendance !== null) ? attendance : [];

let currentUser = {
    // We can pull the ID from the first record if it exists, or keep hardcoded 
    userId: (safeAttendanceData.length > 0) ? (safeAttendanceData[0].userId || safeAttendanceData[0].UserId) : 0,
    name: 'User',
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
            updateMonthInputAndDisplay();
        });
    }

    const nextBtn = document.getElementById('nextMonthBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            selectedMonth.setMonth(selectedMonth.getMonth() + 1);
            updateMonthInputAndDisplay();
        });
    }

    const currBtn = document.getElementById('currentMonthBtn');
    if (currBtn) {
        currBtn.addEventListener('click', () => {
            selectedMonth = new Date();
            updateMonthInputAndDisplay();
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

function updateMonthInputAndDisplay() {
    const monthInput = document.getElementById('attendanceMonth');
    if (monthInput) monthInput.value = formatMonthForInput(selectedMonth);
    updateMonthDisplay();
}

// ========================================
// Load User Attendance (Logic)
// ========================================
//async function loadUserAttendance() {
//    showLoading(true);

//    try {
//        const year = selectedMonth.getFullYear();
//        const month = selectedMonth.getMonth() + 1;

//        // 1. Check if data exists
//        if (!safeAttendanceData || safeAttendanceData.length === 0) {
//            console.warn("No attendance data found.");
//            attendanceRecords = [];
//            renderAttendanceTable();
//            showLoading(false);
//            return;
//        }

//        // 2. Filter data for the selected month
//        const filteredData = safeAttendanceData.filter(record => {
//            // Support C# Property 'AttendanceDate' or JS camelCase 'attendanceDate'
//            const dateStr = record.attendanceDate || record.AttendanceDate;

//            if (!dateStr) return false;

//            const recordDate = new Date(dateStr);
//            return recordDate.getFullYear() === year && (recordDate.getMonth() + 1) === month;
//        });

//        // =========================================================
//        // GROUPING LOGIC: Merge Lunch & Dinner rows by Date
//        // =========================================================
//        const groupedData = {};

//        filteredData.forEach(record => {
//            // Get properties with safe casing checks
//            const dateStr = record.attendanceDate || record.AttendanceDate;
//            // Handle mealType safely (it might be null)
//            const mealType = record.mealType || record.MealType || "";
//            const foodPrice = (record.foodPrice !== undefined) ? record.foodPrice : record.FoodPrice;
//            const teaWater = (record.teaWater !== undefined) ? record.teaWater : record.TeaWater;
//            const attId = (record.attendanceId !== undefined) ? record.attendanceId : record.AttendanceId;
//            const uId = (record.userId !== undefined) ? record.userId : record.UserId;

//            // Initialize object for this date if not exists
//            if (!groupedData[dateStr]) {
//                groupedData[dateStr] = {
//                    attendanceId: attId, // Store the first ID found
//                    userId: uId,
//                    date: dateStr,
//                    dayName: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' }),
//                    teaWater: false,
//                    lunchPrice: 0,
//                    dinnerPrice: 0,
//                    sentToAdmin: false
//                };
//            }

//            const currentDay = groupedData[dateStr];

//            // 1. Merge Tea/Water (True if true in ANY record for this day)
//            if (teaWater === true) {
//                currentDay.teaWater = true;
//            }

//            // 2. Merge Prices based on MealType
//            const type = mealType.toLowerCase();

//            // FIXED LOGIC: Only assign price if explicitly Lunch or Dinner
//            if (type.includes("lunch")) {
//                currentDay.lunchPrice = foodPrice || 0;
//            }
//            else if (type.includes("dinner")) {
//                currentDay.dinnerPrice = foodPrice || 0;
//            }

//            // Previous fallback code removed to prevent Tea-only records from adding Lunch price
//        });

//        // 3. Convert Object back to Array and Calculate Totals
//        attendanceRecords = Object.values(groupedData).map(day => {
//            // Tea cost is fixed at 50 if the bit is true
//            const teaWaterCost = day.teaWater ? TEA_WATER_PRICE : 0;

//            // Total cost = Tea Cost + Lunch Price + Dinner Price
//            const total = teaWaterCost + day.lunchPrice + day.dinnerPrice;

//            return {
//                ...day,
//                totalCost: total
//            };
//        });

//        // Sort by date (oldest to newest)
//        attendanceRecords.sort((a, b) => new Date(a.date) - new Date(b.date));

//        renderAttendanceTable();
//        updateStatistics();
//        updateCostBreakdown();
//        showLoading(false);

//    } catch (error) {
//        console.error('Error processing attendance data:', error);
//        console.log('Raw Data:', safeAttendanceData);
//        showToast('Failed to process attendance records', 'error');
//        showLoading(false);
//    }
//}
async function loadUserAttendance() {
    showLoading(true);

    try {
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth() + 1;

        // 1. Check if data exists
        if (!safeAttendanceData || safeAttendanceData.length === 0) {
            console.warn("No attendance data found.");
            attendanceRecords = [];
            renderAttendanceTable();
            showLoading(false);
            return;
        }

        // 2. Filter data for the selected month
        const filteredData = safeAttendanceData.filter(record => {
            const dateStr = record.attendanceDate || record.AttendanceDate;
            if (!dateStr) return false;
            const recordDate = new Date(dateStr);
            return recordDate.getFullYear() === year && (recordDate.getMonth() + 1) === month;
        });

        // =========================================================
        // GROUPING LOGIC
        // =========================================================
        const groupedData = {};

        filteredData.forEach(record => {
            const dateStr = record.attendanceDate || record.AttendanceDate;

            // SAFELY GET VALUES
            const mealTypeRaw = record.mealType || record.MealType || "";
            const rawPrice = (record.foodPrice !== undefined) ? record.foodPrice : record.FoodPrice;
            const teaWater = (record.teaWater !== undefined) ? record.teaWater : record.TeaWater;
            const attId = (record.attendanceId !== undefined) ? record.attendanceId : record.AttendanceId;
            const uId = (record.userId !== undefined) ? record.userId : record.UserId;

            // Ensure foodPrice is a proper Number. If null/NaN, default to 0.
            const foodPrice = parseFloat(rawPrice) || 0;

            // Initialize object for this date if not exists
            if (!groupedData[dateStr]) {
                groupedData[dateStr] = {
                    attendanceId: attId,
                    userId: uId,
                    date: dateStr,
                    dayName: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' }),
                    teaWater: false,
                    lunchPrice: 0,
                    dinnerPrice: 0,
                    sentToAdmin: false
                };
            }

            const currentDay = groupedData[dateStr];

            // 1. Merge Tea/Water
            if (teaWater === true) {
                currentDay.teaWater = true;
            }

            // 2. Merge Prices based on MealType
            const type = mealTypeRaw.toLowerCase().trim();

            // ONLY assign price if the MealType explicitly contains "lunch" or "dinner"
            if (type.includes("lunch")) {
                // If this record says Lunch, update the price. 
                // Using Math.max ensures that if we have a 0 price record and a >0 price record, we keep the cost.
                // However, usually it's just one record, so direct assignment is fine.
                // We use || 0 to be double sure it's numeric.
                if (foodPrice > 0) {
                    currentDay.lunchPrice = foodPrice;
                }
            }
            else if (type.includes("dinner")) {
                if (foodPrice > 0) {
                    currentDay.dinnerPrice = foodPrice;
                }
            }
            // NO 'ELSE': Unknown meal types (like 'TeaOnly') will NOT affect lunch/dinner prices
        });

        // 3. Convert Object back to Array and Calculate Totals
        attendanceRecords = Object.values(groupedData).map(day => {
            const teaWaterCost = day.teaWater ? TEA_WATER_PRICE : 0;
            // Ensure strictly numbers
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

        // Sort by date (oldest to newest)
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
            
            <!-- Tea/Water -->
            <td class="text-center">
                <i class="bi bi-${record.teaWater ? 'check-circle-fill status-icon present' : 'x-circle-fill status-icon absent'}"></i>
            </td>
            
            <!-- Lunch -->
            <td class="text-center">
                <i class="bi bi-${record.lunchPrice > 0 ? 'check-circle-fill status-icon present' : 'x-circle-fill status-icon absent'}"></i>
                ${record.lunchPrice > 0 ? `<br><small class="text-muted">Rs. ${record.lunchPrice}</small>` : ''}
            </td>
            
            <!-- Dinner -->
            <td class="text-center">
                <i class="bi bi-${record.dinnerPrice > 0 ? 'check-circle-fill status-icon present' : 'x-circle-fill status-icon absent'}"></i>
                ${record.dinnerPrice > 0 ? `<br><small class="text-muted">Rs. ${record.dinnerPrice}</small>` : ''}
            </td>
            
            <!-- Total Cost -->
            <td class="text-end">
                <span class="cost-display">Rs. ${record.totalCost}</span>
            </td>
            
            <!-- Actions -->
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

    // Calculate Total Meals (Lunch Count + Dinner Count)
    let totalMeals = 0;
    attendanceRecords.forEach(r => {
        if (r.lunchPrice > 0) totalMeals++;
        if (r.dinnerPrice > 0) totalMeals++;
    });

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
    // 1. Tea/Water
    const teaWaterDays = attendanceRecords.filter(r => r.teaWater).length;
    const teaWaterTotal = teaWaterDays * TEA_WATER_PRICE;

    // 2. Lunch
    const lunchCount = attendanceRecords.filter(r => r.lunchPrice > 0).length;
    const lunchTotal = attendanceRecords.reduce((sum, r) => sum + r.lunchPrice, 0);

    // 3. Dinner
    const dinnerCount = attendanceRecords.filter(r => r.dinnerPrice > 0).length;
    const dinnerTotal = attendanceRecords.reduce((sum, r) => sum + r.dinnerPrice, 0);

    // 4. Grand Total
    const grandTotal = teaWaterTotal + lunchTotal + dinnerTotal;

    // Update HTML
    setTextContent('teaWaterDays', teaWaterDays);
    setTextContent('teaWaterPrice', TEA_WATER_PRICE);
    setTextContent('teaWaterTotal', teaWaterTotal);

    setTextContent('lunchCount', lunchCount);
    setTextContent('lunchTotal', lunchTotal);

    setTextContent('dinnerCount', dinnerCount);
    setTextContent('dinnerTotal', dinnerTotal);

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

    // Find record by ID or by checking if that ID was grouped into a date
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

        // TODO: Create C# Controller Action to handle this if needed
        // await fetch('/Attendance/Verify', ...);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Update local record visually
        const record = attendanceRecords.find(r => r.attendanceId === selectedAttendanceId);
        if (record) {
            record.sentToAdmin = true;
        }

        const modalEl = document.getElementById('verifyModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

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