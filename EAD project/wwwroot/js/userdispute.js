// User Disputes Page JavaScript - DB Connected
const getEl = id => document.getElementById(id);
const formatDate = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

let currentUser = { name: "Guest", id: "" };
let disputesData = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (window.userDisputeData) {
        processBackendData();
    } else {
        console.error("No backend data found.");
    }

    if (getEl('userName')) getEl('userName').textContent = currentUser.name;

    loadDisputes();
    updateStats();
    setupSidebarToggle();
});

// --- 1. Process Backend Data ---
function processBackendData() {
    currentUser = window.userDisputeData.currentUser;
    const rawRequests = window.userDisputeData.requests;

    disputesData = rawRequests.map(req => {
        // Normalize Status (DB is PascalCase, JS needs lowercase for CSS)
        const statusLower = (req.status || 'pending').toLowerCase();

        // Determine Resolved Date (Use Request Date + 1 day as proxy if not in DB, or null if pending)
        const resolvedDt = statusLower !== 'pending' ? new Date(new Date(req.requestDate).getTime() + 86400000).toISOString() : null;

        // Map Meal Type logic
        const isLunch = req.mealType === "Lunch";

        return {
            id: req.requestId,
            oderId: `DSP-${String(req.requestId).padStart(4, '0')}`,
            submittedDate: req.requestDate,
            status: statusLower, // pending, approved, rejected

            typeLabel: `Dispute: ${req.mealType} Attendance`, // "Dispute: Lunch Attendance"
            disputedDate: req.attendanceDate,

            // Map the single DB record to the UI structure
            currentAttendance: {
                lunch: isLunch ? { teaWater: req.teaWater, food: req.food } : null,
                dinner: !isLunch ? { teaWater: req.teaWater, food: req.food } : null
            },

            adminResponse: req.adminMessage ? {
                message: req.adminMessage,
                respondedBy: "Admin",
                respondedDate: resolvedDt || new Date().toISOString(),
                correctionApplied: statusLower === 'approved' // Map Approved to Correction Applied
            } : null,

            resolvedDate: resolvedDt
        };
    });
}

function loadDisputes() {
    const filter = getEl('statusFilter').value;
    // Map UI filter values to DB status values
    // UI: 'resolved' -> DB: 'approved'

    let filtered = disputesData;

    if (filter !== 'all') {
        filtered = disputesData.filter(d => {
            if (filter === 'resolved') return d.status === 'approved' || d.status === 'resolved';
            return d.status === filter;
        });
    }

    if (!filtered.length) {
        getEl('disputesContainer').style.display = 'none';
        getEl('emptyState').style.display = 'block';
        return;
    }

    getEl('emptyState').style.display = 'none';
    getEl('disputesContainer').style.display = 'flex';
    getEl('disputesContainer').innerHTML = filtered.map(d => renderDisputeCard(d)).join('');
}

function renderDisputeCard(d) {
    const chk = '<i class="bi bi-check-circle-fill text-success"></i>';
    const x = '<i class="bi bi-x-circle-fill text-danger"></i>';
    const na = '<span class="text-muted">-</span>'; // Not Applicable

    let adminResponseHTML = '';
    if (d.adminResponse) {
        // Handle both 'rejected' and 'Rejected' cases
        const isRejected = d.status.toLowerCase() === 'rejected';

        adminResponseHTML = `
            <div class="admin-response ${isRejected ? 'rejected' : ''}">
                <div class="admin-response-header">
                    <div class="admin-avatar"><i class="bi bi-person-fill"></i></div>
                    <div class="admin-info">
                        <h6>${isRejected ? 'Dispute Rejected' : 'Admin Response'}</h6>
                        <span>${formatDate(d.adminResponse.respondedDate)}</span>
                    </div>
                </div>
                <div class="admin-message">
                    <p>${d.adminResponse.message}</p>
                </div>
                ${d.adminResponse.correctionApplied ? `
                    <div class="correction-applied">
                        <i class="bi bi-check-circle-fill"></i>
                        <span>Correction has been applied to your attendance</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Status Badge Logic
    let statusClass = d.status;
    let statusText = d.status;
    if (d.status === 'approved') { statusClass = 'resolved'; statusText = 'Resolved'; }

    return `
        <div class="dispute-card">
            <div class="dispute-card-header">
                <div>
                    <span class="dispute-id">#${d.oderId}</span>
                    <span class="dispute-date ms-3">Submitted: ${formatDate(d.submittedDate)}</span>
                </div>
                <span class="dispute-status ${statusClass}">${statusText.toUpperCase()}</span>
            </div>
            <div class="dispute-card-body">
                <span class="dispute-type">${d.typeLabel}</span>
                
                <div class="dispute-attendance-info">
                    <h6><i class="bi bi-calendar-check me-2"></i>Disputed Date: ${formatDate(d.disputedDate)}</h6>
                    <div class="attendance-comparison">
                        <div class="attendance-table-wrapper">
                            <table class="attendance-compare-table">
                                <thead>
                                    <tr>
                                        <th>Meal</th>
                                        <th class="text-center">Tea/Water</th>
                                        <th class="text-center">Food</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${d.currentAttendance.lunch ? `
                                    <tr>
                                        <td><span class="meal-badge lunch"><i class="bi bi-brightness-high-fill"></i> Lunch</span></td>
                                        <td class="text-center">${d.currentAttendance.lunch.teaWater ? chk : x}</td>
                                        <td class="text-center">${d.currentAttendance.lunch.food ? chk : x}</td>
                                    </tr>` : ''}
                                    ${d.currentAttendance.dinner ? `
                                    <tr>
                                        <td><span class="meal-badge dinner"><i class="bi bi-moon-fill"></i> Dinner</span></td>
                                        <td class="text-center">${d.currentAttendance.dinner.teaWater ? chk : x}</td>
                                        <td class="text-center">${d.currentAttendance.dinner.food ? chk : x}</td>
                                    </tr>` : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                ${adminResponseHTML}
            </div>
            <div class="dispute-card-footer">
                <div class="dispute-meta">
                    <span><i class="bi bi-calendar3"></i> Submitted: ${formatDate(d.submittedDate)}</span>
                    ${d.resolvedDate ? `<span><i class="bi bi-check2-circle"></i> Resolved: ${formatDate(d.resolvedDate)}</span>` : ''}
                </div>
                <div class="dispute-actions">
                    <button class="btn-dispute-action btn-view-details" onclick="viewDisputeDetails(${d.id})">
                        <i class="bi bi-eye"></i> View Details
                    </button>
                </div>
            </div>
        </div>
    `;
}

function viewDisputeDetails(id) {
    const d = disputesData.find(x => x.id === id);
    if (!d) return;

    // UI Status Mapping
    let statusClass = 'bg-warning';
    let statusText = 'PENDING';

    if (d.status === 'approved' || d.status === 'resolved') {
        statusClass = 'bg-success';
        statusText = 'RESOLVED';
    } else if (d.status === 'rejected') {
        statusClass = 'bg-danger';
        statusText = 'REJECTED';
    }

    const chk = '<i class="bi bi-check-circle-fill text-success"></i>';
    const x = '<i class="bi bi-x-circle-fill text-danger"></i>';

    let timelineItems = `
        <div class="timeline-item">
            <div class="timeline-dot submitted"></div>
            <div class="timeline-content">
                <h6>Dispute Submitted</h6>
                <p>${formatDate(d.submittedDate)}</p>
            </div>
        </div>
        <div class="timeline-item">
            <div class="timeline-dot ${d.status === 'pending' ? 'pending' : (d.status === 'approved' ? 'resolved' : d.status)}"></div>
            <div class="timeline-content">
                <h6>${d.status === 'pending' ? 'Awaiting Review' : (d.status === 'approved' ? 'Dispute Resolved' : 'Dispute Rejected')}</h6>
                <p>${d.resolvedDate ? formatDate(d.resolvedDate) : 'Pending admin review'}</p>
            </div>
        </div>
    `;

    let adminResponseSection = '';
    if (d.adminResponse) {
        const isRejected = d.status === 'rejected';
        adminResponseSection = `
            <div class="detail-section">
                <h6><i class="bi bi-reply-fill"></i> Admin Response</h6>
                <div class="admin-response ${isRejected ? 'rejected' : ''}" style="margin-top: 0;">
                    <div class="admin-response-header">
                        <div class="admin-avatar"><i class="bi bi-person-fill"></i></div>
                        <div class="admin-info">
                            <h6>${d.adminResponse.respondedBy}</h6>
                            <span>${formatDate(d.adminResponse.respondedDate)}</span>
                        </div>
                    </div>
                    <div class="admin-message">
                        <p>${d.adminResponse.message}</p>
                    </div>
                    ${d.adminResponse.correctionApplied ? `
                        <div class="correction-applied">
                            <i class="bi bi-check-circle-fill"></i>
                            <span>Attendance record has been corrected</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getEl('viewDisputeContent').innerHTML = `
        <div class="dispute-detail-header">
            <h4><i class="bi bi-exclamation-triangle me-2"></i>Dispute #${d.oderId}</h4>
            <span class="badge ${statusClass}">${statusText}</span>
        </div>
        
        <div class="detail-section">
            <h6><i class="bi bi-info-circle"></i> Dispute Information</h6>
            <table class="detail-table">
                <tr><td>Dispute Type:</td><td>${d.typeLabel}</td></tr>
                <tr><td>Disputed Date:</td><td><strong>${formatDate(d.disputedDate)}</strong></td></tr>
                <tr><td>Submitted On:</td><td>${formatDate(d.submittedDate)}</td></tr>
            </table>
        </div>
        
        <div class="detail-section">
            <h6><i class="bi bi-calendar-check"></i> Attendance Record</h6>
            <div class="table-responsive">
                <table class="attendance-detail-table">
                    <thead>
                        <tr>
                            <th>Meal</th>
                            <th class="text-center">Tea/Water</th>
                            <th class="text-center">Food</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${d.currentAttendance.lunch ? `
                        <tr>
                            <td><span class="badge bg-warning"><i class="bi bi-brightness-high-fill me-1"></i>Lunch</span></td>
                            <td class="text-center">${d.currentAttendance.lunch.teaWater ? chk : x}</td>
                            <td class="text-center">${d.currentAttendance.lunch.food ? chk : x}</td>
                        </tr>` : ''}
                        ${d.currentAttendance.dinner ? `
                        <tr>
                            <td><span class="badge bg-primary"><i class="bi bi-moon-fill me-1"></i>Dinner</span></td>
                            <td class="text-center">${d.currentAttendance.dinner.teaWater ? chk : x}</td>
                            <td class="text-center">${d.currentAttendance.dinner.food ? chk : x}</td>
                        </tr>` : ''}
                    </tbody>
                </table>
            </div>
        </div>
        
        ${adminResponseSection}
        
        <div class="detail-section">
            <h6><i class="bi bi-clock-history"></i> Timeline</h6>
            <div class="dispute-timeline">${timelineItems}</div>
        </div>
    `;

    new bootstrap.Modal(getEl('viewDisputeModal')).show();
}

function filterDisputes() {
    loadDisputes();
}

function updateStats() {
    const total = disputesData.length;
    const pending = disputesData.filter(d => d.status === 'pending').length;
    const resolved = disputesData.filter(d => d.status === 'approved' || d.status === 'resolved').length;
    const rejected = disputesData.filter(d => d.status === 'rejected').length;

    getEl('totalDisputes').textContent = total;
    getEl('pendingDisputes').textContent = pending;
    getEl('approvedDisputes').textContent = resolved;
    getEl('rejectedDisputes').textContent = rejected;
}

function setupSidebarToggle() {
    const toggle = getEl('sidebarToggle'), sidebar = document.querySelector('.sidebar'), overlay = getEl('sidebarOverlay');
    if (toggle) toggle.addEventListener('click', () => { sidebar.classList.toggle('show'); overlay.classList.toggle('show'); });
    if (overlay) overlay.addEventListener('click', () => { sidebar.classList.remove('show'); overlay.classList.remove('show'); });
}

function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) { container = document.createElement('div'); container.className = 'toast-container'; document.body.appendChild(container); }
    const icons = { success: 'check-circle', error: 'x-circle', info: 'info-circle' }, colors = { success: '#198754', error: '#dc3545', info: '#0dcaf0' };
    const toast = document.createElement('div'); toast.className = `custom-toast ${type}`;
    toast.innerHTML = `<i class="bi bi-${icons[type]}" style="font-size:1.5rem;color:${colors[type]};"></i><div><strong>${type.charAt(0).toUpperCase() + type.slice(1)}</strong><p style="margin:0;color:#6c757d;font-size:0.9rem;">${message}</p></div>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'slideOut 0.3s ease'; setTimeout(() => toast.remove(), 300); }, 3000);
}