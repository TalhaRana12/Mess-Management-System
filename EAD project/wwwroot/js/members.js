// membersData is passed from Razor view
// <script>const membersData = @Html.Raw(Json.Serialize(Model));</script>

// DOM Elements
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const filterDepartment = document.getElementById('filterDepartment');
const membersTableBody = document.getElementById('membersTableBody');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const sidebarToggle = document.getElementById('sidebarToggle');

// Stats Elements
const totalMembersEl = document.getElementById('totalMembers');
const activeMembersEl = document.getElementById('activeMembers');
const inactiveMembersEl = document.getElementById('inactiveMembers');
const totalDepartmentsEl = document.getElementById('totalDepartments');

// Modal Elements
const editMemberModal = new bootstrap.Modal(document.getElementById('editMemberModal'));
const deleteMemberModal = new bootstrap.Modal(document.getElementById('deleteMemberModal'));
const viewMemberModal = new bootstrap.Modal(document.getElementById('viewMemberModal'));

// Current member being edited/deleted
let currentMemberId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    loadMembers();
    updateStats();
});

// Load Members into Table
function loadMembers(filteredData = null) {
    const data = filteredData || membersData;

    // Show loading
    loadingState.style.display = 'block';
    membersTableBody.innerHTML = '';
    emptyState.style.display = 'none';

    setTimeout(() => {
        loadingState.style.display = 'none';

        if (!data || data.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        data.forEach((member, index) => {
            const statusText = member.isActive ? 'Active' : 'Inactive';
            // Safe initial generation
            const nameStr = member.name || "Unknown";
            const initials = nameStr.replace(/\s+/g, '').substring(0, 2).toUpperCase();

            const row = document.createElement('tr');
            // Add opacity style if inactive
            if (!member.isActive) row.style.opacity = '0.6';

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>
                    <div class="member-info">
                        <div class="member-avatar">${initials}</div>
                        <div>
                            <div class="member-name">${member.name}</div>
                            <div class="member-username">${member.username}</div>
                        </div>
                    </div>
                </td>
                <td>${member.username}</td>
                <td>${member.cnic}</td>
                <td>${member.department}</td>
                <td>
                    <span class="status-badge ${member.isActive ? 'status-active' : 'status-inactive'}">
                        ${statusText}
                    </span>
                </td>
                <td>
                    <div class="action-btns">
                        <button class="btn-view" onclick="viewMember(${member.userId})" title="View">
                            <i class="bi bi-eye-fill"></i>
                        </button>
                        <button class="btn-edit" onclick="editMember(${member.userId})" title="Edit">
                            <i class="bi bi-pencil-fill"></i>
                        </button>
                        <button class="btn-delete" onclick="deleteMember(${member.userId})" title="Delete/Deactivate">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
                </td>
            `;
            membersTableBody.appendChild(row);
        });
    }, 200);
}

// Update Stats
function updateStats() {
    const total = membersData.length;
    const active = membersData.filter(m => m.isActive).length;
    const inactive = membersData.filter(m => !m.isActive).length;
    const uniqueDepartments = [...new Set(membersData.map(m => m.department))].length;

    totalMembersEl.textContent = total;
    activeMembersEl.textContent = active;
    inactiveMembersEl.textContent = inactive;
    totalDepartmentsEl.textContent = uniqueDepartments;
}

// Search Members
searchInput.addEventListener('input', function () {
    const query = this.value.toLowerCase().trim();
    clearSearchBtn.style.display = query ? 'block' : 'none';
    filterMembers();
});

// Clear Search
clearSearchBtn.addEventListener('click', function () {
    searchInput.value = '';
    this.style.display = 'none';
    filterMembers();
});

// Filter by Department
filterDepartment.addEventListener('change', function () {
    filterMembers();
});

// Combined Filter Function
function filterMembers() {
    const searchQuery = searchInput.value.toLowerCase().trim();
    const departmentFilter = filterDepartment.value;
    let filtered = membersData;

    if (searchQuery) {
        filtered = filtered.filter(member =>
            (member.username && member.username.toLowerCase().includes(searchQuery)) ||
            (member.name && member.name.toLowerCase().includes(searchQuery)) ||
            (member.cnic && member.cnic.includes(searchQuery))
        );
    }

    if (departmentFilter) {
        filtered = filtered.filter(member => member.department === departmentFilter);
    }

    loadMembers(filtered);
}

// View Member
function viewMember(id) {
    const member = membersData.find(m => m.userId === id);
    if (!member) return;

    document.getElementById('viewMemberName').textContent = member.username;
    document.getElementById('viewMemberEmail').textContent = member.name;
    document.getElementById('viewMemberUsername').textContent = member.username;
    document.getElementById('viewMemberPassword').textContent = member.passwordHash;
    document.getElementById('viewMemberCnic').textContent = member.cnic;
    document.getElementById('viewMemberDepartment').textContent = member.department;
    document.getElementById('viewMemberRole').textContent = member.role || 'Member';

    const statusEl = document.getElementById('viewMemberStatus');
    statusEl.textContent = member.isActive ? 'Active' : 'Inactive';
    statusEl.className = `badge ${member.isActive ? 'bg-success' : 'bg-danger'}`;

    currentMemberId = id;
    viewMemberModal.show();
}

// Edit from View Modal
document.getElementById('editFromViewBtn').addEventListener('click', function () {
    viewMemberModal.hide();
    setTimeout(() => editMember(currentMemberId), 300);
});

// Edit Member
function editMember(id) {
    const member = membersData.find(m => m.userId === id);
    if (!member) return;

    document.getElementById('editMemberId').value = member.userId;
    document.getElementById('editEmail').value = member.name;
    document.getElementById('editPassword').value = member.passwordHash;
    document.getElementById('editCnic').value = member.cnic;
    document.getElementById('editDepartment').value = member.department;
    document.getElementById('editUsername').value = member.username;
    document.getElementById('editStatus').value = member.isActive ? 'Active' : 'Inactive';

    currentMemberId = id;
    editMemberModal.show();
}

// Save Edit
document.getElementById('saveEditBtn').addEventListener('click', async function () {
    const id = parseInt(document.getElementById('editMemberId').value);
    const memberIndex = membersData.findIndex(m => m.userId === id);
    if (memberIndex === -1) return;

    // Create updated object matching C# TblUser
    const updatedMember = {
        UserId: id,
        Name: document.getElementById('editEmail').value.trim(),
        PasswordHash: document.getElementById('editPassword').value.trim(),
        Cnic: document.getElementById('editCnic').value.trim(),
        Department: document.getElementById('editDepartment').value,
        Username: document.getElementById('editUsername').value.trim(),
        IsActive: document.getElementById('editStatus').value === 'Active'
    };

    try {
        const response = await fetch('/Members/update_api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedMember)
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        // Update local array
        membersData[memberIndex] = {
            ...membersData[memberIndex],
            name: updatedMember.Name,
            passwordHash: updatedMember.PasswordHash,
            cnic: updatedMember.Cnic,
            department: updatedMember.Department,
            username: updatedMember.Username,
            isActive: updatedMember.IsActive
        };

        editMemberModal.hide();
        loadMembers();
        updateStats();
        showToast('Member updated successfully!', 'success');

    } catch (err) {
        showToast(err.message, 'error');
    }
});

// Delete Member (Show Modal)
function deleteMember(id) {
    const member = membersData.find(m => m.userId === id);
    if (!member) return;

    // Set Global Variable
    currentMemberId = id;

    // UI Updates
    document.getElementById('deleteMemberName').textContent = member.name;
    document.getElementById('deleteMemberId').value = member.userId; // Visual only

    const confirmMsg = document.querySelector('#deleteMemberModal .modal-body p');
    if (confirmMsg) confirmMsg.textContent = "Are you sure you want to deactivate this member?";

    deleteMemberModal.show();
}

// Confirm Delete (Updated Fix)
document.getElementById('confirmDeleteBtn').addEventListener('click', async function () {

    // 1. Validation
    if (!currentMemberId || currentMemberId <= 0) {
        showToast("Error: Invalid Member ID", "error");
        return;
    }

    // 2. Prepare Payload (Match C# property [JsonPropertyName("id")])
    const payload = { id: currentMemberId };

    try {
        const response = await fetch('/Members/delete_api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        // 3. Soft Delete Locally (Mark inactive instead of removing)
        const memberIndex = membersData.findIndex(m => m.userId === currentMemberId);
        if (memberIndex !== -1) {
            membersData[memberIndex].isActive = false;
        }

        deleteMemberModal.hide();
        loadMembers();
        updateStats();

        showToast('Member deactivated successfully!', 'success');

    } catch (err) {
        console.error(err);
        showToast("Error: " + err.message, "error");
    }
});


// Sidebar Toggle
if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function () {
        document.querySelector('.sidebar').classList.toggle('show');
    });
}

// Toast Notification
function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.custom-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;

    let bgColor, icon;
    switch (type) {
        case 'success': bgColor = '#198754'; icon = 'bi-check-circle-fill'; break;
        case 'error': bgColor = '#dc3545'; icon = 'bi-x-circle-fill'; break;
        case 'warning': bgColor = '#ffc107'; icon = 'bi-exclamation-circle-fill'; break;
        default: bgColor = '#0dcaf0'; icon = 'bi-info-circle-fill';
    }

    toast.innerHTML = `<i class="bi ${icon} me-2"></i>${message}`;
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        background: ${bgColor}; color: white;
        padding: 12px 20px; border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 9999; font-size: 0.9rem; font-weight: 500;
        animation: slideIn 0.3s ease;
    `;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
    `;
    if (!document.getElementById('toastStyles')) {
        style.id = 'toastStyles';
        document.head.appendChild(style);
    }
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}