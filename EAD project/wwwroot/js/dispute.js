// Admin Disputes Management JavaScript
const getEl = id => document.getElementById(id);
const formatDate = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const fmtMoney = n => `Rs. ${n.toLocaleString()}`;

let disputesData = [];
let currentDispute = null;
let responseType = null;

// Constant: Tea + Water Price
const TEA_CHARGE = 50;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (window.disputeBackendData) {
        processBackendData();
    } else {
        console.error("No backend data found.");
    }

    updateStats();
    setupSidebar();
    updatePendingBadge();
    loadDisputes();
});

// --- Process Data ---
function processBackendData() {
    const rawReqs = window.disputeBackendData.requests;
    const rawAtts = window.disputeBackendData.attendances;

    disputesData = rawReqs.map(req => {
        const att = rawAtts.find(a => a.attendanceId === req.attendanceId);
        const dateObj = new Date(req.requestDate);
        const monthStr = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
        const statusLower = (req.status || 'pending').toLowerCase();

        return {
            id: req.requestId,
            oderId: `DSP-${String(req.requestId).padStart(4, '0')}`,
            memberId: `MEM-${req.userId}`,
            memberName: req.userName,
            email: req.userEmail || req.userName,
            department: req.userDept,
            date: req.requestDate,
            status: statusLower,
            typeLabel: att ? `Dispute: ${att.mealType}` : "Attendance Dispute",
            relatedMonth: monthStr,

            attendanceRecords: att ? [{
                date: att.date,
                mealType: att.mealType,
                currentRecord: {
                    present: att.food, // True if Food marked
                    teaWater: att.teaWater,
                    amount: att.foodPrice
                },
                memberClaim: { present: false }
            }] : [],

            reason: "Reason not specified.",

            adminResponse: req.adminMessage ? {
                message: req.adminMessage,
                respondedBy: "Admin",
                respondedDate: new Date().toISOString()
            } : null,

            resolvedDate: statusLower !== 'pending' ? new Date().toISOString() : null
        };
    });
}

function setupSidebar() {
    const toggle = getEl('sidebarToggle'), sidebar = document.querySelector('.sidebar'), overlay = getEl('sidebarOverlay');
    if (toggle) toggle.onclick = () => { sidebar.classList.toggle('show'); overlay.classList.toggle('show'); };
    if (overlay) overlay.onclick = () => { sidebar.classList.remove('show'); overlay.classList.remove('show'); };
}

function loadDisputes() {
    const loader = getEl('loadingState');
    if (loader) loader.style.display = 'none';
    applyFilters();
}

function applyFilters() {
    const status = getEl('statusFilter').value;
    const search = getEl('searchInput').value.toLowerCase();

    let filtered = disputesData.filter(d => {
        const matchStatus = status === 'all' || d.status === status;
        const matchSearch = !search ||
            d.memberName.toLowerCase().includes(search) ||
            d.oderId.toLowerCase().includes(search);
        return matchStatus && matchSearch;
    });

    renderDisputes(filtered);
    updateStats();
}

function filterByStatus(status) {
    getEl('statusFilter').value = status;
    applyFilters();
}

// --- Render Cards ---
function renderDisputes(disputes) {
    const list = getEl('disputesList');
    if (!disputes.length) {
        list.innerHTML = '';
        getEl('emptyState').style.display = 'block';
        return;
    }

    getEl('emptyState').style.display = 'none';
    list.innerHTML = disputes.map(d => {
        const isResolved = d.status === 'resolved' || d.status === 'approved';

        // --- GREEN BAR LOGIC ---
        // If resolved, badge is green (success), else primary/warning
        const badgeClass = isResolved ? 'bg-success text-white' : 'bg-primary text-white';
        const priceDisplay = isResolved ? fmtMoney(TEA_CHARGE) : fmtMoney(d.attendanceRecords[0]?.currentRecord.amount || 0);

        const attendanceBadges = d.attendanceRecords.map(a => `
            <div class="attendance-badge ${isResolved ? 'border-success' : ''}">
                <span class="date">${formatDate(a.date)}</span>
                <span class="badge ${badgeClass} me-2">${a.mealType}</span>
                <span class="price-tag fw-bold">${priceDisplay}</span>
            </div>
        `).join('');

        const actionBtn = d.status === 'pending'
            ? `<button class="btn-review" onclick="reviewDispute(${d.id})"><i class="bi bi-clipboard-check"></i> Review</button>`
            : `<button class="btn-review btn-view-only" onclick="reviewDispute(${d.id})"><i class="bi bi-eye"></i> View</button>`;

        const priorityBadge = d.status === 'pending' ? '<span class="priority-badge"><i class="bi bi-exclamation-circle"></i> Needs Review</span>' : '';
        const displayEmail = d.email.includes('@') ? d.email : `@${d.email}`;

        // Add green border to card if resolved
        const cardClass = isResolved ? 'dispute-card resolved border-success' : `dispute-card ${d.status}`;

        return `
            <div class="${cardClass}">
                <div class="dispute-card-header">
                    <div class="dispute-header-left">
                        <div class="dispute-avatar">${d.memberName.charAt(0)}</div>
                        <div class="dispute-member-info">
                            <h6>${d.memberName} ${priorityBadge}</h6>
                            <span>${displayEmail}</span>
                        </div>
                    </div>
                    <div class="dispute-header-right">
                        <span class="dispute-id">${d.oderId}</span>
                        <span class="dispute-status ${d.status}">${d.status}</span>
                    </div>
                </div>
                <div class="dispute-card-body">
                    <div class="dispute-meta-row">
                        <div class="dispute-meta-item">
                            <i class="bi bi-tag"></i>
                            <span class="dispute-type-badge">${d.typeLabel}</span>
                        </div>
                        <div class="dispute-meta-item">
                            <i class="bi bi-calendar-month"></i>
                            <span>${d.relatedMonth}</span>
                        </div>
                    </div>
                    <div class="dispute-attendance-preview">
                        <h6><i class="bi bi-currency-dollar me-2"></i>Record Details</h6>
                        <div class="attendance-badges">${attendanceBadges}</div>
                    </div>
                </div>
                <div class="dispute-card-footer">
                    <div class="dispute-date">
                        <i class="bi bi-calendar3"></i>
                        <span>Submitted: ${formatDate(d.date)}</span>
                    </div>
                    <div class="dispute-actions">${actionBtn}</div>
                </div>
            </div>
        `;
    }).join('');
}

// --- Review Modal ---
function reviewDispute(id) {
    currentDispute = disputesData.find(d => d.id === id);
    if (!currentDispute) return;

    const d = currentDispute;
    getEl('reviewDisputeId').textContent = `Dispute ${d.oderId}`;
    getEl('reviewSubmittedDate').textContent = `Submitted: ${formatDate(d.date)}`;

    // Status Badge Logic
    const statusBadge = getEl('reviewStatusBadge');
    if (d.status === 'pending') {
        statusBadge.textContent = 'Pending';
        statusBadge.className = 'badge bg-warning text-dark';
    } else if (d.status === 'rejected') {
        statusBadge.textContent = 'Rejected';
        statusBadge.className = 'badge bg-danger';
    } else {
        statusBadge.textContent = 'Approved';
        statusBadge.className = 'badge bg-success';
    }

    getEl('reviewMemberName').textContent = d.memberName;
    if (getEl('reviewMemberUsername')) getEl('reviewMemberUsername').textContent = d.email.includes('@') ? d.email : `@${d.email}`;
    getEl('reviewMemberDepartment').textContent = d.department || 'N/A';
    getEl('reviewDisputeType').textContent = d.typeLabel;
    getEl('reviewRelatedMonth').textContent = d.relatedMonth;

    const attendanceBody = getEl('attendanceRecordsBody');
    attendanceBody.innerHTML = d.attendanceRecords.map(a => {
        let statusHtml = '';
        let rowClass = '';

        if (d.status === 'resolved' || d.status === 'approved') {
            // GREEN BAR logic for Modal: Show resolved state
            statusHtml = `<span class="badge bg-success"><i class="bi bi-check-circle"></i> Resolved: Tea Only</span>`;
            rowClass = 'table-success'; // Bootstrap green row
        } else {
            // Original State
            statusHtml = a.currentRecord.present
                ? `<span class="badge bg-danger">Charged (Food)</span>`
                : `<span class="badge bg-secondary">Absent</span>`;
        }

        return `
            <tr class="${rowClass}">
                <td><strong>${formatDate(a.date)}</strong></td>
                <td><span class="badge ${a.mealType === 'Lunch' ? 'bg-warning text-dark' : 'bg-primary'}">${a.mealType}</span></td>
                <td>${statusHtml} <br> <small>${fmtMoney(a.currentRecord.amount)}</small></td>
                <td><span class="badge bg-info text-dark">Disputed</span></td>
            </tr>
        `;
    }).join('');

    if (d.status === 'pending') {
        getEl('rejectBtn').style.display = 'inline-flex';
        getEl('approveBtn').style.display = 'inline-flex';
    } else {
        getEl('rejectBtn').style.display = 'none';
        getEl('approveBtn').style.display = 'none';
    }

    new bootstrap.Modal(getEl('reviewModal')).show();
}

function openResponseModal(type) {
    responseType = type;
    bootstrap.Modal.getInstance(getEl('reviewModal')).hide();

    const header = getEl('responseModalHeader');
    const title = getEl('responseModalTitle');
    const indicator = getEl('responseTypeIndicator');
    const submitBtn = getEl('submitResponseBtn');
    const correctionDiv = getEl('correctionCheckboxDiv');

    if (type === 'approve') {
        header.className = 'modal-header bg-success text-white';
        title.innerHTML = '<i class="bi bi-check-circle me-2"></i>Approve Dispute';
        indicator.className = 'response-type-indicator approve';
        indicator.innerHTML = `<i class="bi bi-check-circle-fill"></i><h5>Approving</h5>`;
        submitBtn.className = 'btn btn-success';
        submitBtn.innerHTML = 'Approve & Send';
        if (correctionDiv) correctionDiv.style.display = 'block';
    } else {
        header.className = 'modal-header bg-danger text-white';
        title.innerHTML = '<i class="bi bi-x-circle me-2"></i>Reject Dispute';
        indicator.className = 'response-type-indicator reject';
        indicator.innerHTML = `<i class="bi bi-x-circle-fill"></i><h5>Rejecting</h5>`;
        submitBtn.className = 'btn btn-danger';
        submitBtn.innerHTML = 'Reject & Send';
        if (correctionDiv) correctionDiv.style.display = 'none';
    }

    getEl('summaryDisputeId').textContent = currentDispute.oderId;
    getEl('summaryMemberName').textContent = currentDispute.memberName;
    getEl('summaryDisputeType').textContent = currentDispute.typeLabel;
    getEl('responseMessage').value = '';

    if (getEl('applyCorrection')) getEl('applyCorrection').checked = true;

    setTimeout(() => { new bootstrap.Modal(getEl('responseModal')).show(); }, 300);
}

// --- Submit Response ---
async function submitResponse() {
    const message = getEl('responseMessage').value.trim();
    if (!message) { showToast('Please enter a message', 'error'); return; }

    const applyCorrection = responseType === 'approve' ? getEl('applyCorrection').checked : false;
    const statusStr = responseType === 'approve' ? 'Approved' : 'Rejected';

    showToast("Processing...", "info");

    const payload = {
        RequestId: currentDispute.id,
        Status: statusStr,
        AdminMessage: message,
        ApplyCorrection: applyCorrection
    };

    try {
        const response = await fetch('/Dispute/ResolveDispute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        // Update Local UI State
        currentDispute.status = statusStr.toLowerCase();
        currentDispute.resolvedDate = new Date().toISOString();
        currentDispute.adminResponse = { message: message };

        // VISUAL UPDATE: Apply Green Bar Logic
        if (applyCorrection && currentDispute.attendanceRecords.length > 0) {
            currentDispute.attendanceRecords[0].currentRecord.present = false; // Food absent
            currentDispute.attendanceRecords[0].currentRecord.teaWater = true; // Tea present
            currentDispute.attendanceRecords[0].currentRecord.amount = TEA_CHARGE; // 50
        }

        bootstrap.Modal.getInstance(getEl('responseModal')).hide();
        applyFilters(); // Re-renders the list, turning bars green
        updatePendingBadge();
        showToast(`Dispute ${currentDispute.oderId} resolved!`, 'success');
        currentDispute = null;

    } catch (err) {
        console.error(err);
        showToast('Error: ' + err.message, 'error');
    }
}

function updateStats() {
    getEl('totalDisputes').textContent = disputesData.length;
    getEl('pendingDisputes').textContent = disputesData.filter(d => d.status === 'pending').length;
    getEl('resolvedDisputes').textContent = disputesData.filter(d => d.status === 'approved' || d.status === 'resolved').length;
    getEl('rejectedDisputes').textContent = disputesData.filter(d => d.status === 'rejected').length;
}

function updatePendingBadge() {
    const pending = disputesData.filter(d => d.status === 'pending').length;
    const badge = getEl('pendingBadge');
    if (badge) {
        badge.textContent = pending;
        badge.style.display = pending > 0 ? 'block' : 'none';
    }
}

function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const colors = { success: '#198754', error: '#dc3545', info: '#0dcaf0' };
    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    toast.innerHTML = `<i class="bi bi-info-circle-fill" style="color:${colors[type]}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}