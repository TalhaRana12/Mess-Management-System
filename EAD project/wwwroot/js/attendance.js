// ========================================
// Attendance Management System - Main JS
// ========================================

// Global Variables
// NOTE: 'allMembers' and 'todayMenu' are populated via CSHTML (Razor). 
// We do not redeclare them here to prevent "Identifier already declared" errors.
let attendanceData = [];
let selectedDate = new Date();
let selectedMealType = 'Lunch';

// ========================================
// 1. Initialize System
// ========================================
document.addEventListener('DOMContentLoaded', function () {
    // Safety check: Ensure Razor data exists
    if (typeof allMembers === 'undefined') allMembers = [];
    if (typeof todayMenu === 'undefined') todayMenu = [];

    initializeDatePicker();
    setupEventListeners();

    // Initial Load
    // Get current day name to filter menu immediately
    const currentDay = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    displayMenu(currentDay);

    loadMembers();

    // Sidebar toggle (Mobile Support)
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
});

// ========================================
// 2. Date Picker & Formatting
// ========================================
function initializeDatePicker() {
    const dateInput = document.getElementById('attendanceDate');
    // Set input value to ISO format (YYYY-MM-DD)
    dateInput.value = formatDateForInput(selectedDate);
    updateDateDisplay();
}

// CRITICAL: This fixes the 1/1/0001 bug by ensuring strict YYYY-MM-DD format
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateDisplay(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function updateDateDisplay() {
    // 1. Update UI Text
    document.getElementById('selectedDateDisplay').textContent = formatDateDisplay(selectedDate);

    // 2. Update Day Badge
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    document.getElementById('todayDayBadge').textContent = dayName;

    // 3. Update Menu & Prices for this specific day
    displayMenu(dayName);
    updateMealDisplay();

    // 4. Reload Attendance Table
    if (allMembers.length > 0) {
        loadAttendanceForDate();
    }
}

function updateMealDisplay() {
    // Update Labels
    document.getElementById('selectedMealDisplay').textContent = selectedMealType;
    document.getElementById('tableHeaderMeal').textContent = selectedMealType;
    document.getElementById('foodColumnHeader').textContent = `Food (${selectedMealType})`;
    document.getElementById('statMealType').textContent = selectedMealType;

    // Update Price based on Day & Meal Type
    const mealPrice = calculateMealPrice(selectedMealType);
    document.getElementById('selectedMealPrice').textContent = mealPrice;
    document.getElementById('todayFoodPrice').textContent = mealPrice;
}

// ========================================
// 3. Event Listeners
// ========================================
function setupEventListeners() {
    // Previous Day
    document.getElementById('prevDateBtn').addEventListener('click', () => {
        selectedDate.setDate(selectedDate.getDate() - 1);
        document.getElementById('attendanceDate').value = formatDateForInput(selectedDate);
        updateDateDisplay();
    });

    // Next Day
    document.getElementById('nextDateBtn').addEventListener('click', () => {
        selectedDate.setDate(selectedDate.getDate() + 1);
        document.getElementById('attendanceDate').value = formatDateForInput(selectedDate);
        updateDateDisplay();
    });

    // Today Button
    document.getElementById('todayBtn').addEventListener('click', () => {
        selectedDate = new Date();
        document.getElementById('attendanceDate').value = formatDateForInput(selectedDate);
        updateDateDisplay();
    });

    // Date Input Change
    document.getElementById('attendanceDate').addEventListener('change', (e) => {
        // Force time to T00:00:00 to prevent timezone shifts
        selectedDate = new Date(e.target.value + 'T00:00:00');
        updateDateDisplay();
    });

    // Meal Type Radio Buttons
    document.querySelectorAll('input[name="mealType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            selectedMealType = e.target.value;
            updateMealDisplay();
            loadAttendanceForDate();
        });
    });

    // Action Buttons
    document.getElementById('saveAllAttendanceBtn').addEventListener('click', saveAllAttendance);
    document.getElementById('markAllPresentBtn').addEventListener('click', markAllPresent);
    document.getElementById('searchMember').addEventListener('input', filterAttendance);
}

// ========================================
// 4. Data Loading (Members & Attendance)
// ========================================
async function loadMembers() {
    showLoading(true);
    try {
        if (!allMembers || allMembers.length === 0) {
            console.warn("No members found in Model.");
            showToast('No members found', 'warning');
        }
        loadAttendanceForDate();
    } catch (error) {
        console.error('Error processing members:', error);
        showToast('Failed to load members', 'error');
        showLoading(false);
    }
}

async function loadAttendanceForDate() {
    try {
        // String format for data consistency
        const dateStr = formatDateForInput(selectedDate);

        // NOTE: In a real scenario, you would fetch existing attendance for this date here.
        // const existingAttendance = await fetch(...).json();
        const existingAttendance = [];

        attendanceData = allMembers.map(member => {
            // Normalize Property Names (Case Insensitive handling)
            const mId = member.userId || member.UserId;
            const mName = member.name || member.Name;
            const mUser = member.username || member.Username;
            const mDept = member.department || member.Department;

            // Check if record exists in fetched data
            const existing = existingAttendance.find(a => a.userId === mId && a.mealType === selectedMealType);

            return {
                attendanceId: existing?.attendanceId || 0,
                userId: mId,
                name: mName,
                username: mUser,
                department: mDept,
                date: dateStr,
                mealType: selectedMealType,
                // Default teaWater to true for easier workflow
                teaWater: existing?.teaWater !== undefined ? existing.teaWater : true,
                food: existing?.food || false,
                foodPrice: existing?.foodPrice || 0
            };
        });

        renderAttendanceTable();
        updateStatistics();
        showLoading(false);
    } catch (error) {
        console.error('Error loading attendance:', error);
        showToast('Failed to load attendance', 'error');
        showLoading(false);
    }
}

// ========================================
// 5. Render Table
// ========================================
function renderAttendanceTable() {
    const tbody = document.getElementById('attendanceTableBody');
    tbody.innerHTML = '';

    if (attendanceData.length === 0) {
        showEmptyState(true);
        return;
    }

    showEmptyState(false);

    attendanceData.forEach((attendance, index) => {
        const row = document.createElement('tr');

        // Initial Status Calculation
        let statusClass = 'status-absent';
        let statusText = 'Absent';

        if (attendance.food) {
            statusClass = 'status-present';
            statusText = 'Present';
        } else if (attendance.teaWater) {
            statusClass = 'status-partial';
            statusText = 'Tea/Water Only';
        }

        // HTML Structure
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <div class="member-info">
                    <div class="member-avatar">
                        ${attendance.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="member-details">
                        <div class="member-name">${attendance.name}</div>
                        <div class="member-username">@${attendance.username}</div>
                    </div>
                </div>
            </td>
            <td>${attendance.username}</td>
            <td>${attendance.department}</td>
            <td class="text-center">
                <div class="custom-checkbox-wrapper">
                    <input type="checkbox" class="custom-checkbox tea-checkbox" 
                           data-user-id="${attendance.userId}" 
                           ${attendance.teaWater ? 'checked' : ''}>
                </div>
            </td>
            <td class="text-center">
                <div class="custom-checkbox-wrapper">
                    <input type="checkbox" class="custom-checkbox food-checkbox" 
                           data-user-id="${attendance.userId}" 
                           ${attendance.food ? 'checked' : ''}>
                </div>
            </td>
            <td class="text-center">
                <span class="status-badge ${statusClass}">${statusText}</span>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Attach Listeners
    document.querySelectorAll('.tea-checkbox').forEach(cb => cb.addEventListener('change', handleTeaCheckboxChange));
    document.querySelectorAll('.food-checkbox').forEach(cb => cb.addEventListener('change', handleFoodCheckboxChange));
}

// ========================================
// 6. Checkbox Logic Handlers
// ========================================

// Handle Tea/Water Checkbox
function handleTeaCheckboxChange(e) {
    const userId = parseInt(e.target.dataset.userId);
    const isChecked = e.target.checked;
    const attendance = attendanceData.find(a => a.userId === userId);

    if (attendance) {
        attendance.teaWater = isChecked;

        // LOGIC: Unchecking Tea removes Food automatically
        if (!isChecked) {
            attendance.food = false;
            attendance.foodPrice = 0;
            const row = e.target.closest('tr');
            row.querySelector('.food-checkbox').checked = false;
        }

        updateRowStatus(e.target.closest('tr'), attendance);
        updateStatistics();
    }
}

// Handle Food Checkbox
function handleFoodCheckboxChange(e) {
    const userId = parseInt(e.target.dataset.userId);
    const isChecked = e.target.checked;
    const attendance = attendanceData.find(a => a.userId === userId);

    if (attendance) {
        attendance.food = isChecked;

        // LOGIC: Checking Food forces Tea/Water to be checked
        if (isChecked) {
            attendance.teaWater = true;
            attendance.foodPrice = calculateMealPrice(selectedMealType);
            const row = e.target.closest('tr');
            row.querySelector('.tea-checkbox').checked = true;
        } else {
            attendance.foodPrice = 0;
        }

        updateRowStatus(e.target.closest('tr'), attendance);
        updateStatistics();
    }
}

function updateRowStatus(row, attendance) {
    const statusBadge = row.querySelector('.status-badge');
    let statusClass = 'status-absent';
    let statusText = 'Absent';

    if (attendance.food) {
        statusClass = 'status-present';
        statusText = 'Present';
    } else if (attendance.teaWater) {
        statusClass = 'status-partial';
        statusText = 'Tea Only';
    }

    statusBadge.className = `status-badge ${statusClass}`;
    statusBadge.textContent = statusText;
}

// ========================================
// 7. Save to Database (FIXED PROPERTY NAME & DATE)
// ========================================
async function saveAllAttendance() {
    const btn = document.getElementById('saveAllAttendanceBtn');

    try {
        // 1. Loading State
        btn.disabled = true;
        btn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Saving...';

        // 2. Format Date Strictly (Fixes 1/1/0001 bug)
        const dateToSend = formatDateForInput(selectedDate);

        // 3. Map Data to C# Entity Structure
        const attendanceRecords = attendanceData.map(a => ({
            AttendanceID: a.attendanceId, // Int
            UserId: a.userId,             // Int

            // CRITICAL FIX: Renamed from 'Date' to 'AttendanceDate' to match C# model
            AttendanceDate: dateToSend,

            TeaWater: a.teaWater,         // Bool
            Food: a.food,                 // Bool
            FoodPrice: a.foodPrice        // Decimal
        }));

        // 4. API Call
        const response = await fetch('/Attendance/save_api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attendanceRecords)
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        // 5. Success
        showToast(`Attendance saved successfully for ${dateToSend}!`, 'success');

    } catch (err) {
        console.error('Error saving attendance:', err);
        showToast("Error saving attendance: " + err.message, "error");
    } finally {
        // 6. Reset Button
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Save All';
    }
}

// ========================================
// 8. Menu & Price Logic (Day Filtered)
// ========================================

function displayMenu(dayName) {
    // Helper accessors
    const getDay = (i) => i.dayOfWeek || i.DayOfWeek;
    const getMeal = (i) => i.mealType || i.MealType;
    const getDish = (i) => i.dishName || i.DishName;
    const getPrice = (i) => i.price || i.Price;

    // Filter Global Menu by Day Name
    const itemsForToday = todayMenu.filter(m => getDay(m) === dayName);

    const lunchItems = itemsForToday.filter(m => getMeal(m) === 'Lunch');
    const dinnerItems = itemsForToday.filter(m => getMeal(m) === 'Dinner');

    const lunchList = document.getElementById('todayLunchList');
    const dinnerList = document.getElementById('todayDinnerList');

    // Render Lunch
    if (lunchItems.length > 0) {
        lunchList.innerHTML = lunchItems.map(item => `
            <li>
                <span class="menu-item">${getDish(item)}</span>
                <span class="menu-price">Rs. ${getPrice(item)}</span>
            </li>
        `).join('');
        const lunchTotal = lunchItems.reduce((sum, item) => sum + getPrice(item), 0);
        document.getElementById('lunchTotal').textContent = `Rs. ${lunchTotal}`;
    } else {
        lunchList.innerHTML = '<li class="text-muted">No items available</li>';
        document.getElementById('lunchTotal').textContent = 'Rs. 0';
    }

    // Render Dinner
    if (dinnerItems.length > 0) {
        dinnerList.innerHTML = dinnerItems.map(item => `
            <li>
                <span class="menu-item">${getDish(item)}</span>
                <span class="menu-price">Rs. ${getPrice(item)}</span>
            </li>
        `).join('');
        const dinnerTotal = dinnerItems.reduce((sum, item) => sum + getPrice(item), 0);
        document.getElementById('dinnerTotal').textContent = `Rs. ${dinnerTotal}`;
    } else {
        dinnerList.innerHTML = '<li class="text-muted">No items available</li>';
        document.getElementById('dinnerTotal').textContent = 'Rs. 0';
    }
}

function calculateMealPrice(mealType) {
    // Recalculate based on current selected day
    const currentDayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

    const getDay = (i) => i.dayOfWeek || i.DayOfWeek;
    const getMeal = (i) => i.mealType || i.MealType;
    const getPrice = (i) => i.price || i.Price;

    const mealItems = todayMenu.filter(m => getDay(m) === currentDayName && getMeal(m) === mealType);
    return mealItems.reduce((sum, item) => sum + getPrice(item), 0);
}

// ========================================
// 9. Helpers & Utilities
// ========================================

function markAllPresent() {
    const mealPrice = calculateMealPrice(selectedMealType);
    attendanceData.forEach(attendance => {
        attendance.teaWater = true;
        attendance.food = true;
        attendance.foodPrice = mealPrice;
    });
    renderAttendanceTable();
    updateStatistics();
    showToast(`All members marked present`, 'success');
}

function filterAttendance() {
    const searchTerm = document.getElementById('searchMember').value.toLowerCase();
    const rows = document.querySelectorAll('#attendanceTableBody tr');
    let visibleCount = 0;

    rows.forEach(row => {
        const name = row.querySelector('.member-name').textContent.toLowerCase();
        const username = row.querySelector('.member-username').textContent.toLowerCase();
        const department = row.cells[3].textContent.toLowerCase();

        if (name.includes(searchTerm) || username.includes(searchTerm) || department.includes(searchTerm)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    showEmptyState(visibleCount === 0);
}

function updateStatistics() {
    document.getElementById('totalMembers').textContent = attendanceData.length;
    document.getElementById('teaWaterCount').textContent = attendanceData.filter(a => a.teaWater).length;
    document.getElementById('foodCount').textContent = attendanceData.filter(a => a.food).length;
    document.getElementById('absentCount').textContent = attendanceData.filter(a => !a.food).length;
}

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
    setTimeout(() => { toast.remove(); }, 3000);
}