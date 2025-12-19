// ========================================
// Attendance Management System - Main JS
// ========================================

// Global Variables
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
    document.getElementById('selectedDateDisplay').textContent = formatDateDisplay(selectedDate);

    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    document.getElementById('todayDayBadge').textContent = dayName;

    displayMenu(dayName);
    updateMealDisplay();

    if (allMembers.length > 0) {
        loadAttendanceForDate();
    }
}

function updateMealDisplay() {
    document.getElementById('selectedMealDisplay').textContent = selectedMealType;
    document.getElementById('tableHeaderMeal').textContent = selectedMealType;
    document.getElementById('foodColumnHeader').textContent = `Food (${selectedMealType})`;
    document.getElementById('statMealType').textContent = selectedMealType;

    const mealPrice = calculateMealPrice(selectedMealType);
    document.getElementById('selectedMealPrice').textContent = mealPrice;
    document.getElementById('todayFoodPrice').textContent = mealPrice;
}

// ========================================
// 3. Event Listeners
// ========================================
function setupEventListeners() {
    document.getElementById('prevDateBtn').addEventListener('click', () => {
        selectedDate.setDate(selectedDate.getDate() - 1);
        document.getElementById('attendanceDate').value = formatDateForInput(selectedDate);
        updateDateDisplay();
    });

    document.getElementById('nextDateBtn').addEventListener('click', () => {
        selectedDate.setDate(selectedDate.getDate() + 1);
        document.getElementById('attendanceDate').value = formatDateForInput(selectedDate);
        updateDateDisplay();
    });

    document.getElementById('todayBtn').addEventListener('click', () => {
        selectedDate = new Date();
        document.getElementById('attendanceDate').value = formatDateForInput(selectedDate);
        updateDateDisplay();
    });

    document.getElementById('attendanceDate').addEventListener('change', (e) => {
        selectedDate = new Date(e.target.value + 'T00:00:00');
        updateDateDisplay();
    });

    document.querySelectorAll('input[name="mealType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            selectedMealType = e.target.value;
            updateMealDisplay();
            loadAttendanceForDate();
        });
    });

    document.getElementById('saveAllAttendanceBtn').addEventListener('click', saveAllAttendance);
    document.getElementById('markAllPresentBtn').addEventListener('click', markAllPresent);
    document.getElementById('searchMember').addEventListener('input', filterAttendance);
}

// ========================================
// 4. Data Loading
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
        const dateStr = formatDateForInput(selectedDate);
        const existingAttendance = []; // In real app: await fetch(...)

        attendanceData = allMembers.map(member => {
            const mId = member.userId || member.UserId;
            const mName = member.name || member.Name;
            const mUser = member.username || member.Username;
            const mDept = member.department || member.Department;

            const existing = existingAttendance.find(a => a.userId === mId && a.mealType === selectedMealType);

            // Determine initial status
            const isTeaWater = existing?.teaWater !== undefined ? existing.teaWater : true;
            const isFood = existing?.food || false;

            // --- PRICE CALCULATION LOGIC ---
            let initialPrice = 0;
            if (isFood) {
                // If Food is checked -> Full Meal Price
                initialPrice = calculateMealPrice(selectedMealType);
            } else if (isTeaWater) {
                // If Food Unchecked but Tea Checked -> Tea Price
                initialPrice = calculateTeaWaterCost();
            }
            // -------------------------------

            return {
                attendanceId: existing?.attendanceId || 0,
                userId: mId,
                name: mName,
                username: mUser,
                department: mDept,
                date: dateStr,
                mealType: selectedMealType,
                teaWater: isTeaWater,
                food: isFood,
                foodPrice: existing?.foodPrice || initialPrice
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

        let statusClass = 'status-absent';
        let statusText = 'Absent';

        if (attendance.food) {
            statusClass = 'status-present';
            statusText = 'Present';
        } else if (attendance.teaWater) {
            statusClass = 'status-partial';
            statusText = 'Tea Only';
        }

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <div class="member-info">
                    <div class="member-avatar">${attendance.name.charAt(0).toUpperCase()}</div>
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

    document.querySelectorAll('.tea-checkbox').forEach(cb => cb.addEventListener('change', handleTeaCheckboxChange));
    document.querySelectorAll('.food-checkbox').forEach(cb => cb.addEventListener('change', handleFoodCheckboxChange));
}

// ========================================
// 6. Checkbox Logic Handlers (PRICE LOGIC UPDATED)
// ========================================

// Handle Tea/Water Checkbox
function handleTeaCheckboxChange(e) {
    const userId = parseInt(e.target.dataset.userId);
    const isChecked = e.target.checked;
    const attendance = attendanceData.find(a => a.userId === userId);

    if (attendance) {
        attendance.teaWater = isChecked;

        if (!isChecked) {
            // Case: Tea Unchecked -> Remove Everything
            attendance.food = false;
            attendance.foodPrice = 0;

            // Visual update
            const row = e.target.closest('tr');
            row.querySelector('.food-checkbox').checked = false;
        } else {
            // Case: Tea Checked. 
            // If Food is NOT checked, we must apply Tea Price.
            if (!attendance.food) {
                attendance.foodPrice = calculateTeaWaterCost();
            }
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

        if (isChecked) {
            // Case: Food Checked -> Full Meal Price
            attendance.teaWater = true;
            attendance.foodPrice = calculateMealPrice(selectedMealType);

            // Visual update
            const row = e.target.closest('tr');
            row.querySelector('.tea-checkbox').checked = true;
        } else {
            // Case: Food Unchecked -> Fallback to Tea Price if Tea is checked
            if (attendance.teaWater) {
                attendance.foodPrice = calculateTeaWaterCost();
            } else {
                attendance.foodPrice = 0;
            }
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
// 7. Save to Database
// ========================================
async function saveAllAttendance() {
    const btn = document.getElementById('saveAllAttendanceBtn');

    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Saving...';

        // 1. Force strict Date format to fix 1/1/0001 error
        const dateToSend = formatDateForInput(selectedDate);

        // 2. Map data (Property names must match C# Class exactly)
        const attendanceRecords = attendanceData.map(a => ({
            AttendanceID: a.attendanceId,
            UserId: a.userId,
            AttendanceDate: dateToSend, // Matches C# "AttendanceDate"
            TeaWater: a.teaWater,
            Food: a.food,
            FoodPrice: a.foodPrice
        }));

        const response = await fetch('/Attendance/save_api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attendanceRecords)
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        showToast(`Attendance saved successfully for ${dateToSend}!`, 'success');

    } catch (err) {
        console.error('Error saving attendance:', err);
        showToast("Error saving attendance: " + err.message, "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Save All';
    }
}

// ========================================
// 8. Menu & Price Logic
// ========================================

function displayMenu(dayName) {
    const getDay = (i) => i.dayOfWeek || i.DayOfWeek;
    const getMeal = (i) => i.mealType || i.MealType;
    const getDish = (i) => i.dishName || i.DishName;
    const getPrice = (i) => i.price || i.Price;

    const itemsForToday = todayMenu.filter(m => getDay(m) === dayName);

    const lunchItems = itemsForToday.filter(m => getMeal(m) === 'Lunch');
    const dinnerItems = itemsForToday.filter(m => getMeal(m) === 'Dinner');

    const lunchList = document.getElementById('todayLunchList');
    const dinnerList = document.getElementById('todayDinnerList');

    const renderItems = (items, element, totalEl) => {
        if (items.length > 0) {
            element.innerHTML = items.map(item => `
                <li>
                    <span class="menu-item">${getDish(item)}</span>
                    <span class="menu-price">Rs. ${getPrice(item)}</span>
                </li>
            `).join('');
            const total = items.reduce((sum, item) => sum + getPrice(item), 0);
            document.getElementById(totalEl).textContent = `Rs. ${total}`;
        } else {
            element.innerHTML = '<li class="text-muted">No items available</li>';
            document.getElementById(totalEl).textContent = 'Rs. 0';
        }
    };

    renderItems(lunchItems, lunchList, 'lunchTotal');
    renderItems(dinnerItems, dinnerList, 'dinnerTotal');
}

// ----------------------------------------------------
// Helper: Calculate Tea/Water Cost Only
// ----------------------------------------------------
function calculateTeaWaterCost() {
    const currentDayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const getDay = (i) => i.dayOfWeek || i.DayOfWeek;
    const getDish = (i) => i.dishName || i.DishName;
    const getPrice = (i) => i.price || i.Price;

    // Filter for items with 'tea', 'chai', or 'water' in the name for TODAY
    const teaWaterItems = todayMenu.filter(m => {
        const dayMatch = getDay(m) === currentDayName;
        const name = (getDish(m) || "").toLowerCase();
        // Adjust keywords based on your DB dish names
        return dayMatch && (name.includes('tea') || name.includes('chai') || name.includes('water'));
    });

    return teaWaterItems.reduce((sum, item) => sum + getPrice(item), 0);
}

function calculateMealPrice(mealType) {
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