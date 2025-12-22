// My Bills Page JavaScript - Connected to C# Backend
const getEl = id => document.getElementById(id);
const setTxt = (id, txt) => { const el = getEl(id); if (el) el.textContent = txt; };
const getVal = id => getEl(id).value.trim();
const fmtMoney = n => `Rs. ${n.toLocaleString()}`;
const fmtDate = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const getMonthName = (m) => new Date(0, m - 1).toLocaleString('default', { month: 'long' });

// 1. Initialize State & Process Data from window.messData
let currentUser = { name: "Guest", id: "N/A" };
let billsData = [];
let state = { payBill: null, detailBill: null };

document.addEventListener('DOMContentLoaded', () => {
    // Process Backend Data
    if (window.messData) {
        processBackendData();
    } else {
        console.error("window.messData is missing. Ensure Razor View is rendering correctly.");
    }

    // Initialize UI
    setTxt('userName', currentUser.name);
    loadCurrentBill();
    loadBillHistory();
    calculatePaymentSummary();

    // Sidebar Toggle
    const toggle = getEl('sidebarToggle'), sidebar = document.querySelector('.sidebar'), overlay = getEl('sidebarOverlay');
    if (toggle) toggle.onclick = () => { sidebar.classList.add('show'); overlay.classList.add('show'); };
    if (overlay) overlay.onclick = () => { sidebar.classList.remove('show'); overlay.classList.remove('show'); };
});

// 2. Transform C# Data to UI Format
const processBackendData = () => {
    // Set User (Assuming first user in list is the logged-in user)
    if (window.messData.users && window.messData.users.length > 0) {
        const u = window.messData.users[0];
        currentUser = { name: u.name, id: u.username || u.userId, dept: u.department };
    }

    // Transform Bills
    if (window.messData.bills) {
        billsData = window.messData.bills.map(b => {
            // Calculate stats from attendance list
            const billAttendances = getAttendanceForPeriod(b.month, b.year);
            const uniqueDays = new Set(billAttendances.map(a => a.dateStr)).size;
            const totalMeals = billAttendances.filter(a => a.food).length;

            // Calculate Mess Fee (Difference between GrandTotal and items)
            // If GrandTotal is exactly food + tea, messFee is 0
            const calculatedTotal = b.totalFoodAmount + b.totalTeaWaterAmount;
            const messFee = b.grandTotal - calculatedTotal;

            return {
                id: b.billId,
                month: `${getMonthName(b.month)} ${b.year}`,
                monthInt: b.month, // For filtering
                year: b.year,
                amount: b.grandTotal,
                status: b.isPaid ? 'paid' : 'unpaid',
                // C# doesn't give GeneratedDate, assuming 1st of month
                generatedDate: `${b.year}-${String(b.month).padStart(2, '0')}-01`,
                // Paid date isn't in TblBill, defaulting to today if paid (or handle via TblPayment if available)
                paidDate: b.isPaid ? new Date().toISOString() : null,
                daysPresent: uniqueDays,
                meals: totalMeals,
                breakdown: {
                    mealsTotal: b.totalFoodAmount,
                    teaWater: b.totalTeaWaterAmount,
                    messFee: messFee > 0 ? messFee : 0
                }
            };
        });

        // Sort bills: Newest first
        billsData.sort((a, b) => new Date(b.generatedDate) - new Date(a.generatedDate));
    }
};

// Helper: Filter real attendance data for a specific month/year
const getAttendanceForPeriod = (month, year) => {
    if (!window.messData.attendances) return [];

    return window.messData.attendances.filter(a => {
        const d = new Date(a.attendanceDate);
        return (d.getMonth() + 1) === month && d.getFullYear() === year;
    }).map(a => ({
        ...a,
        dateObj: new Date(a.attendanceDate),
        dateStr: a.attendanceDate // Keep string for Set uniqueness
    }));
};

// 3. UI Logic Functions
const loadCurrentBill = () => {
    // Current bill is the first one in the sorted list (newest)
    const cur = billsData.length > 0 ? billsData[0] : null;

    if (cur) {
        setTxt('currentBillAmount', fmtMoney(cur.amount));
        setTxt('currentMonth', cur.month);
        setTxt('daysPresent', cur.daysPresent);
        setTxt('mealsCount', cur.meals);

        // Update banner button based on status
        const bannerBtn = document.querySelector('.current-bill-banner .btn-view-detail');
        if (bannerBtn) bannerBtn.setAttribute('onclick', `viewBillDetail(${cur.id})`);
    } else {
        setTxt('currentBillAmount', 'Rs. 0');
        setTxt('currentMonth', 'No Data');
    }
};

const loadBillHistory = () => {
    const sFilter = getVal('statusFilter');
    const yFilterVal = getVal('yearFilter');
    const yFilter = yFilterVal === 'all' ? 'all' : parseInt(yFilterVal);

    const filtered = billsData.filter(b =>
        (sFilter === 'all' || b.status === sFilter) &&
        (yFilter === 'all' || b.year === yFilter)
    );

    const grid = getEl('billsGrid');
    if (!filtered.length) return grid.innerHTML = `<div class="col-12 text-center py-5"><i class="bi bi-inbox fs-1 text-muted"></i><p class="text-muted mt-3">No bills found</p></div>`;

    grid.innerHTML = filtered.map(b => {
        const isPaid = b.status === 'paid';
        // Note: Using generatedDate for 'Paid' display because TblBill doesn't have PaidDate
        const dateStr = isPaid ? `Status: Paid` : `Generated: ${fmtDate(b.generatedDate)}`;

        const btn = isPaid
            ? `<button class="btn-bill-action btn-download" onclick="downloadBill(${b.id})"><i class="bi bi-download"></i> Download</button>`
            : `<button class="btn-bill-action btn-pay" onclick="openPaymentModal(${b.id})"><i class="bi bi-credit-card"></i> Pay Now</button>`;

        return `
            <div class="bill-card">
                <div class="bill-card-header">
                    <div><div class="bill-month">${b.month}</div><div class="bill-date">${dateStr}</div></div>
                    <span class="bill-status ${b.status}">${b.status.toUpperCase()}</span>
                </div>
                <div class="bill-amount">${fmtMoney(b.amount)}</div>
                <div class="bill-details">
                    <div class="detail-row"><span class="detail-label"><i class="bi bi-calendar-check me-2"></i>Days Present</span><span class="detail-value">${b.daysPresent} days</span></div>
                    <div class="detail-row"><span class="detail-label"><i class="bi bi-egg-fried me-2"></i>Total Meals</span><span class="detail-value">${b.meals} meals</span></div>
                </div>
                <div class="bill-actions">
                    <button class="btn-bill-action btn-view" onclick="viewBillDetail(${b.id})"><i class="bi bi-eye"></i> View</button>
                    ${btn}
                </div>
            </div>`;
    }).join('');
};

const filterBills = () => { loadBillHistory(); calculatePaymentSummary(); };

const viewBillDetail = (id) => {
    const bill = id === 'current' ? billsData[0] : billsData.find(b => b.id === id);
    if (!bill) return;
    state.detailBill = bill;

    // Get Actual Attendance Records
    const attList = getAttendanceForPeriod(bill.monthInt, bill.year);
    // Sort by date
    attList.sort((a, b) => a.dateObj - b.dateObj);

    const rows = attList.length ? attList.map(a => {
        const amount = (a.foodPrice || 0) + (a.teaWater ? 0 : 0); // Logic depends on if Tea is free or separate. Assuming included in foodPrice for row display or 0.
        // Adjusting row display logic to match C# model
        const displayAmt = (a.food ? (a.foodPrice || 0) : 0) + (a.teaWater ? 0 : 0); // Modify 0 if tea has specific cost per row

        return `
        <tr>
            <td><strong>${a.dateObj.getDate()}/${a.dateObj.getMonth() + 1}</strong><br><small class="text-muted">${a.dateObj.toLocaleDateString('en-US', { weekday: 'short' })}</small></td>
            <td><span class="badge ${a.mealType === 'Lunch' ? 'bg-warning' : 'bg-primary'}">${a.mealType}</span></td>
            <td class="text-center">${a.teaWater ? '<i class="bi bi-check-circle-fill text-success"></i>' : '<i class="bi bi-x-circle-fill text-danger"></i>'}</td>
            <td class="text-center">${a.food ? '<i class="bi bi-check-circle-fill text-success"></i>' : '<i class="bi bi-x-circle-fill text-danger"></i>'}</td>
            <td><strong>${a.foodPrice ? fmtMoney(a.foodPrice) : '-'}</strong></td>
        </tr>`
    }).join('') : '<tr><td colspan="5" class="text-center">No attendance records found for this period</td></tr>';

    getEl('billDetailContent').innerHTML = `
        <div class="bill-header">
            <div class="bill-logo"><i class="bi bi-egg-fried"></i><h3>MessHub</h3></div>
            <div class="bill-info">
                <p><strong>Bill ID:</strong> #BILL-${String(bill.id).padStart(4, '0')}</p>
                <span class="badge ${bill.status === 'paid' ? 'bg-success' : 'bg-danger'}">${bill.status.toUpperCase()}</span>
            </div>
        </div>
        <div class="bill-member-info"><h6>Bill To:</h6><p><strong>${currentUser.name}</strong> (@${currentUser.id})</p></div>
        <div class="bill-attendance-details">
            <h6>Attendance Breakdown</h6>
            <div class="table-wrapper-horizontal"><table class="table table-sm table-bordered table-horizontal">
                <thead><tr><th>Date</th><th>Type</th><th>Tea</th><th>Food</th><th>Price</th></tr></thead>
                <tbody>${rows}</tbody>
            </table></div>
        </div>
        <div class="bill-summary">
            <div class="summary-row"><span>Tea/Water Total:</span><span>${fmtMoney(bill.breakdown.teaWater)}</span></div>
            <div class="summary-row"><span>Food Total:</span><span>${fmtMoney(bill.breakdown.mealsTotal)}</span></div>
            <div class="summary-row subtotal"><span>Subtotal:</span><strong>${fmtMoney(bill.breakdown.teaWater + bill.breakdown.mealsTotal)}</strong></div>
            ${bill.breakdown.messFee > 0 ? `<div class="summary-row"><span>Extra/Mess Fee:</span><span>${fmtMoney(bill.breakdown.messFee)}</span></div>` : ''}
            <div class="summary-row total"><span>Grand Total:</span><strong>${fmtMoney(bill.amount)}</strong></div>
        </div>`;

    new bootstrap.Modal(getEl('billDetailModal')).show();
};

// Payment Logic (Kept mostly same, just updating bill status logic)
const openPaymentModal = (id) => {
    const bill = billsData.find(b => b.id === id);
    if (!bill) return;
    state.payBill = bill;
    setTxt('paymentMonth', bill.month);
    setTxt('paymentAmount', fmtMoney(bill.amount));

    ['cardNumber', 'cardName', 'expiryDate', 'cvv', 'accountNumber', 'phoneNumber', 'mobilePin'].forEach(i => { if (getEl(i)) getEl(i).value = ''; });
    getEl('bankTransfer').checked = true;
    showPaymentForm('bank');
    new bootstrap.Modal(getEl('paymentModal')).show();
};

const showPaymentForm = (method) => {
    ['bankTransferForm', 'cardPaymentForm', 'mobilePaymentForm', 'cashPaymentForm'].forEach(id => getEl(id).style.display = 'none');
    if (method === 'bank') getEl('bankTransferForm').style.display = 'block';
    if (method === 'card') getEl('cardPaymentForm').style.display = 'block';
    if (method === 'mobile') getEl('mobilePaymentForm').style.display = 'block';
    if (method === 'cash') getEl('cashPaymentForm').style.display = 'block';
};

const processPayment = () => {
    if (!state.payBill) return;
    const method = document.querySelector('input[name="paymentMethod"]:checked').value;
    let valid = false, details = '';

    const checks = {
        bank: () => {
            const acc = getVal('accountNumber'), name = getVal('accountName');
            if (acc.length >= 10 && name) { valid = true; details = `Bank: ${name} (${acc})`; }
            else showToast('Invalid bank details', 'error');
        },
        card: () => {
            const num = getVal('cardNumber').replace(/\s/g, ''), name = getVal('cardName'), exp = getVal('expiryDate'), cvv = getVal('cvv');
            if (num.length === 16 && cvv.length === 3 && /^\d{2}\/\d{2}$/.test(exp) && name) { valid = true; details = `Card ending ${num.slice(-4)}`; }
            else showToast('Invalid card details', 'error');
        },
        mobile: () => {
            const ph = getVal('phoneNumber'), pin = getVal('mobilePin');
            if (ph.length === 11 && pin.length === 4) { valid = true; details = `Mobile: ${ph}`; }
            else showToast('Invalid mobile details', 'error');
        },
        cash: () => { valid = true; details = 'Cash Payment'; }
    };

    checks[method]();
    if (valid) {
        bootstrap.Modal.getInstance(getEl('paymentModal')).hide();
        showConfirmation(details);
    }
};

const showConfirmation = (details) => {
    const div = document.createElement('div');
    div.id = 'confOverlay'; div.className = 'confirmation-overlay';
    div.innerHTML = `
        <div class="confirmation-container">
            <div class="confirmation-header"><div class="confirmation-icon"><i class="bi bi-send-fill"></i></div><h4>Confirm Payment</h4></div>
            <div class="payment-amount-display"><div class="amount-value">${fmtMoney(state.payBill.amount)}</div></div>
            <p class="text-center mb-4 text-muted">${details}</p>
            <div class="confirmation-actions">
                <button class="btn btn-cancel" onclick="this.closest('#confOverlay').remove()"><i class="bi bi-x-circle me-2"></i>Cancel</button>
                <button class="btn btn-confirm" onclick="finalizePayment('${details}')"><i class="bi bi-check-circle me-2"></i>Proceed</button>
            </div>
        </div>`;
    document.body.appendChild(div);
    setTimeout(() => div.classList.add('show'), 10);
};

const finalizePayment = (details) => {
    const ol = getEl('confOverlay'); if (ol) ol.remove();
    showToast('Processing payment...', 'info');

    // AJAX Call would go here to update TblPayment in C#
    setTimeout(() => {
        state.payBill.status = 'paid';
        state.payBill.paidDate = new Date().toISOString().split('T')[0];
        if (state.payBill.id === billsData[0].id) loadCurrentBill();
        loadBillHistory();
        showToast(`Payment successful!`, 'success');
        state.payBill = null;
    }, 2000);
};

// PDF Logic
const downloadBill = (id) => {
    const bill = id ? billsData.find(b => b.id === id) : state.detailBill;
    if (!bill) return;
    showToast('Generating PDF...', 'info');

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Use real attendance data for PDF
        const attData = getAttendanceForPeriod(bill.monthInt, bill.year).sort((a, b) => a.dateObj - b.dateObj);

        // Header
        doc.setFillColor(25, 135, 84).rect(0, 0, 210, 35, 'F');
        doc.setFontSize(24).setTextColor(255).setFont('helvetica', 'bold').text('MessHub', 15, 15);
        doc.setFontSize(10).setFont('helvetica', 'normal').text('Bill ID: #BILL-' + String(bill.id).padStart(4, '0'), 150, 12);

        // Info
        doc.setTextColor(0).setFontSize(12).setFont('helvetica', 'bold').text('Bill To: ' + currentUser.name, 15, 50);
        doc.setFontSize(10).setFont('helvetica', 'normal').text(`Month: ${bill.month}`, 15, 57);

        // Table
        doc.autoTable({
            startY: 65, head: [['Date', 'Type', 'Tea', 'Food', 'Price']],
            body: attData.map(a => [
                `${a.dateObj.getDate()}/${a.dateObj.getMonth() + 1}`,
                a.mealType,
                a.teaWater ? 'Y' : 'N',
                a.food ? 'Y' : 'N',
                a.foodPrice ? fmtMoney(a.foodPrice) : '-'
            ]),
            theme: 'grid', headStyles: { fillColor: [25, 135, 84] }
        });

        // Summary
        let y = doc.lastAutoTable.finalY + 10;
        if (y > 270) { doc.addPage(); y = 20; } // Check page overflow

        doc.text('Summary', 15, y);
        doc.line(15, y + 2, 195, y + 2);
        y += 10;

        const summaryItems = [
            ['Tea/Water', bill.breakdown.teaWater],
            ['Food', bill.breakdown.mealsTotal]
        ];
        if (bill.breakdown.messFee > 0) summaryItems.push(['Mess Fee', bill.breakdown.messFee]);

        summaryItems.forEach(([l, v]) => {
            doc.text(`${l}:`, 20, y); doc.text(fmtMoney(v), 180, y, { align: 'right' }); y += 7;
        });

        doc.setFont('helvetica', 'bold').text('Total:', 20, y + 5).text(fmtMoney(bill.amount), 180, y + 5, { align: 'right' });

        doc.save(`Bill_${bill.id}.pdf`);
        showToast('PDF downloaded!', 'success');
    } catch (e) { console.error(e); showToast('PDF generation failed', 'error'); }
};

const calculatePaymentSummary = () => {
    const yrVal = getVal('yearFilter');
    const yr = yrVal === 'all' ? new Date().getFullYear() : parseInt(yrVal);

    // Filter billsData, not window.messData directly
    const b = billsData.filter(x => x.year === yr);

    const totals = b.reduce((acc, x) => {
        acc.total += x.amount;
        if (x.status === 'paid') acc.paid += x.amount;
        else acc.unpaid += x.amount;
        return acc;
    }, { paid: 0, unpaid: 0, total: 0 });

    setTxt('totalPaid', fmtMoney(totals.paid));
    setTxt('totalUnpaid', fmtMoney(totals.unpaid));
    setTxt('avgBill', fmtMoney(b.length ? Math.round(totals.total / b.length) : 0));
    setTxt('totalAmount', fmtMoney(totals.total));
};

const showToast = (msg, type = 'info') => {
    let box = document.querySelector('.toast-container');
    if (!box) { box = document.createElement('div'); box.className = 'toast-container'; document.body.appendChild(box); }

    const t = document.createElement('div');
    const colors = { success: '#198754', error: '#dc3545', info: '#0dcaf0' };
    t.className = `custom-toast ${type}`;
    t.innerHTML = `<i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info-circle'}" style="font-size:1.5rem;color:${colors[type]}"></i><div><strong>${type.charAt(0).toUpperCase() + type.slice(1)}</strong><p class="m-0 text-muted small">${msg}</p></div>`;

    box.appendChild(t);
    setTimeout(() => { t.style.animation = 'slideOut 0.3s forwards'; setTimeout(() => t.remove(), 300); }, 3000);
};

// CSS Injection for Toast Animation
const style = document.createElement('style');
style.textContent = `@keyframes slideOut { to { transform: translateX(400px); opacity: 0; } }`;
document.head.appendChild(style);