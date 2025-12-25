// Admin Disputes Management JavaScript
const getEl = id => document.getElementById(id);
const formatDate = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// Sample disputes data from users
let disputesData = [
    {
        id: 1,
        oderId: "DSP-0001",
        memberId: "MEM001",
        memberName: "Ahmed Ali",
        username: "ahmed.ali",
        department: "Engineering",
        date: "2025-12-20",
        status: "pending",
        type: "wrong_attendance",
        typeLabel: "Wrong Attendance Marked",
        relatedMonth: "December 2025",
        attendanceRecords: [
            { date: "2025-12-18", mealType: "Lunch", currentRecord: { present: true }, memberClaim: { present: false } },
            { date: "2025-12-18", mealType: "Dinner", currentRecord: { present: true }, memberClaim: { present: false } }
        ],
        reason: "I was not present on December 18th for lunch as I was on leave. Please verify with the leave records. I have attached my leave application for reference.",
        adminResponse: null,
        resolvedDate: null
    },
    {
        id: 2,
        oderId: "DSP-0002",
        memberId: "MEM002",
        memberName: "Sara Khan",
        username: "sara.khan",
        department: "HR",
        date: "2025-12-19",
        status: "pending",
        type: "missing_attendance",
        typeLabel: "Missing Attendance",
        relatedMonth: "December 2025",
        attendanceRecords: [
            { date: "2025-12-17", mealType: "Dinner", currentRecord: { present: false }, memberClaim: { present: true } }
        ],
        reason: "My attendance for dinner on December 17th was not marked. I was present and had dinner with my colleagues. You can verify with CCTV footage.",
        adminResponse: null,
        resolvedDate: null
    },
    {
        id: 3,
        oderId: "DSP-0003",
        memberId: "MEM003",
        memberName: "Hassan Raza",
        username: "hassan.raza",
        department: "Finance",
        date: "2025-12-15",
        status: "resolved",
        type: "wrong_meal_type",
        typeLabel: "Wrong Meal Type",
        relatedMonth: "December 2025",
        attendanceRecords: [
            { date: "2025-12-14", mealType: "Dinner", currentRecord: { present: true }, memberClaim: { present: true, correctMeal: "Lunch" } }
        ],
        reason: "I had lunch on December 14th, not dinner. Please correct the meal type in my attendance record.",
        adminResponse: {
            message: "Thank you for bringing this to our attention. After reviewing the attendance logs and CCTV footage, we have confirmed that you attended lunch, not dinner. The meal type has been corrected from Dinner to Lunch for December 14th. Your bill will be adjusted accordingly.",
            respondedBy: "Admin",
            respondedDate: "2025-12-16",
            correctionApplied: true
        },
        resolvedDate: "2025-12-16"
    },
    {
        id: 4,
        oderId: "DSP-0004",
        memberId: "MEM004",
        memberName: "Fatima Noor",
        username: "fatima.noor",
        department: "Marketing",
        date: "2025-12-12",
        status: "rejected",
        type: "billing",
        typeLabel: "Incorrect Amount Charged",
        relatedMonth: "December 2025",
        attendanceRecords: [
            { date: "2025-12-10", mealType: "Lunch", currentRecord: { present: true, amount: 200 }, memberClaim: { present: true, amount: 150 } },
            { date: "2025-12-11", mealType: "Lunch", currentRecord: { present: true, amount: 200 }, memberClaim: { present: true, amount: 150 } }
        ],
        reason: "I was charged Rs. 200 for lunch on these days but the menu showed Rs. 150. This is incorrect billing.",
        adminResponse: {
            message: "After reviewing the records, the charges are correct. On December 10th and 11th, the lunch menu included special items (Chicken Biryani) which were priced at Rs. 200 as per the special menu announcement. The regular menu price of Rs. 150 does not apply to special menu days. We apologize for any confusion.",
            respondedBy: "Admin",
            respondedDate: "2025-12-14",
            correctionApplied: false
        },
        resolvedDate: "2025-12-14"
    },
    {
        id: 5,
        oderId: "DSP-0005",
        memberId: "MEM001",
        memberName: "Ahmed Ali",
        username: "ahmed.ali",
        department: "Engineering",
        date: "2025-12-10",
        status: "resolved",
        type: "wrong_attendance",
        typeLabel: "Wrong Attendance Marked",
        relatedMonth: "December 2025",
        attendanceRecords: [
            { date: "2025-12-08", mealType: "Lunch", currentRecord: { present: true }, memberClaim: { present: false } },
            { date: "2025-12-09", mealType: "Lunch", currentRecord: { present: true }, memberClaim: { present: false } }
        ],
        reason: "I was on sick leave from Dec 8-9 and did not attend the mess. Hospital documents attached as proof.",
        adminResponse: {
            message: "Your medical leave has been verified with the HR department. The attendance for December 8-9 has been removed from your record and your bill has been adjusted. We hope you are feeling better now!",
            respondedBy: "Admin",
            respondedDate: "2025-12-11",
            correctionApplied: true
        },
        resolvedDate: "2025-12-11"
    },
    {
        id: 6,
        oderId: "DSP-0006",
        memberId: "MEM005",
        memberName: "Usman Sheikh",
        username: "usman.sheikh",
        department: "Operations",
        date: "2025-12-21",
        status: "pending",
        type: "food_quality",
        typeLabel: "Food Quality Issue",
        relatedMonth: "December 2025",
        attendanceRecords: [
            { date: "2025-12-20", mealType: "Dinner", currentRecord: { present: true }, memberClaim: { present: true, refundRequested: true } }
        ],
        reason: "The food quality was very poor on December 20th dinner. The rice was undercooked and the curry was too salty. I request a refund for this meal.",
        adminResponse: null,
        resolvedDate: null
    }
];

let currentDispute = null;
let responseType = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadDisputes();
    updateStats();
    setupSidebar();
    updatePendingBadge();
});

function setupSidebar() {
    const toggle = getEl('sidebarToggle'), sidebar = document.querySelector('.sidebar'), overlay = getEl('sidebarOverlay');
    if (toggle) toggle.addEventListener('click', () => { sidebar.classList.toggle('show'); overlay.classList.toggle('show'); });
    if (overlay) overlay.addEventListener('click', () => { sidebar.classList.remove('show'); overlay.classList.remove('show'); });
}

function loadDisputes() {
    getEl('loadingState').style.display = 'none';
    applyFilters();
}

function applyFilters() {
    const status = getEl('statusFilter').value;
    const month = getEl('monthFilter').value;
    const search = getEl('searchInput').value.toLowerCase();

    let filtered = disputesData.filter(d => {
        const matchStatus = status === 'all' || d.status === status;
        const matchMonth = month === 'all' || new Date(d.date).getMonth() + 1 === parseInt(month);
        const matchSearch = !search || d.memberName.toLowerCase().includes(search) || d.username.toLowerCase().includes(search) || d.oderId.toLowerCase().includes(search);
        return matchStatus && matchMonth && matchSearch;
    });

    renderDisputes(filtered);
    updateStats();
}

function filterByStatus(status) {
    getEl('statusFilter').value = status;
    applyFilters();
}

function renderDisputes(disputes) {
    if (!disputes.length) {
        getEl('disputesList').innerHTML = '';
        getEl('emptyState').style.display = 'block';
        return;
    }

    getEl('emptyState').style.display = 'none';
    getEl('disputesList').innerHTML = disputes.map(d => {
        const attendanceBadges = d.attendanceRecords.map(a => `
            <div class="attendance-badge">
                <span class="date">${formatDate(a.date)}</span>
                <span class="meal ${a.mealType.toLowerCase()}">${a.mealType}</span>
            </div>
        `).join('');

        const actionBtn = d.status === 'pending'
            ? `<button class="btn-review" onclick="reviewDispute(${d.id})"><i class="bi bi-clipboard-check"></i> Review</button>`
            : `<button class="btn-review btn-view-only" onclick="reviewDispute(${d.id})"><i class="bi bi-eye"></i> View</button>`;

        const priorityBadge = d.status === 'pending' ? '<span class="priority-badge"><i class="bi bi-exclamation-circle"></i> Needs Review</span>' : '';

        return `
            <div class="dispute-card ${d.status}">
                <div class="dispute-card-header">
                    <div class="dispute-header-left">
                        <div class="dispute-avatar">${d.memberName.charAt(0)}</div>
                        <div class="dispute-member-info">
                            <h6>${d.memberName} ${priorityBadge}</h6>
                            <span>@${d.username} • ${d.memberId}</span>
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
                            <span>Month: <strong>${d.relatedMonth}</strong></span>
                        </div>
                    </div>
                    
                    <div class="dispute-attendance-preview">
                        <h6><i class="bi bi-calendar-check me-2"></i>Disputed Attendance</h6>
                        <div class="attendance-badges">${attendanceBadges}</div>
                    </div>
                </div>
                <div class="dispute-card-footer">
                    <div class="dispute-date">
                        <i class="bi bi-calendar3"></i>
                        <span>Submitted: ${formatDate(d.date)}</span>
                        ${d.resolvedDate ? `<span class="ms-3"><i class="bi bi-check2-circle me-1"></i>Resolved: ${formatDate(d.resolvedDate)}</span>` : ''}
                    </div>
                    <div class="dispute-actions">
                        ${actionBtn}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function reviewDispute(id) {
    currentDispute = disputesData.find(d => d.id === id);
    if (!currentDispute) return;

    const d = currentDispute;

    // Update header
    getEl('reviewDisputeId').textContent = `Dispute ${d.oderId}`;
    getEl('reviewSubmittedDate').textContent = `Submitted: ${formatDate(d.date)}`;

    // Update status badge
    const statusBadge = getEl('reviewStatusBadge');
    statusBadge.textContent = d.status.charAt(0).toUpperCase() + d.status.slice(1);
    statusBadge.className = 'badge ' + (d.status === 'resolved' ? 'bg-success' : d.status === 'rejected' ? 'bg-danger' : 'bg-warning text-dark');

    // Update member info
    getEl('reviewMemberName').textContent = d.memberName;
    getEl('reviewMemberUsername').textContent = '@' + d.username;
    getEl('reviewMemberDepartment').textContent = d.department || 'N/A';

    // Update dispute details
    getEl('reviewDisputeType').textContent = d.typeLabel;
    getEl('reviewRelatedMonth').textContent = d.relatedMonth;

    // Update attendance records table - showing Current Record and Member Claims
    const attendanceBody = getEl('attendanceRecordsBody');
    attendanceBody.innerHTML = d.attendanceRecords.map(a => {
        const currentStatus = a.currentRecord.present
            ? '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Present</span>'
            : '<span class="badge bg-secondary"><i class="bi bi-x-circle me-1"></i>Absent</span>';

        let memberClaimStatus;
        if (a.memberClaim.present) {
            if (a.memberClaim.correctMeal) {
                memberClaimStatus = `<span class="badge bg-info"><i class="bi bi-arrow-repeat me-1"></i>Should be ${a.memberClaim.correctMeal}</span>`;
            } else if (a.memberClaim.refundRequested) {
                memberClaimStatus = '<span class="badge bg-warning text-dark"><i class="bi bi-cash me-1"></i>Refund Requested</span>';
            } else {
                memberClaimStatus = '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Was Present</span>';
            }
        } else {
            memberClaimStatus = '<span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i>Was Absent</span>';
        }

        return `
            <tr>
                <td><strong>${formatDate(a.date)}</strong></td>
                <td><span class="badge ${a.mealType === 'Lunch' ? 'bg-warning text-dark' : 'bg-primary'}">${a.mealType}</span></td>
                <td>${currentStatus}</td>
                <td>${memberClaimStatus}</td>
            </tr>
        `;
    }).join('');

    // Show/hide action buttons based on status
    if (d.status === 'pending') {
        getEl('rejectBtn').style.display = 'inline-flex';
        getEl('approveBtn').style.display = 'inline-flex';
    } else {
        getEl('rejectBtn').style.display = 'none';
        getEl('approveBtn').style.display = 'none';
    }

    // Show modal
    new bootstrap.Modal(getEl('reviewModal')).show();
}

function openResponseModal(type) {
    responseType = type;

    // Close review modal
    bootstrap.Modal.getInstance(getEl('reviewModal')).hide();

    const d = currentDispute;

    // Update response modal header
    const header = getEl('responseModalHeader');
    const title = getEl('responseModalTitle');
    const indicator = getEl('responseTypeIndicator');
    const submitBtn = getEl('submitResponseBtn');
    const correctionDiv = getEl('correctionCheckboxDiv');

    if (type === 'approve') {
        header.className = 'modal-header bg-success text-white';
        title.innerHTML = '<i class="bi bi-check-circle me-2"></i>Approve Dispute';
        indicator.className = 'response-type-indicator approve';
        indicator.innerHTML = `
            <i class="bi bi-check-circle-fill"></i>
            <h5>Approving Dispute</h5>
            <p class="text-muted mb-0">The member's dispute will be marked as resolved.</p>
        `;
        submitBtn.className = 'btn btn-success';
        submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Approve & Send';
        correctionDiv.style.display = 'block';
    } else {
        header.className = 'modal-header bg-danger text-white';
        title.innerHTML = '<i class="bi bi-x-circle me-2"></i>Reject Dispute';
        indicator.className = 'response-type-indicator reject';
        indicator.innerHTML = `
            <i class="bi bi-x-circle-fill"></i>
            <h5>Rejecting Dispute</h5>
            <p class="text-muted mb-0">Please provide a reason for rejecting this dispute.</p>
        `;
        submitBtn.className = 'btn btn-danger';
        submitBtn.innerHTML = '<i class="bi bi-x-circle me-2"></i>Reject & Send';
        correctionDiv.style.display = 'none';
    }

    // Update summary
    getEl('summaryDisputeId').textContent = d.oderId;
    getEl('summaryMemberName').textContent = d.memberName;
    getEl('summaryDisputeType').textContent = d.typeLabel;

    // Clear previous message
    getEl('responseMessage').value = '';
    getEl('applyCorrection').checked = true;

    // Show response modal after a brief delay
    setTimeout(() => {
        new bootstrap.Modal(getEl('responseModal')).show();
    }, 300);
}

function submitResponse() {
    const message = getEl('responseMessage').value.trim();
    const adminReason = getEl('adminReason') ? getEl('adminReason').value.trim() : '';

    if (!message) {
        showToast('Please enter a response message', 'error');
        return;
    }

    if (message.length < 20) {
        showToast('Response message should be at least 20 characters', 'error');
        return;
    }

    const applyCorrection = responseType === 'approve' ? getEl('applyCorrection').checked : false;

    // Update dispute data
    currentDispute.status = responseType === 'approve' ? 'resolved' : 'rejected';
    currentDispute.resolvedDate = new Date().toISOString().split('T')[0];
    currentDispute.adminReason = adminReason; // Save the admin reason
    currentDispute.adminResponse = {
        message: message,
        respondedBy: 'Admin',
        respondedDate: new Date().toISOString().split('T')[0],
        correctionApplied: applyCorrection
    };

    // Close modal
    bootstrap.Modal.getInstance(getEl('responseModal')).hide();

    // Refresh list
    applyFilters();
    updatePendingBadge();

    // Show success message
    const action = responseType === 'approve' ? 'approved' : 'rejected';
    showToast(`Dispute ${currentDispute.oderId} has been ${action} successfully!`, 'success');

    // Reset
    currentDispute = null;
    responseType = null;
}

function updateStats() {
    const total = disputesData.length;
    const pending = disputesData.filter(d => d.status === 'pending').length;
    const resolved = disputesData.filter(d => d.status === 'resolved').length;
    const rejected = disputesData.filter(d => d.status === 'rejected').length;

    getEl('totalDisputes').textContent = total;
    getEl('pendingDisputes').textContent = pending;
    getEl('resolvedDisputes').textContent = resolved;
    getEl('rejectedDisputes').textContent = rejected;
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

    const icons = { success: 'check-circle-fill', error: 'x-circle-fill', info: 'info-circle-fill', warning: 'exclamation-triangle-fill' };
    const colors = { success: '#198754', error: '#dc3545', info: '#0dcaf0', warning: '#ffc107' };
    const titles = { success: 'Success', error: 'Error', info: 'Info', warning: 'Warning' };

    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    toast.innerHTML = `
        <i class="bi bi-${icons[type]}" style="font-size:1.5rem;color:${colors[type]};"></i>
        <div>
            <strong>${titles[type]}</strong>
            <p style="margin:0;color:#6c757d;font-size:0.9rem;">${message}</p>
        </div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}