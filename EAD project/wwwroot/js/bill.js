// Bills Management System
const formatMoney = (n) => `Rs. ${parseFloat(n || 0).toLocaleString()}`;

// Global Variables
let allMembers = [];
let allBills = [];
let filteredBills = [];
let selectedMember = null;
let currentBillData = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setCurrentMonthYear();
    loadMembers(); // Loads from C# variable 'user'
    loadBills();   // Loads from C# variable 'bills'
    setupSidebar();
});

function setupSidebar() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    const toggleMenu = () => {
        if (sidebar) sidebar.classList.toggle('show');
        if (overlay) overlay.classList.toggle('show');
    };

    if (toggle) toggle.addEventListener('click', toggleMenu);
    if (overlay) overlay.addEventListener('click', () => {
        if (sidebar) sidebar.classList.remove('show');
        if (overlay) overlay.classList.remove('show');
    });
}

function setCurrentMonthYear() {
    const now = new Date(), m = now.getMonth() + 1, y = now.getFullYear();

    if (document.getElementById('generateMonth')) {
        ['generateMonth', 'searchMonth'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = m;
        });
    }

    if (document.getElementById('generateYear')) {
        ['generateYear', 'searchYear'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = y;
        });
    }
}

function setupEventListeners() {
    if (document.getElementById('generateAllBillsBtn'))
        document.getElementById('generateAllBillsBtn').addEventListener('click', generateAllBills);

    if (document.getElementById('searchMemberInput'))
        document.getElementById('searchMemberInput').addEventListener('input', handleMemberSearch);

    if (document.getElementById('searchBillBtn'))
        document.getElementById('searchBillBtn').addEventListener('click', generateIndividualBill);

    ['filterMonth', 'filterYear', 'filterStatus'].forEach(id => {
        if (document.getElementById(id))
            document.getElementById(id).addEventListener('change', applyFilters);
    });

    if (document.getElementById('searchBills'))
        document.getElementById('searchBills').addEventListener('input', applyFilters);

    if (document.getElementById('downloadBillBtn'))
        document.getElementById('downloadBillBtn').addEventListener('click', () => currentBillData && generateAndDownloadPDF(currentBillData));

    if (document.getElementById('sendBillBtn'))
        document.getElementById('sendBillBtn').addEventListener('click', sendBillToMember);
}

// ==========================================
// 1. DATA LOADING (Updated for C# Integration)
// ==========================================
async function loadMembers() {
    try {
        // Use the global 'user' variable injected via @Html.Raw in the View
        if (typeof user !== 'undefined' && Array.isArray(user)) {
            allMembers = user;
        } else {
            console.warn('No members data found from C#');
            allMembers = [];
        }
    } catch (err) { console.error(err); }
}

async function loadBills() {
    showLoading(true);
    try {
        // Use the global 'bills' variable injected via @Html.Raw in the View
        if (typeof bills !== 'undefined' && Array.isArray(bills)) {
            // Map C# bills to include Member Names
            allBills = bills.map(b => {
                // Find member by ID to get Name/Department
                const member = allMembers.find(m => m.userId === b.userId);
                return {
                    ...b,
                    memberName: member ? member.name : 'Unknown User',
                    username: member ? member.username : 'unknown',
                    department: member ? member.department : '-',
                    isComputed: true
                };
            });
        } else {
            allBills = [];
        }

        filteredBills = [...allBills];
        renderBillsTable();
        updateStatistics();
    } catch (err) {
        console.error(err);
        showToast('Error loading bills', 'error');
    } finally {
        showLoading(false);
    }
}

function handleMemberSearch(e) {
    const term = e.target.value.toLowerCase().trim();
    const sugg = document.getElementById('memberSuggestions');
    const btn = document.getElementById('searchBillBtn');

    if (term.length < 2) {
        sugg.classList.remove('show');
        btn.disabled = true;
        return;
    }

    const matches = allMembers.filter(m =>
        (m.name && m.name.toLowerCase().includes(term)) ||
        (m.username && m.username.toLowerCase().includes(term))
    );

    sugg.innerHTML = matches.length ? matches.map(m => `
        <div class="member-suggestion-item" onclick="selectMember(${m.userId})">
            <div class="suggestion-name">${m.name}</div>
            <div class="suggestion-username">@${m.username} ${m.isActive ? '<span class="text-success small">• Active</span>' : '<span class="text-danger small">• Inactive</span>'}</div>
        </div>`).join('') : '<div class="member-suggestion-item">No members found</div>';
    sugg.classList.add('show');
}

window.selectMember = (id) => {
    selectedMember = allMembers.find(m => m.userId === id);
    document.getElementById('searchMemberInput').value = selectedMember.name;
    document.getElementById('memberSuggestions').classList.remove('show');
    document.getElementById('searchBillBtn').disabled = false;
};

// ==========================================
// 2. BILL LOGIC
// ==========================================
async function generateAllBills() {
    toggleBtn('generateAllBillsBtn', true, 'Computing...');
    const month = parseInt(document.getElementById('generateMonth').value);
    const year = parseInt(document.getElementById('generateYear').value);

    // 1. FILTER: Only Active Members
    const activeMembers = allMembers.filter(m => m.isActive === true);

    if (activeMembers.length === 0) {
        showToast('No active members found.', 'info');
        toggleBtn('generateAllBillsBtn', false, 'Compute All Bills', 'calculator');
        return;
    }

    let computedCount = 0;
    activeMembers.forEach(member => {
        // Check if bill already exists in UI list
        const exists = allBills.find(b => b.userId == member.userId && b.month == month && b.year == year);
        if (exists) return; // Skip if already exists

        // Calculate costs based on real attendance data
        const attData = getRealAttendanceData(member.userId, month, year);

        // Note: In a real app, you would POST this to the server here.
        // For now, we update the UI locally.
        const newBill = {
            billId: Math.floor(Math.random() * 90000), // Temp ID
            userId: member.userId,
            month: month,
            year: year,
            totalTeaWaterAmount: attData.teaTotal,
            totalFoodAmount: attData.foodTotal,
            grandTotal: attData.total,
            isPaid: false,
            memberName: member.name,
            username: member.username,
            department: member.department,
            isComputed: true
        };

        allBills.push(newBill);
        computedCount++;
    });

    setTimeout(() => {
        if (computedCount > 0) {
            showToast(`Computed bills for ${computedCount} active members.`, 'success');
            filteredBills = [...allBills];
            renderBillsTable();
            updateStatistics();
        } else {
            showToast('All active members already have bills for this month.', 'info');
        }
        toggleBtn('generateAllBillsBtn', false, 'Compute All Bills', 'calculator');
    }, 800);
}

async function generateIndividualBill() {
    if (!selectedMember) return;
    toggleBtn('searchBillBtn', true, 'Generating...');

    // 2. LOGIC: Generate regardless of 'isActive' status
    const month = parseInt(document.getElementById('searchMonth').value);
    const year = parseInt(document.getElementById('searchYear').value);
    const fee = parseFloat(document.getElementById('searchServiceFee').value) || 0;

    // Get Data from Global 'attendances' variable
    const attData = getRealAttendanceData(selectedMember.userId, month, year);

    currentBillData = {
        billId: Math.floor(Math.random() * 9000) + 1000,
        userId: selectedMember.userId,
        memberName: selectedMember.name,
        username: selectedMember.username,
        department: selectedMember.department,
        cnic: selectedMember.cnic,
        month,
        year,
        totalTeaWaterAmount: attData.teaTotal,
        totalFoodAmount: attData.foodTotal,
        subtotal: attData.total,
        serviceFee: fee,
        grandTotal: attData.total + fee,
        isPaid: false,
        isComputed: true,
        attendanceDetails: attData.details
    };

    displayBillModal(currentBillData);
    toggleBtn('searchBillBtn', false, 'View Bill', 'receipt');
    showToast('Bill generated!', 'success');
}

// Helper: Calculate Bill from Real C# Attendance Data
function getRealAttendanceData(userId, month, year) {
    let relevantAttendance = [];

    // Check if C# attendance data exists
    if (typeof attendances !== 'undefined' && Array.isArray(attendances)) {
        relevantAttendance = attendances.filter(a => {
            // Parse date "yyyy-mm-dd"
            const d = new Date(a.attendanceDate);
            // Match Year and Month
            return a.userId === userId && (d.getMonth() + 1) === month && d.getFullYear() === year;
        });
    }

    let teaTotal = 0;
    let foodTotal = 0;
    const details = [];

    relevantAttendance.forEach(a => {
        const teaCost = a.teaWater ? 50 : 0; // Assuming 50 for tea
        const foodCost = a.food ? (a.foodPrice || 0) : 0;

        teaTotal += teaCost;
        foodTotal += foodCost;

        details.push({
            date: a.attendanceDate,
            mealType: a.mealType,
            teaWater: a.teaWater,
            food: a.food,
            amount: teaCost + foodCost
        });
    });

    return {
        teaTotal: teaTotal,
        foodTotal: foodTotal,
        total: teaTotal + foodTotal,
        details: details
    };
}

function displayBillModal(data) {
    document.getElementById('billId').textContent = `#${data.billId}`;
    document.getElementById('billDate').textContent = new Date().toLocaleDateString();
    document.getElementById('billMemberName').textContent = data.memberName;
    document.getElementById('billMemberUsername').textContent = `@${data.username}`;
    document.getElementById('billMemberDepartment').textContent = data.department;
    document.getElementById('billPeriod').textContent = `Month: ${data.month}/${data.year}`;

    const bodyHtml = data.attendanceDetails && data.attendanceDetails.length > 0
        ? data.attendanceDetails.map(a => {
            const d = new Date(a.date);
            return `<tr>
                <td><strong>${d.getDate()}/${d.getMonth() + 1}</strong><br><small class="text-muted">${d.toLocaleDateString('en-US', { weekday: 'short' })}</small></td>
                <td><span class="badge ${a.mealType === 'Lunch' ? 'bg-warning' : 'bg-primary'}">${a.mealType || 'Meal'}</span></td>
                <td class="text-center">${a.teaWater ? '<i class="bi bi-check-circle-fill text-success"></i>' : '<i class="bi bi-x-circle-fill text-danger"></i>'}</td>
                <td class="text-center">${a.food ? '<i class="bi bi-check-circle-fill text-success"></i>' : '<i class="bi bi-x-circle-fill text-danger"></i>'}</td>
                <td><strong>${formatMoney(a.amount)}</strong></td>
            </tr>`;
        }).join('')
        : '<tr><td colspan="5" class="text-center text-muted py-3">No attendance records found for this period.</td></tr>';

    document.getElementById('billAttendanceBody').innerHTML = bodyHtml;

    const setSum = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = formatMoney(val);
    };

    setSum('billTeaWaterAmount', data.totalTeaWaterAmount);
    setSum('billFoodAmount', data.totalFoodAmount);
    setSum('billSubtotal', data.subtotal || (data.totalTeaWaterAmount + data.totalFoodAmount));
    setSum('billServiceFee', data.serviceFee || 0);
    setSum('billGrandTotal', data.grandTotal);

    const badge = document.getElementById('billPaymentStatus');
    badge.textContent = data.isPaid ? 'Paid' : 'Unpaid';
    badge.className = `badge bg-${data.isPaid ? 'success' : 'danger'}`;

    new bootstrap.Modal(document.getElementById('viewBillModal')).show();
}

function renderBillsTable() {
    const tbody = document.getElementById('billsTableBody');
    const emptyState = document.getElementById('emptyState');
    tbody.innerHTML = '';

    // 3. FIX: Check for empty array and show "No Record Yet"
    if (!filteredBills || filteredBills.length === 0) {
        if (emptyState) {
            emptyState.style.display = 'block';
            if (!emptyState.innerHTML.trim()) {
                emptyState.innerHTML = `
                    <div class="text-center py-5">
                        <i class="bi bi-folder2-open display-1 text-muted"></i>
                        <p class="mt-3 text-muted">No records yet</p>
                    </div>`;
            }
        }
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = filteredBills.map((b, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>
                <div class="member-info-bill">
                    <div class="member-avatar-bill">${(b.memberName || 'U').charAt(0).toUpperCase()}</div>
                    <div class="member-details-bill">
                        <div class="member-name-bill">${b.memberName}</div>
                        <div class="member-username-bill">@${b.username}</div>
                    </div>
                </div>
            </td>
            <td>${b.department || '-'}</td>
            <td>${b.month}/${b.year}</td>
            <td><strong>${formatMoney(b.grandTotal)}</strong></td>
            <td><span class="payment-status-badge ${b.isPaid ? 'paid' : 'unpaid'}">${b.isPaid ? 'Paid' : 'Unpaid'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-action-table btn-view" onclick="viewBillById(${b.billId})"><i class="bi bi-eye"></i></button>
                    <button class="btn btn-action-table btn-download" onclick="downloadBillById(${b.billId})"><i class="bi bi-download"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function applyFilters() {
    const m = document.getElementById('filterMonth').value;
    const y = document.getElementById('filterYear').value;
    const s = document.getElementById('filterStatus').value;
    const q = document.getElementById('searchBills').value.toLowerCase();

    filteredBills = allBills.filter(b =>
        (!m || b.month == m) &&
        (!y || b.year == y) &&
        (!s || (s === 'paid' ? b.isPaid : !b.isPaid)) &&
        (!q || (b.memberName && b.memberName.toLowerCase().includes(q)) || (b.username && b.username.toLowerCase().includes(q)))
    );
    renderBillsTable();
    updateStatistics();
}

function updateStatistics() {
    if (document.getElementById('totalBills'))
        document.getElementById('totalBills').textContent = filteredBills.length;

    if (document.getElementById('paidBills'))
        document.getElementById('paidBills').textContent = filteredBills.filter(b => b.isPaid).length;

    if (document.getElementById('unpaidBills'))
        document.getElementById('unpaidBills').textContent = filteredBills.filter(b => !b.isPaid).length;

    if (document.getElementById('totalAmount'))
        document.getElementById('totalAmount').textContent = formatMoney(filteredBills.reduce((s, b) => s + b.grandTotal, 0));
}

// Global Bill Actions
window.viewBillById = (id) => {
    const bill = allBills.find(b => b.billId === id);
    if (!bill) return;

    const attData = getRealAttendanceData(bill.userId, bill.month, bill.year);
    currentBillData = { ...bill, attendanceDetails: attData.details };
    displayBillModal(currentBillData);
};

window.downloadBillById = (id) => {
    const bill = allBills.find(b => b.billId === id);
    if (!bill) return;
    const attData = getRealAttendanceData(bill.userId, bill.month, bill.year);
    generateAndDownloadPDF({ ...bill, attendanceDetails: attData.details });
};

function sendBillToMember() {
    if (currentBillData) showToast('Sending bill feature pending server implementation...', 'info');
}

function generateAndDownloadPDF(data) {
    showToast('Generating PDF...', 'info');
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFillColor(25, 135, 84).rect(0, 0, 210, 35, 'F');
        doc.setFontSize(24).setFont('helvetica', 'bold').setTextColor(255, 255, 255).text('MessHub', 15, 15);
        doc.setFontSize(10).setFont('helvetica', 'normal').text('Mess Management System', 15, 22);
        doc.text(`Bill ID: #${data.billId}`, 150, 12);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 18);

        const color = data.isPaid ? [25, 135, 84] : [220, 53, 69];
        doc.setFillColor(...color).roundedRect(150, 22, 35, 8, 2, 2, 'F');
        doc.setFontSize(9).setFont('helvetica', 'bold').text(data.isPaid ? 'PAID' : 'UNPAID', 167.5, 27, { align: 'center' });

        doc.setTextColor(0, 0, 0).setFontSize(12).setFont('helvetica', 'bold').text('Bill To:', 15, 52);
        doc.setFontSize(10).setFont('helvetica', 'normal');
        doc.text(`Name: ${data.memberName}`, 15, 59);
        doc.text(`Username: @${data.username}`, 15, 65);
        doc.text(`Department: ${data.department}`, 15, 71);

        doc.setFillColor(25, 135, 84, 0.1).roundedRect(15, 82, 180, 10, 2, 2, 'F');
        doc.setTextColor(25, 135, 84).setFontSize(11).setFont('helvetica', 'bold');
        doc.text(`Billing Period: Month ${data.month}/${data.year}`, 105, 88, { align: 'center' });

        doc.setTextColor(0, 0, 0).setFontSize(12).setFont('helvetica', 'bold');
        doc.text('Attendance Details', 15, 99);

        let tableBody = [];
        if (data.attendanceDetails && data.attendanceDetails.length > 0) {
            tableBody = data.attendanceDetails.map(a => {
                const d = new Date(a.date);
                return [
                    `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`,
                    a.mealType || '-',
                    a.teaWater ? 'Yes' : 'No',
                    a.food ? 'Yes' : 'No',
                    formatMoney(a.amount || 0)
                ];
            });
        } else {
            tableBody = [['-', '-', '-', '-', '-']];
        }

        doc.autoTable({
            startY: 104,
            head: [['Date', 'Meal Type', 'Tea/Water', 'Food', 'Amount']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [25, 135, 84], textColor: 255, fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 8, cellPadding: 3 }
        });

        const y = doc.lastAutoTable.finalY + 10;
        doc.setFillColor(248, 249, 250).roundedRect(15, y, 180, 45, 2, 2, 'F');
        doc.setTextColor(0, 0, 0).setFontSize(10).setFont('helvetica', 'normal');
        doc.text('Tea/Water Charges:', 20, y + 8);
        doc.text(formatMoney(data.totalTeaWaterAmount), 185, y + 8, { align: 'right' });
        doc.text('Food Charges:', 20, y + 16);
        doc.text(formatMoney(data.totalFoodAmount), 185, y + 16, { align: 'right' });
        doc.setFont('helvetica', 'bold');
        doc.text('GRAND TOTAL:', 20, y + 35);
        doc.setTextColor(25, 135, 84);
        doc.text(formatMoney(data.grandTotal), 185, y + 35, { align: 'right' });

        doc.save(`Bill_${data.billId}_${data.memberName}.pdf`);
        showToast('PDF downloaded successfully!', 'success');
    } catch (e) {
        console.error('PDF Error:', e);
        showToast('PDF generation failed', 'error');
    }
}

// Helpers
function toggleBtn(id, disabled, html, icon) {
    const btn = document.getElementById(id);
    if (btn) {
        btn.disabled = disabled;
        btn.innerHTML = disabled ? `<i class="bi bi-hourglass-split me-2"></i>${html}` : `<i class="bi bi-${icon} me-2"></i>${html}`;
    }
}

function showLoading(show) {
    if (document.getElementById('loadingState'))
        document.getElementById('loadingState').style.display = show ? 'block' : 'none';

    if (document.getElementById('billsTableBody') && show)
        document.getElementById('billsTableBody').innerHTML = '';
}

function showToast(msg, type = 'success') {
    const t = document.createElement('div');
    t.className = `toast toast-${type} show`;
    t.innerHTML = `<div class="toast-body p-3"><span><i class="bi bi-${type == 'success' ? 'check' : 'info'}-circle me-2"></i>${msg}</span><button type="button" class="btn-close btn-close-white ms-3" onclick="this.parentElement.parentElement.remove()"></button></div>`;
    let c = document.querySelector('.toast-container');
    if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.append(c); }
    c.append(t);
    setTimeout(() => t.remove(), 3000);
}