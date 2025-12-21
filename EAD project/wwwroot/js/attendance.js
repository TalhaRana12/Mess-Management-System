// ========================================
// Attendance Management System - Main JS
// ========================================

// Global Variables
let attendanceData = [];
let selectedDate = new Date();
let selectedMealType = 'Lunch'; // Default

// FIX 1: Define the fixed price constant here
const TEA_WATER_PRICE = 50;

// ========================================
// 1. Initialize System
// ========================================
document.addEventListener('DOMContentLoaded', function () {
    if (typeof allMembers === 'undefined') allMembers = [];
    if (typeof todayMenu === 'undefined') todayMenu = [];
    if (typeof attendances === 'undefined') attendances = [];

    initializeDatePicker();
    setupEventListeners();

    const currentDay = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    displayMenu(currentDay);
    loadMembers();

    // Sidebar Logic
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            document.querySelector('.sidebar').classList.toggle('show');
            document.getElementById('sidebarOverlay').classList.toggle('show');
        });
    }
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function () {
            document.querySelector('.sidebar').classList.remove('show');
            this.classList.remove('show');
        });
    }
});

// ========================================
// 2. Date & Display Logic
// ========================================
function initializeDatePicker() {
    const dateInput = document.getElementById('attendanceDate');
    dateInput.value = formatDateForInput(selectedDate);
    updateDateDisplay();
}

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
            console.warn("No members found.");
            showToast('No members found', 'warning');
        }
        loadAttendanceForDate();
    } catch (error) {
        console.error('Error processing members:', error);
        showToast('Failed to load members', 'error');
        showLoading(false);
    }
}


//async function loadAttendanceForDate() {
//    try {
//        const dateStr = formatDateForInput(selectedDate);

//       const activeMembers = allMembers.filter(m => m.isActive === true || m.IsActive === true);

//        // Now map only the active members
//        attendanceData = activeMembers.map(member => {
//            const mId = member.userId || member.UserId;
//            const mName = member.name || member.Name;
//            const mUser = member.username || member.Username;
//            const mDept = member.department || member.Department;

//            const existingRecord = attendances.find(a => {
//                const dbDate = a.attendanceDate || a.AttendanceDate;
//                const dbUserId = a.userId || a.UserId;
//                const dbMeal = a.mealType || a.MealType;
//                const dbDateStr = dbDate ? dbDate.substring(0, 10) : "";

//                return dbUserId === mId && dbDateStr === dateStr && dbMeal === selectedMealType;
//            });

//            const attId = existingRecord ? (existingRecord.attendanceID || existingRecord.AttendanceID) : 0;

//            const isTeaWater = existingRecord
//                ? (existingRecord.teaWater !== undefined ? existingRecord.teaWater : existingRecord.TeaWater)
//                : true;

//            const isFood = existingRecord
//                ? (existingRecord.food !== undefined ? existingRecord.food : existingRecord.Food)
//                : false;

//            // 3. Calculate Price Logic
//            let finalPrice = 0;
//            if (existingRecord) {
//                finalPrice = existingRecord.foodPrice || existingRecord.FoodPrice || 0;
//            } else {
//                if (isFood) {
//                    finalPrice = calculateMealPrice(selectedMealType);
//                } else if (isTeaWater) {
//                    finalPrice = calculateTeaWaterCost();
//                }
//            }

//            return {
//                attendanceId: attId,
//                userId: mId,
//                name: mName,
//                username: mUser,
//                department: mDept,
//                date: dateStr,
//                mealType: selectedMealType,
//                teaWater: isTeaWater,
//                food: isFood,
//                foodPrice: finalPrice
//            };
//        });

//        renderAttendanceTable();
//        updateStatistics();
//        showLoading(false);
//    } catch (error) {
//        console.error('Error loading attendance:', error);
//        showToast('Failed to load attendance', 'error');
//        showLoading(false);
//    }
//}
async function loadAttendanceForDate() {
    try {
        const dateStr = formatDateForInput(selectedDate);
        const activeMembers = allMembers.filter(m => m.isActive === true || m.IsActive === true);

        attendanceData = activeMembers.map(member => {
            const mId = member.userId || member.UserId;
            const mName = member.name || member.Name;
            const mUser = member.username || member.Username;
            const mDept = member.department || member.Department;

            const existingRecord = attendances.find(a => {
                const dbDate = a.attendanceDate || a.AttendanceDate;
                const dbUserId = a.userId || a.UserId;
                const dbMeal = a.mealType || a.MealType;
                const dbDateStr = dbDate ? dbDate.substring(0, 10) : "";

                return dbUserId === mId && dbDateStr === dateStr && dbMeal === selectedMealType;
            });

            const attId = existingRecord ? (existingRecord.attendanceID || existingRecord.AttendanceID) : 0;

            const isTeaWater = existingRecord
                ? (existingRecord.teaWater !== undefined ? existingRecord.teaWater : existingRecord.TeaWater)
                : true;

            const isFood = existingRecord
                ? (existingRecord.food !== undefined ? existingRecord.food : existingRecord.Food)
                : false;

            // --- FIXED LOGIC START ---
            let finalPrice = 0;
            if (existingRecord) {
                finalPrice = existingRecord.foodPrice || existingRecord.FoodPrice || 0;
            } else {
                if (isFood) {
                    finalPrice = calculateMealPrice(selectedMealType);
                } else if (isTeaWater) {
                    // FIX: Apply Tea Price if Food is false but Tea is true
                    finalPrice = TEA_WATER_PRICE;
                } else {
                    finalPrice = 0;
                }
            }
            // --- FIXED LOGIC END ---

            return {
                attendanceId: attId,
                userId: mId,
                name: mName,
                username: mUser,
                department: mDept,
                date: dateStr,
                mealType: selectedMealType,
                teaWater: isTeaWater,
                food: isFood,
                foodPrice: finalPrice
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
//========================================
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
// 6. Checkbox Logic
// ========================================
//function handleTeaCheckboxChange(e) {
//    const userId = parseInt(e.target.dataset.userId);
//    const isChecked = e.target.checked;
//    const attendance = attendanceData.find(a => a.userId === userId);

//    if (attendance) {
//        attendance.teaWater = isChecked;

//        if (!isChecked) {
//            // Unchecking Tea removes Food too
//            attendance.food = false;
//            attendance.foodPrice = 0;
//            e.target.closest('tr').querySelector('.food-checkbox').checked = false;
//        } else {
//            // Checking Tea (if Food not selected) sets price to 50
//            if (!attendance.food) attendance.foodPrice = calculateTeaWaterCost();
//        }
//        updateRowStatus(e.target.closest('tr'), attendance);
//        updateStatistics();
//    }
//}
function handleTeaCheckboxChange(e) {
    const userId = parseInt(e.target.dataset.userId);
    const isChecked = e.target.checked;
    const attendance = attendanceData.find(a => a.userId === userId);

    if (attendance) {
        attendance.teaWater = isChecked;

        if (!isChecked) {
            // Unchecking Tea removes Food too
            attendance.food = false;
            attendance.foodPrice = 0;
            e.target.closest('tr').querySelector('.food-checkbox').checked = false;
        } else {
            // FIX: If Tea is checked and Food is NOT, set price to Tea Price (50)
            if (!attendance.food) {
                attendance.foodPrice = TEA_WATER_PRICE;
            }
        }
        updateRowStatus(e.target.closest('tr'), attendance);
        updateStatistics();
    }
}
//function handleFoodCheckboxChange(e) {
//    const userId = parseInt(e.target.dataset.userId);
//    const isChecked = e.target.checked;
//    const attendance = attendanceData.find(a => a.userId === userId);

//    if (attendance) {
//        attendance.food = isChecked;

//        if (isChecked) {
//            // Food selected: Price = Meal Price
//            attendance.teaWater = true;
//            attendance.foodPrice = calculateMealPrice(selectedMealType);
//            e.target.closest('tr').querySelector('.tea-checkbox').checked = true;
//        } else {
//            // Food unselected: Fallback to Tea Price (50)
//            attendance.foodPrice = attendance.teaWater ? calculateTeaWaterCost() : 0;
//        }
//        updateRowStatus(e.target.closest('tr'), attendance);
//        updateStatistics();
//    }
//}
function handleFoodCheckboxChange(e) {
    const userId = parseInt(e.target.dataset.userId);
    const isChecked = e.target.checked;
    const attendance = attendanceData.find(a => a.userId === userId);

    if (attendance) {
        attendance.food = isChecked;

        if (isChecked) {
            // Food selected: Price = Meal Price
            attendance.teaWater = true;
            attendance.foodPrice = calculateMealPrice(selectedMealType);
            e.target.closest('tr').querySelector('.tea-checkbox').checked = true;
        } else {
            // FIX: Food unselected -> Falls back to Tea Only
            // Check if Tea is still active (it usually is)
            if (attendance.teaWater) {
                attendance.foodPrice = TEA_WATER_PRICE; // Set to 50
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

        const dateToSend = formatDateForInput(selectedDate);

        const attendanceRecords = attendanceData.map(a => ({
            AttendanceID: a.attendanceId,
            UserId: a.userId,
            AttendanceDate: dateToSend,
            MealType: selectedMealType,
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

        attendanceRecords.forEach(savedRecord => {
            const existingIdx = attendances.findIndex(att =>
                (att.userId || att.UserId) === savedRecord.UserId &&
                (att.attendanceDate || att.AttendanceDate).substring(0, 10) === savedRecord.AttendanceDate &&
                (att.mealType || att.MealType) === savedRecord.MealType
            );

            if (existingIdx > -1) {
                attendances[existingIdx].teaWater = savedRecord.TeaWater;
                attendances[existingIdx].food = savedRecord.Food;
                attendances[existingIdx].foodPrice = savedRecord.FoodPrice;
            } else {
                attendances.push({
                    userId: savedRecord.UserId,
                    attendanceDate: savedRecord.AttendanceDate,
                    mealType: savedRecord.MealType,
                    teaWater: savedRecord.TeaWater,
                    food: savedRecord.Food,
                    foodPrice: savedRecord.FoodPrice,
                    attendanceID: 0
                });
            }
        });

        showToast(`Attendance saved for ${selectedMealType} on ${dateToSend}!`, 'success');

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

// FIX 2: Updated function to return constant 50
// This avoids summing distinct items (like Tea + Water = 60)
function calculateTeaWaterCost() {
    return TEA_WATER_PRICE; // Returns 50
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
// 9. UI Helpers
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
    showToast(`All marked present for ${selectedMealType}`, 'success');
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
    if (loadingState) loadingState.style.display = show ? 'block' : 'none';

    const tbody = document.getElementById('attendanceTableBody');
    if (show && tbody) tbody.innerHTML = '';
}

function showEmptyState(show) {
    const es = document.getElementById('emptyState');
    if (es) es.style.display = show ? 'block' : 'none';
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
    toast.innerHTML = `<div class="toast-body p-3"><span><i class="bi bi-info-circle me-2"></i>${message}</span></div>`;
    toastContainer.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}