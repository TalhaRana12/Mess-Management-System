//// Global Variables
//// NOTE: 'allMembers' and 'todayMenu' are populated via CSHTML.
//// We do not redeclare them here to avoid syntax errors.
//let attendanceData = [];
//let selectedDate = new Date();
//let selectedMealType = 'Lunch';

//// ========================================
//// Initialize
//// ========================================
//document.addEventListener('DOMContentLoaded', function () {
//    // Ensure data from CSHTML exists, otherwise default to empty arrays to prevent crashes
//    if (typeof allMembers === 'undefined') allMembers = [];
//    if (typeof todayMenu === 'undefined') todayMenu = [];

//    initializeDatePicker();
//    setupEventListeners();

//    // Use the data passed from CSHTML
//    displayMenu();
//    loadMembers();

//    // Sidebar toggle for mobile
//    const sidebarToggle = document.getElementById('sidebarToggle');
//    const sidebar = document.querySelector('.sidebar');
//    const sidebarOverlay = document.getElementById('sidebarOverlay');

//    if (sidebarToggle) {
//        sidebarToggle.addEventListener('click', function () {
//            sidebar.classList.toggle('show');
//            sidebarOverlay.classList.toggle('show');
//        });
//    }

//    if (sidebarOverlay) {
//        sidebarOverlay.addEventListener('click', function () {
//            sidebar.classList.remove('show');
//            sidebarOverlay.classList.remove('show');
//        });
//    }
//});

//// ========================================
//// Date Picker Functions
//// ========================================
//function initializeDatePicker() {
//    const dateInput = document.getElementById('attendanceDate');

//    // Set today's date
//    dateInput.value = formatDateForInput(selectedDate);
//    updateDateDisplay();
//}

//function formatDateForInput(date) {
//    const year = date.getFullYear();
//    const month = String(date.getMonth() + 1).padStart(2, '0');
//    const day = String(date.getDate()).padStart(2, '0');
//    return `${year}-${month}-${day}`;
//}

//function formatDateDisplay(date) {
//    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
//    return date.toLocaleDateString('en-US', options);
//}

//function updateDateDisplay() {
//    const dateDisplay = document.getElementById('selectedDateDisplay');
//    dateDisplay.textContent = formatDateDisplay(selectedDate);

//    // Update day badge in menu
//    const dayBadge = document.getElementById('todayDayBadge');
//    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
//    dayBadge.textContent = dayName;

//    // Update meal display
//    updateMealDisplay();

//    // Reload attendance for new date and meal
//    // Only load attendance if members are loaded
//    if (allMembers.length > 0) {
//        loadAttendanceForDate();
//    }

//    // Logic to switch menu if date changes
//    loadMenuForDate(dayName);
//}

//function updateMealDisplay() {
//    // Update all meal type displays
//    document.getElementById('selectedMealDisplay').textContent = selectedMealType;
//    document.getElementById('tableHeaderMeal').textContent = selectedMealType;
//    document.getElementById('foodColumnHeader').textContent = `Food (${selectedMealType})`;
//    document.getElementById('statMealType').textContent = selectedMealType;

//    // Update meal price
//    const mealPrice = calculateMealPrice(selectedMealType);
//    document.getElementById('selectedMealPrice').textContent = mealPrice;
//    document.getElementById('todayFoodPrice').textContent = mealPrice;
//}

//// ========================================
//// Event Listeners
//// ========================================
//function setupEventListeners() {
//    // Date navigation
//    document.getElementById('prevDateBtn').addEventListener('click', () => {
//        selectedDate.setDate(selectedDate.getDate() - 1);
//        document.getElementById('attendanceDate').value = formatDateForInput(selectedDate);
//        updateDateDisplay();
//    });

//    document.getElementById('nextDateBtn').addEventListener('click', () => {
//        selectedDate.setDate(selectedDate.getDate() + 1);
//        document.getElementById('attendanceDate').value = formatDateForInput(selectedDate);
//        updateDateDisplay();
//    });

//    document.getElementById('todayBtn').addEventListener('click', () => {
//        selectedDate = new Date();
//        document.getElementById('attendanceDate').value = formatDateForInput(selectedDate);
//        updateDateDisplay();
//    });

//    document.getElementById('attendanceDate').addEventListener('change', (e) => {
//        selectedDate = new Date(e.target.value + 'T00:00:00');
//        updateDateDisplay();
//    });

//    // Meal type selection
//    document.querySelectorAll('input[name="mealType"]').forEach(radio => {
//        radio.addEventListener('change', (e) => {
//            selectedMealType = e.target.value;
//            updateMealDisplay();
//            loadAttendanceForDate();
//        });
//    });

//    // Save attendance
//    document.getElementById('saveAllAttendanceBtn').addEventListener('click', saveAllAttendance);

//    // Mark all present
//    document.getElementById('markAllPresentBtn').addEventListener('click', markAllPresent);

//    // Search
//    document.getElementById('searchMember').addEventListener('input', filterAttendance);
//}

//// ========================================
//// Load Members
//// ========================================
//async function loadMembers() {
//    showLoading(true);

//    try {
//        // We use 'allMembers' directly from CSHTML Json.Serialize
//        if (!allMembers || allMembers.length === 0) {
//            console.warn("No members found in Model.");
//            showToast('No members found', 'warning');
//        }

//        // Proceed to generate the attendance table based on these members
//        loadAttendanceForDate();

//    } catch (error) {
//        console.error('Error processing members:', error);
//        showToast('Failed to load members', 'error');
//        showLoading(false);
//    }
//}

//// ========================================
//// Load Attendance for Selected Date
//// ========================================
//async function loadAttendanceForDate() {
//    try {
//        const dateStr = formatDateForInput(selectedDate);

//        // NOTE: In a real C# implementation, you might want to fetch
//        // existing attendance for this specific date via API here.
//        // For now, we simulate existing attendance.

//        // const response = await fetch(`/api/Attendance/GetAttendanceByDate?date=${dateStr}&mealType=${selectedMealType}`);
//        // const existingAttendance = await response.json();
//        const existingAttendance = [];

//        // Create attendance array merging 'allMembers' (from CSHTML) with existing records
//        attendanceData = allMembers.map(member => {
//            // Ensure property names match your C# model (camelCase is default for Json.Serialize)
//            const mId = member.userId || member.UserId;
//            const mName = member.name || member.Name;
//            const mUser = member.username || member.Username;
//            const mDept = member.department || member.Department;

//            const existing = existingAttendance.find(a => a.userId === mId && a.mealType === selectedMealType);

//            return {
//                attendanceId: existing?.attendanceId || 0,
//                userId: mId,
//                name: mName,
//                username: mUser,
//                department: mDept,
//                date: dateStr,
//                mealType: selectedMealType,
//                teaWater: existing?.teaWater !== undefined ? existing.teaWater : true,
//                food: existing?.food || false,
//                foodPrice: existing?.foodPrice || 0
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

//// ========================================
//// Render Attendance Table
//// ========================================
//function renderAttendanceTable() {
//    const tbody = document.getElementById('attendanceTableBody');
//    tbody.innerHTML = '';

//    if (attendanceData.length === 0) {
//        showEmptyState(true);
//        return;
//    }

//    showEmptyState(false);

//    attendanceData.forEach((attendance, index) => {
//        const row = document.createElement('tr');

//        // Determine status - Person is absent if food is not checked
//        let statusClass = 'status-absent';
//        let statusText = 'Absent';

//        if (attendance.food && attendance.teaWater) {
//            statusClass = 'status-present';
//            statusText = 'Present';
//        } else if (!attendance.food && attendance.teaWater) {
//            statusClass = 'status-partial';
//            statusText = 'Tea Only';
//        } else {
//            statusClass = 'status-absent';
//            statusText = 'Absent';
//        }

//        row.innerHTML = `
//            <td>${index + 1}</td>
//            <td>
//                <div class="member-info">
//                    <div class="member-avatar">
//                        ${attendance.name.charAt(0).toUpperCase()}
//                    </div>
//                    <div class="member-details">
//                        <div class="member-name">${attendance.name}</div>
//                        <div class="member-username">@${attendance.username}</div>
//                    </div>
//                </div>
//            </td>
//            <td>${attendance.username}</td>
//            <td>${attendance.department}</td>
//            <td class="text-center">
//                <div class="custom-checkbox-wrapper">
//                    <input type="checkbox"
//                           class="custom-checkbox tea-checkbox"
//                           data-user-id="${attendance.userId}"
//                           ${attendance.teaWater ? 'checked' : ''}>
//                </div>
//            </td>
//            <td class="text-center">
//                <div class="custom-checkbox-wrapper">
//                    <input type="checkbox"
//                           class="custom-checkbox food-checkbox"
//                           data-user-id="${attendance.userId}"
//                           ${attendance.food ? 'checked' : ''}>
//                </div>
//            </td>
//            <td class="text-center">
//                <span class="status-badge ${statusClass}">${statusText}</span>
//            </td>
//        `;

//        tbody.appendChild(row);
//    });

//    // Add event listeners to checkboxes
//    document.querySelectorAll('.tea-checkbox').forEach(checkbox => {
//        checkbox.addEventListener('change', handleTeaCheckboxChange);
//    });

//    document.querySelectorAll('.food-checkbox').forEach(checkbox => {
//        checkbox.addEventListener('change', handleFoodCheckboxChange);
//    });
//}

//// ========================================
//// Checkbox Change Handlers
//// ========================================
//function handleTeaCheckboxChange(e) {
//    const userId = parseInt(e.target.dataset.userId);
//    const isChecked = e.target.checked;

//    const attendance = attendanceData.find(a => a.userId === userId);
//    if (attendance) {
//        attendance.teaWater = isChecked;

//        // If unchecking tea/water, also uncheck food
//        if (!isChecked) {
//            attendance.food = false;
//            attendance.foodPrice = 0;
//            const foodCheckbox = e.target.closest('tr').querySelector('.food-checkbox');
//            foodCheckbox.checked = false;
//        }

//        updateRowStatus(e.target.closest('tr'), attendance);
//        updateStatistics();
//    }
//}

//function handleFoodCheckboxChange(e) {
//    const userId = parseInt(e.target.dataset.userId);
//    const isChecked = e.target.checked;

//    const attendance = attendanceData.find(a => a.userId === userId);
//    if (attendance) {
//        // If checking food, ensure tea/water is also checked
//        if (isChecked && !attendance.teaWater) {
//            attendance.teaWater = true;
//            const teaCheckbox = e.target.closest('tr').querySelector('.tea-checkbox');
//            teaCheckbox.checked = true;
//        }

//        attendance.food = isChecked;
//        // Automatically add the price from selected meal type
//        attendance.foodPrice = isChecked ? calculateMealPrice(selectedMealType) : 0;

//        updateRowStatus(e.target.closest('tr'), attendance);
//        updateStatistics();
//    }
//}

//function updateRowStatus(row, attendance) {
//    const statusBadge = row.querySelector('.status-badge');

//    // Person is absent if food is not checked
//    let statusClass = 'status-absent';
//    let statusText = 'Absent';

//    if (attendance.food && attendance.teaWater) {
//        statusClass = 'status-present';
//        statusText = 'Present';
//    } else if (!attendance.food && attendance.teaWater) {
//        statusClass = 'status-partial';
//        statusText = 'Tea Only';
//    } else {
//        statusClass = 'status-absent';
//        statusText = 'Absent';
//    }

//    statusBadge.className = `status-badge ${statusClass}`;
//    statusBadge.textContent = statusText;
//}

//// ========================================
//// Save All Attendance
//// ========================================
//async function saveAllAttendance() {
//    try {
//        const btn = document.getElementById('saveAllAttendanceBtn');
//        btn.disabled = true;
//        btn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Saving...';

//        // Prepare data for API
//        const attendanceRecords = attendanceData.map(a => ({
//            attendanceId: a.attendanceId,
//            userId: a.userId,
//            date: a.date,
//            mealType: selectedMealType,
//            teaWater: a.teaWater,
//            food: a.food,
//            foodPrice: a.foodPrice
//        }));

//        // Replace with actual C# API endpoint
//        /*
//        const response = await fetch('/api/Attendance/SaveAttendance', {
//            method: 'POST',
//            headers: { 'Content-Type': 'application/json' },
//            body: JSON.stringify(attendanceRecords)
//        });

//        if (!response.ok) throw new Error('Failed to save');
//        */

//        // Simulate successful save
//        await new Promise(resolve => setTimeout(resolve, 1000));

//        showToast(`Attendance for ${selectedMealType} saved successfully!`, 'success');

//        btn.disabled = false;
//        btn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Save All';
//    } catch (error) {
//        console.error('Error saving attendance:', error);
//        showToast('Failed to save attendance', 'error');

//        const btn = document.getElementById('saveAllAttendanceBtn');
//        btn.disabled = false;
//        btn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Save All';
//    }
//}

//// ========================================
//// Mark All Present
//// ========================================
//function markAllPresent() {
//    const mealPrice = calculateMealPrice(selectedMealType);

//    attendanceData.forEach(attendance => {
//        attendance.teaWater = true;
//        attendance.food = true;
//        attendance.foodPrice = mealPrice;
//    });

//    renderAttendanceTable();
//    updateStatistics();
//    showToast(`All members marked present for ${selectedMealType}`, 'success');
//}

//// ========================================
//// Filter Attendance
//// ========================================
//function filterAttendance() {
//    const searchTerm = document.getElementById('searchMember').value.toLowerCase();

//    const rows = document.querySelectorAll('#attendanceTableBody tr');
//    let visibleCount = 0;

//    rows.forEach(row => {
//        const name = row.querySelector('.member-name').textContent.toLowerCase();
//        const username = row.querySelector('.member-username').textContent.toLowerCase();
//        const department = row.cells[3].textContent.toLowerCase();

//        const matchesSearch = name.includes(searchTerm) || username.includes(searchTerm) || department.includes(searchTerm);

//        if (matchesSearch) {
//            row.style.display = '';
//            visibleCount++;
//        } else {
//            row.style.display = 'none';
//        }
//    });

//    showEmptyState(visibleCount === 0);
//}

//// ========================================
//// Update Statistics
//// ========================================
//function updateStatistics() {
//    const total = attendanceData.length;
//    const teaWaterCount = attendanceData.filter(a => a.teaWater).length;
//    const foodCount = attendanceData.filter(a => a.food).length;
//    // Absent count is based on food not being checked
//    const absentCount = attendanceData.filter(a => !a.food).length;

//    document.getElementById('totalMembers').textContent = total;
//    document.getElementById('teaWaterCount').textContent = teaWaterCount;
//    document.getElementById('foodCount').textContent = foodCount;
//    document.getElementById('absentCount').textContent = absentCount;
//}

//// ========================================
//// Load Menu Logic
//// ========================================

//async function loadMenuForDate(dayName) {
//    try {
//        // If the selected date is today, we use the data passed from CSHTML
//        const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

//        if (dayName === todayName && todayMenu.length > 0) {
//            // Data is already loaded from CSHTML, just update the UI
//            displayMenu();
//            updateMealDisplay();
//        } else {
//            // If the user selected a different date, we would usually fetch that from the API.
//            // Since we only have CSHTML data for "Model.menu", we will fallback to
//            // the CSHTML data OR you can insert your API call here for other days.

//            // Example API call for other dates:
//            // const response = await fetch(`/api/Menu/GetMenuByDay?day=${dayName}`);
//            // const menuData = await response.json();

//            // For now, using todayMenu (from CSHTML) as default/fallback
//            displayMenu();
//            updateMealDisplay();
//        }
//    } catch (error) {
//        console.error('Error loading menu:', error);
//    }
//}

//function displayMenu() {
//    // Note: Ensure your C# Model properties match these names (camelCase is standard for Json.Serialize)
//    const lunchItems = todayMenu.filter(m => (m.mealType || m.MealType) === 'Lunch');
//    const dinnerItems = todayMenu.filter(m => (m.mealType || m.MealType) === 'Dinner');

//    const lunchList = document.getElementById('todayLunchList');
//    const dinnerList = document.getElementById('todayDinnerList');

//    // Helper to safely get properties
//    const getDish = (i) => i.dishName || i.DishName;
//    const getPrice = (i) => i.price || i.Price;

//    // Display lunch
//    if (lunchItems.length > 0) {
//        lunchList.innerHTML = lunchItems.map(item => `
//            <li>
//                <span class="menu-item">${getDish(item)}</span>
//                <span class="menu-price">Rs. ${getPrice(item)}</span>
//            </li>
//        `).join('');

//        const lunchTotal = lunchItems.reduce((sum, item) => sum + getPrice(item), 0);
//        document.getElementById('lunchTotal').textContent = `Rs. ${lunchTotal}`;
//    } else {
//        lunchList.innerHTML = '<li class="text-muted">No items available</li>';
//        document.getElementById('lunchTotal').textContent = 'Rs. 0';
//    }

//    // Display dinner
//    if (dinnerItems.length > 0) {
//        dinnerList.innerHTML = dinnerItems.map(item => `
//            <li>
//                <span class="menu-item">${getDish(item)}</span>
//                <span class="menu-price">Rs. ${getPrice(item)}</span>
//            </li>
//        `).join('');

//        const dinnerTotal = dinnerItems.reduce((sum, item) => sum + getPrice(item), 0);
//        document.getElementById('dinnerTotal').textContent = `Rs. ${dinnerTotal}`;
//    } else {
//        dinnerList.innerHTML = '<li class="text-muted">No items available</li>';
//        document.getElementById('dinnerTotal').textContent = 'Rs. 0';
//    }
//}

//function calculateMealPrice(mealType) {
//    const mealItems = todayMenu.filter(m => (m.mealType || m.MealType) === mealType);
//    return mealItems.reduce((sum, item) => sum + (item.price || item.Price), 0);
//}

//// ========================================
//// UI Helper Functions
//// ========================================
//function showLoading(show) {
//    const loadingState = document.getElementById('loadingState');
//    const tableBody = document.getElementById('attendanceTableBody');

//    if (show) {
//        loadingState.style.display = 'block';
//        tableBody.innerHTML = '';
//    } else {
//        loadingState.style.display = 'none';
//    }
//}

//function showEmptyState(show) {
//    const emptyState = document.getElementById('emptyState');
//    emptyState.style.display = show ? 'block' : 'none';
//}

//function showToast(message, type = 'success') {
//    // Create toast container if it doesn't exist
//    let toastContainer = document.querySelector('.toast-container');
//    if (!toastContainer) {
//        toastContainer = document.createElement('div');
//        toastContainer.className = 'toast-container';
//        document.body.appendChild(toastContainer);
//    }

//    // Create toast element
//    const toast = document.createElement('div');
//    toast.className = `toast toast-${type} show`;
//    toast.innerHTML = `
//        <div class="toast-body d-flex align-items-center justify-content-between p-3">
//            <span><i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'exclamation-circle'} me-2"></i>${message}</span>
//            <button type="button" class="btn-close btn-close-white ms-3" onclick="this.parentElement.parentElement.remove()"></button>
//        </div>
//    `;

//    toastContainer.appendChild(toast);

//    // Auto remove after 3 seconds
//    setTimeout(() => {
//        toast.remove();
//    }, 3000);
//}


// Attendance Management System
// ========================================

// Global Variables
// NOTE: 'allMembers' and 'todayMenu' are populated via CSHTML. 
// We do not redeclare them here to avoid syntax errors.
let attendanceData = [];
let selectedDate = new Date();
let selectedMealType = 'Lunch';

// ========================================
// Initialize
// ========================================
document.addEventListener('DOMContentLoaded', function () {
    // Ensure data from CSHTML exists, otherwise default to empty arrays
    if (typeof allMembers === 'undefined') allMembers = [];
    if (typeof todayMenu === 'undefined') todayMenu = [];

    initializeDatePicker();
    setupEventListeners();

    // Initial Load
    // We get the current day name to filter the menu immediately
    const currentDay = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    displayMenu(currentDay);
    loadMembers();

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
});

// ========================================
// Date Picker Functions
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
    const dateDisplay = document.getElementById('selectedDateDisplay');
    dateDisplay.textContent = formatDateDisplay(selectedDate);

    // Get the specific day name for the selected date (e.g., "Monday")
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Update day badge in menu
    const dayBadge = document.getElementById('todayDayBadge');
    dayBadge.textContent = dayName;

    // Logic to switch/filter menu for the specific day
    loadMenuForDate(dayName);

    // Update meal display (Price calculation depends on the day, so this comes after menu load)
    updateMealDisplay();

    // Reload attendance
    if (allMembers.length > 0) {
        loadAttendanceForDate();
    }
}

function updateMealDisplay() {
    // Update labels
    document.getElementById('selectedMealDisplay').textContent = selectedMealType;
    document.getElementById('tableHeaderMeal').textContent = selectedMealType;
    document.getElementById('foodColumnHeader').textContent = `Food (${selectedMealType})`;
    document.getElementById('statMealType').textContent = selectedMealType;

    // Update meal price - NOW specific to the Selected Date
    const mealPrice = calculateMealPrice(selectedMealType);
    document.getElementById('selectedMealPrice').textContent = mealPrice;
    document.getElementById('todayFoodPrice').textContent = mealPrice;
}

// ========================================
// Event Listeners
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
// Load Members
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

// ========================================
// Load Attendance for Selected Date
// ========================================
async function loadAttendanceForDate() {
    try {
        const dateStr = formatDateForInput(selectedDate);

        // In real app: fetch existing attendance from API here
        const existingAttendance = [];

        attendanceData = allMembers.map(member => {
            // Handle casing differences
            const mId = member.userId || member.UserId;
            const mName = member.name || member.Name;
            const mUser = member.username || member.Username;
            const mDept = member.department || member.Department;

            const existing = existingAttendance.find(a => a.userId === mId && a.mealType === selectedMealType);

            return {
                attendanceId: existing?.attendanceId || 0,
                userId: mId,
                name: mName,
                username: mUser,
                department: mDept,
                date: dateStr,
                mealType: selectedMealType,
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
// Render Attendance Table
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

        if (attendance.food && attendance.teaWater) {
            statusClass = 'status-present';
            statusText = 'Present';
        } else if (!attendance.food && attendance.teaWater) {
            statusClass = 'status-partial';
            statusText = 'Tea Only';
        }

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
                           data-user-id="${attendance.userId}" ${attendance.teaWater ? 'checked' : ''}>
                </div>
            </td>
            <td class="text-center">
                <div class="custom-checkbox-wrapper">
                    <input type="checkbox" class="custom-checkbox food-checkbox" 
                           data-user-id="${attendance.userId}" ${attendance.food ? 'checked' : ''}>
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
// Checkbox Change Handlers
// ========================================
function handleTeaCheckboxChange(e) {
    const userId = parseInt(e.target.dataset.userId);
    const isChecked = e.target.checked;
    const attendance = attendanceData.find(a => a.userId === userId);

    if (attendance) {
        attendance.teaWater = isChecked;
        if (!isChecked) {
            attendance.food = false;
            attendance.foodPrice = 0;
            e.target.closest('tr').querySelector('.food-checkbox').checked = false;
        }
        updateRowStatus(e.target.closest('tr'), attendance);
        updateStatistics();
    }
}

function handleFoodCheckboxChange(e) {
    const userId = parseInt(e.target.dataset.userId);
    const isChecked = e.target.checked;
    const attendance = attendanceData.find(a => a.userId === userId);

    if (attendance) {
        if (isChecked && !attendance.teaWater) {
            attendance.teaWater = true;
            e.target.closest('tr').querySelector('.tea-checkbox').checked = true;
        }
        attendance.food = isChecked;
        attendance.foodPrice = isChecked ? calculateMealPrice(selectedMealType) : 0;
        updateRowStatus(e.target.closest('tr'), attendance);
        updateStatistics();
    }
}

function updateRowStatus(row, attendance) {
    const statusBadge = row.querySelector('.status-badge');
    let statusClass = 'status-absent';
    let statusText = 'Absent';

    if (attendance.food && attendance.teaWater) {
        statusClass = 'status-present';
        statusText = 'Present';
    } else if (!attendance.food && attendance.teaWater) {
        statusClass = 'status-partial';
        statusText = 'Tea Only';
    }

    statusBadge.className = `status-badge ${statusClass}`;
    statusBadge.textContent = statusText;
}

// ========================================
// Save & Helper Functions
// ========================================
async function saveAllAttendance() {
    try {
        const btn = document.getElementById('saveAllAttendanceBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Saving...';

        const attendanceRecords = attendanceData.map(a => ({
            attendanceId: a.attendanceId,
            userId: a.userId,
            date: a.date,
            mealType: selectedMealType,
            teaWater: a.teaWater,
            food: a.food,
            foodPrice: a.foodPrice
        }));

        // Replace with actual fetch call
        await new Promise(resolve => setTimeout(resolve, 1000));

        showToast(`Attendance for ${selectedMealType} saved successfully!`, 'success');
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Save All';
    } catch (error) {
        console.error(error);
        showToast('Failed to save attendance', 'error');
        document.getElementById('saveAllAttendanceBtn').disabled = false;
    }
}

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

// ========================================
// Load Menu Logic (FIXED FILTERING)
// ========================================

async function loadMenuForDate(dayName) {
    // We pass the dayName (e.g., "Monday") to the display function
    displayMenu(dayName);
}

function displayMenu(dayName) {
    // Helper to safely get properties (handles case sensitivity)
    const getDay = (i) => i.dayOfWeek || i.DayOfWeek;
    const getMeal = (i) => i.mealType || i.MealType;
    const getDish = (i) => i.dishName || i.DishName;
    const getPrice = (i) => i.price || i.Price;

    // 1. First, filter the GLOBAL 'todayMenu' list by the Selected Day
    const itemsForToday = todayMenu.filter(m => getDay(m) === dayName);

    // 2. Then split into Lunch and Dinner
    const lunchItems = itemsForToday.filter(m => getMeal(m) === 'Lunch');
    const dinnerItems = itemsForToday.filter(m => getMeal(m) === 'Dinner');

    const lunchList = document.getElementById('todayLunchList');
    const dinnerList = document.getElementById('todayDinnerList');

    // Display Lunch
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

    // Display Dinner
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
    // We must recalculate the current day to ensure we filter correctly
    const currentDayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

    const getDay = (i) => i.dayOfWeek || i.DayOfWeek;
    const getMeal = (i) => i.mealType || i.MealType;
    const getPrice = (i) => i.price || i.Price;

    // Filter by BOTH Day AND Meal Type
    const mealItems = todayMenu.filter(m => getDay(m) === currentDayName && getMeal(m) === mealType);

    return mealItems.reduce((sum, item) => sum + getPrice(item), 0);
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