const formatMoney = (n) => `Rs. ${parseFloat(n || 0).toLocaleString()}`;
let allMembers = [];
let allBills = [];
let filteredBills = [];
let selectedMember = null;
let currentBillData = null;

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setCurrentMonthYear();
    setupSidebar();

    // Load data sequentially
    loadMembers();
    loadBills();
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
    const genBtn = document.getElementById('generateAllBillsBtn');
    if (genBtn) genBtn.addEventListener('click', generateAllBills);

    const searchInput = document.getElementById('searchMemberInput');
    if (searchInput) searchInput.addEventListener('input', handleMemberSearch);

    const searchBillBtn = document.getElementById('searchBillBtn');
    if (searchBillBtn) searchBillBtn.addEventListener('click', generateIndividualBill);

    ['filterMonth', 'filterYear', 'filterStatus'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', applyFilters);
    });

    const searchBillsEl = document.getElementById('searchBills');
    if (searchBillsEl) searchBillsEl.addEventListener('input', applyFilters);

    const dlBtn = document.getElementById('downloadBillBtn');
    if (dlBtn) dlBtn.addEventListener('click', () => currentBillData && generateAndDownloadPDF(currentBillData));

    const sendBtn = document.getElementById('sendBillBtn');
    if (sendBtn) sendBtn.addEventListener('click', sendBillToMember);
}

// FIX 1: Load Members from window.messData
function loadMembers() {
    try {
        if (window.messData && Array.isArray(window.messData.users)) {
            allMembers = window.messData.users;
        } else {
            console.warn('No members data found in window.messData');
            allMembers = [];
        }
    } catch (err) { console.error("Error loading members:", err); }
}

// FIX 2: Load Bills from window.messData and Map correctly
function loadBills() {
    showLoading(true);
    try {
        if (window.messData && Array.isArray(window.messData.bills)) {
            allBills = window.messData.bills.map(b => {
                const member = allMembers.find(m => m.userId === b.userId);
                return {
                    ...b,
                    memberName: member ? member.name : 'Unknown User',
                    username: member ? member.username : 'unknown',
                    department: member ? member.department : '-',
                    // Estimate service fee: GrandTotal - (Tea + Food)
                    serviceFee: (b.grandTotal - (b.totalTeaWaterAmount || 0) - (b.totalFoodAmount || 0)),
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
        if (btn) btn.disabled = true;
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
    if (selectedMember) {
        document.getElementById('searchMemberInput').value = selectedMember.name;
        document.getElementById('memberSuggestions').classList.remove('show');
        const btn = document.getElementById('searchBillBtn');
        if (btn) btn.disabled = false;
    }
};

// ==========================================
// 3. BILL LOGIC (Compute & Save)
// ==========================================
async function generateAllBills() {
    const btn = document.getElementById('generateAllBillsBtn');

    const month = parseInt(document.getElementById('generateMonth').value);
    const year = parseInt(document.getElementById('generateYear').value);

    const feeInput = document.getElementById('generateServiceFee');
    const fee = feeInput ? (parseFloat(feeInput.value) || 0) : 0;

    const activeMembers = allMembers.filter(m => m.isActive === true);

    if (activeMembers.length === 0) {
        showToast('No active members found.', 'info');
        return;
    }

    try {
        toggleBtn('generateAllBillsBtn', true, 'Computing & Saving...');

        const billsToSave = [];

        activeMembers.forEach(member => {
            const attData = getRealAttendanceData(member.userId, month, year);
            billsToSave.push({
                UserId: member.userId,
                Month: month,
                Year: year,
                TotalTeaWaterAmount: attData.teaTotal,
                TotalFoodAmount: attData.foodTotal,
                GrandTotal: attData.total + fee,
                IsPaid: false
            });
        });

        const response = await fetch('/Bill/SaveBillsApi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(billsToSave)
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        // Update Local UI
        let computedCount = 0;
        billsToSave.forEach(savedBill => {
            const existingIdx = allBills.findIndex(b =>
                b.userId === savedBill.UserId &&
                b.month === savedBill.Month &&
                b.year === savedBill.Year
            );

            const member = allMembers.find(m => m.userId === savedBill.UserId);

            const uiBillData = {
                billId: existingIdx > -1 ? allBills[existingIdx].billId : 0,
                userId: savedBill.UserId,
                month: savedBill.Month,
                year: savedBill.Year,
                totalTeaWaterAmount: savedBill.TotalTeaWaterAmount,
                totalFoodAmount: savedBill.TotalFoodAmount,
                grandTotal: savedBill.GrandTotal,
                serviceFee: fee,
                isPaid: existingIdx > -1 ? allBills[existingIdx].isPaid : false,
                memberName: member ? member.name : 'Unknown',
                username: member ? member.username : 'unknown',
                department: member ? member.department : '-',
                isComputed: true
            };

            if (existingIdx > -1) {
                allBills[existingIdx] = { ...allBills[existingIdx], ...uiBillData };
            } else {
                allBills.push(uiBillData);
            }
            computedCount++;
        });

        filteredBills = [...allBills];
        renderBillsTable();
        updateStatistics();
        showToast(`Successfully saved ${computedCount} bills!`, 'success');

    } catch (err) {
        console.error('Error saving bills:', err);
        showToast("Error saving bills: " + err.message, "error");
    } finally {
        toggleBtn('generateAllBillsBtn', false, 'Compute All Bills', 'calculator');
    }
}

async function generateIndividualBill() {
    if (!selectedMember) {
        showToast("Please search and select a member first.", "error");
        return;
    }

    const monthEl = document.getElementById('searchMonth');
    const yearEl = document.getElementById('searchYear');
    const feeEl = document.getElementById('searchServiceFee');

    const month = monthEl ? parseInt(monthEl.value) : new Date().getMonth() + 1;
    const year = yearEl ? parseInt(yearEl.value) : new Date().getFullYear();
    const fee = feeEl ? (parseFloat(feeEl.value) || 0) : 0;

    try {
        toggleBtn('searchBillBtn', true, 'Saving...');

        const attData = getRealAttendanceData(selectedMember.userId, month, year);

        const billsToSave = [{
            UserId: selectedMember.userId,
            Month: month,
            Year: year,
            TotalTeaWaterAmount: attData.teaTotal,
            TotalFoodAmount: attData.foodTotal,
            GrandTotal: attData.total + fee,
            IsPaid: false
        }];

        const response = await fetch('/Bill/SaveBillsApi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(billsToSave)
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const existingIdx = allBills.findIndex(b =>
            b.userId === selectedMember.userId &&
            b.month === month &&
            b.year === year
        );

        const savedBillData = {
            billId: existingIdx > -1 ? allBills[existingIdx].billId : 0,
            userId: selectedMember.userId,
            month: month,
            year: year,
            totalTeaWaterAmount: attData.teaTotal,
            totalFoodAmount: attData.foodTotal,
            subtotal: attData.total,
            serviceFee: fee,
            grandTotal: attData.total + fee,
            isPaid: existingIdx > -1 ? allBills[existingIdx].isPaid : false,
            memberName: selectedMember.name,
            username: selectedMember.username,
            department: selectedMember.department,
            cnic: selectedMember.cnic,
            isComputed: true
        };

        if (existingIdx > -1) {
            allBills[existingIdx] = { ...allBills[existingIdx], ...savedBillData };
        } else {
            allBills.push(savedBillData);
        }

        filteredBills = [...allBills];
        renderBillsTable();
        updateStatistics();

        currentBillData = { ...savedBillData, attendanceDetails: attData.details };
        displayBillModal(currentBillData);

        showToast('Bill saved and generated successfully!', 'success');

    } catch (err) {
        console.error('Error generating bill:', err);
        showToast("Error saving bill: " + err.message, "error");
    } finally {
        toggleBtn('searchBillBtn', false, 'View Bill', 'receipt');
    }
}

// FIX 3: Get Attendance from window.messData
function getRealAttendanceData(userId, month, year) {
    let relevantAttendance = [];

    // Check global window object
    const sourceAttendances = (window.messData && window.messData.attendances) ? window.messData.attendances : [];

    if (Array.isArray(sourceAttendances)) {
        relevantAttendance = sourceAttendances.filter(a => {
            const d = new Date(a.attendanceDate);
            return a.userId === userId && (d.getMonth() + 1) === month && d.getFullYear() === year;
        });
    }

    let teaTotal = 0;
    let foodTotal = 0;
    const details = [];

    relevantAttendance.forEach(a => {
        const teaCost = a.teaWater ? 50 : 0;
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

    return { teaTotal, foodTotal, total: teaTotal + foodTotal, details };
}

// ==========================================
// 4. UI RENDERING
// ==========================================
function displayBillModal(data) {
    // Safety checks for DOM elements
    const setSafe = (id, txt) => { const e = document.getElementById(id); if (e) e.textContent = txt; };

    setSafe('billId', data.billId === 0 ? 'Not Saved' : `#${data.billId}`);
    setSafe('billDate', new Date().toLocaleDateString());
    setSafe('billMemberName', data.memberName);
    setSafe('billMemberUsername', `@${data.username}`);
    setSafe('billMemberDepartment', data.department);
    setSafe('billPeriod', `Month: ${data.month}/${data.year}`);

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

    const tbody = document.getElementById('billAttendanceBody');
    if (tbody) tbody.innerHTML = bodyHtml;

    setSafe('billTeaWaterAmount', formatMoney(data.totalTeaWaterAmount));
    setSafe('billFoodAmount', formatMoney(data.totalFoodAmount));
    setSafe('billSubtotal', formatMoney(data.totalTeaWaterAmount + data.totalFoodAmount));
    setSafe('billServiceFee', formatMoney(data.serviceFee || 0));
    setSafe('billGrandTotal', formatMoney(data.grandTotal));

    const badge = document.getElementById('billPaymentStatus');
    if (badge) {
        badge.textContent = data.isPaid ? 'Paid' : 'Unpaid';
        badge.className = `badge bg-${data.isPaid ? 'success' : 'danger'}`;
    }

    // Initialize modal properly
    const modalEl = document.getElementById('viewBillModal');
    if (modalEl) {
        new bootstrap.Modal(modalEl).show();
    }
}

function renderBillsTable() {
    const tbody = document.getElementById('billsTableBody');
    if (!tbody) return;

    const emptyState = document.getElementById('emptyState');
    tbody.innerHTML = '';

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
    const searchEl = document.getElementById('searchBills');
    const q = searchEl ? searchEl.value.toLowerCase() : '';

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

// ==========================================
// 5. PDF GENERATION
// ==========================================
function generateAndDownloadPDF(data) {
    showToast('Generating PDF...', 'info');
    try {
        if (!window.jspdf) {
            showToast('PDF Library not loaded', 'error');
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Header
        doc.setFillColor(25, 135, 84).rect(0, 0, 210, 35, 'F');
        doc.setFontSize(24).setFont('helvetica', 'bold').setTextColor(255, 255, 255).text('MessHub', 15, 15);
        doc.setFontSize(10).setFont('helvetica', 'normal').text('Mess Management System', 15, 22);

        const displayId = data.billId === 0 ? 'N/A' : `#${data.billId}`;
        doc.text(`Bill ID: ${displayId}`, 150, 12);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 18);

        // Status Badge
        const color = data.isPaid ? [25, 135, 84] : [220, 53, 69];
        doc.setFillColor(...color).roundedRect(150, 22, 35, 8, 2, 2, 'F');
        doc.setFontSize(9).setFont('helvetica', 'bold').text(data.isPaid ? 'PAID' : 'UNPAID', 167.5, 27, { align: 'center' });

        // Member Info
        doc.setTextColor(0, 0, 0).setFontSize(12).setFont('helvetica', 'bold').text('Bill To:', 15, 52);
        doc.setFontSize(10).setFont('helvetica', 'normal');
        doc.text(`Name: ${data.memberName}`, 15, 59);
        doc.text(`Username: @${data.username}`, 15, 65);
        doc.text(`Department: ${data.department}`, 15, 71);

        // Period Box
        doc.setFillColor(25, 135, 84, 0.1).roundedRect(15, 82, 180, 10, 2, 2, 'F');
        doc.setTextColor(25, 135, 84).setFontSize(11).setFont('helvetica', 'bold');
        doc.text(`Billing Period: Month ${data.month}/${data.year}`, 105, 88, { align: 'center' });

        // Attendance Table
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

        // Totals Section
        const y = doc.lastAutoTable.finalY + 10;
        doc.setFillColor(248, 249, 250).roundedRect(15, y, 180, 45, 2, 2, 'F');
        doc.setTextColor(0, 0, 0).setFontSize(10).setFont('helvetica', 'normal');

        doc.text('Tea/Water Charges:', 20, y + 8);
        doc.text(formatMoney(data.totalTeaWaterAmount), 185, y + 8, { align: 'right' });

        doc.text('Food Charges:', 20, y + 16);
        doc.text(formatMoney(data.totalFoodAmount), 185, y + 16, { align: 'right' });

        doc.text('Mess Service Fee:', 20, y + 24);
        doc.text(formatMoney(data.serviceFee || 0), 185, y + 24, { align: 'right' });

        doc.setFont('helvetica', 'bold');
        doc.text('GRAND TOTAL:', 20, y + 36);
        doc.setTextColor(25, 135, 84);
        doc.text(formatMoney(data.grandTotal), 185, y + 36, { align: 'right' });

        doc.save(`Bill_${data.memberName}.pdf`);
        showToast('PDF downloaded successfully!', 'success');
    } catch (e) {
        console.error('PDF Error:', e);
        showToast('PDF generation failed', 'error');
    }
}

function toggleBtn(id, disabled, html, icon) {
    const btn = document.getElementById(id);
    if (btn) {
        btn.disabled = disabled;
        btn.innerHTML = disabled ? `<i class="bi bi-hourglass-split me-2"></i>${html}` : `<i class="bi bi-${icon} me-2"></i>${html}`;
    }
}

function showLoading(show) {
    const loadingEl = document.getElementById('loadingState');
    const tableBody = document.getElementById('billsTableBody');

    if (loadingEl) loadingEl.style.display = show ? 'block' : 'none';

    // Clear table while loading to avoid confusion
    if (tableBody && show) tableBody.innerHTML = '';
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