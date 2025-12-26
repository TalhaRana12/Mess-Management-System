// User Profile JavaScript - Connected to Backend

document.addEventListener('DOMContentLoaded', function () {
    // Initialize components
    initSidebar();
    loadUserProfile(); // Now loads real data
    initPasswordForm();
    initPasswordToggles();
});

// Sidebar Toggle Functionality
function initSidebar() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function () {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }
}

// 1. Load User Profile Data (FROM SERVER)
function loadUserProfile() {
    // Get data injected from Razor View
    const userData = window.serverUserProfile || {
        name: 'Guest',
        username: '-',
        department: '-',
        cnic: '-',
        joinDate: '-'
    };

    // Update profile display elements
    if (document.getElementById('navUserName')) document.getElementById('navUserName').textContent = userData.name;
    if (document.getElementById('profileName')) document.getElementById('profileName').textContent = userData.name;
    if (document.getElementById('profileUsername')) document.getElementById('profileUsername').textContent = userData.username;
    if (document.getElementById('profileDepartment')) document.getElementById('profileDepartment').textContent = userData.department;
    if (document.getElementById('profileCnic')) document.getElementById('profileCnic').textContent = userData.cnic;
    if (document.getElementById('profileJoinDate')) document.getElementById('profileJoinDate').textContent = userData.joinDate;

    // Note: Phone/Email removed if not in TblUser model, or you can map them if added later
}

// Password Form Initialization
function initPasswordForm() {
    const form = document.getElementById('changePasswordForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function () {
            checkPasswordStrength(this.value);
            checkPasswordRequirements(this.value);
            checkPasswordMatch();
        });
    }

    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    }

    if (form) {
        form.addEventListener('submit', handlePasswordChange);
        form.addEventListener('reset', handleFormReset);
    }
}

// Handle Password Change (API CALL)
async function handlePasswordChange(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitBtn = document.getElementById('changePasswordBtn');
    const originalText = submitBtn.innerHTML;

    // Basic Validation
    if (!currentPassword) {
        showError('currentPassword', 'Enter current password');
        return;
    }
    if (newPassword !== confirmPassword) {
        showError('confirmPassword', 'Passwords do not match');
        return;
    }
    if (!checkPasswordRequirements(newPassword)) {
        showError('newPassword', 'Password is too weak');
        return;
    }

    // UI Loading State
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';
    clearErrors();

    try {
        // 2. Call C# Backend API
        const response = await fetch('/Userprofile/UpdatePassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                CurrentPassword: currentPassword,
                NewPassword: newPassword
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to update password");
        }

        // Success Logic
        const result = await response.json();

        // Show success modal
        const successModalElement = document.getElementById('successModal');
        if (successModalElement) {
            const successModal = new bootstrap.Modal(successModalElement);
            successModal.show();
        } else {
            showToast('success', 'Password updated successfully!');
        }

        // Reset form
        document.getElementById('changePasswordForm').reset();
        resetPasswordUI();

    } catch (error) {
        console.error(error);
        showError('currentPassword', error.message.replace(/"/g, '')); // Clean up error message
        showToast('error', 'Update failed: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// --- Helper Functions (UI Only) ---

function initPasswordToggles() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
        button.addEventListener('click', function () {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('bi-eye');
                icon.classList.add('bi-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('bi-eye-slash');
                icon.classList.add('bi-eye');
            }
        });
    });
}

function checkPasswordStrength(password) {
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    if (!strengthFill) return;

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    let strengthClass = 'weak';
    let strengthLabel = 'Weak';
    let width = '25%';

    if (strength >= 4) { strengthClass = 'strong'; strengthLabel = 'Strong'; width = '100%'; }
    else if (strength >= 3) { strengthClass = 'good'; strengthLabel = 'Good'; width = '75%'; }
    else if (strength >= 2) { strengthClass = 'fair'; strengthLabel = 'Fair'; width = '50%'; }

    strengthFill.className = `strength-fill ${strengthClass}`;
    strengthFill.style.width = password.length > 0 ? width : '0%';
    strengthText.textContent = password.length > 0 ? strengthLabel : 'Password Strength';
}

function checkPasswordRequirements(password) {
    // Simplified requirement check
    const isValid = password.length >= 8;
    // Update UI ticks if they exist (optional logic retained from original)
    return isValid;
}

function checkPasswordMatch() {
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;
    const indicator = document.getElementById('passwordMatch');

    if (!indicator) return newPass === confirmPass;

    if (confirmPass.length > 0) {
        indicator.style.display = 'block';
        if (newPass === confirmPass) {
            indicator.innerHTML = '<small class="text-success"><i class="bi bi-check"></i> Match</small>';
            return true;
        } else {
            indicator.innerHTML = '<small class="text-danger"><i class="bi bi-x"></i> Mismatch</small>';
            return false;
        }
    } else {
        indicator.style.display = 'none';
        return false;
    }
}

function showError(inputId, message) {
    const input = document.getElementById(inputId);
    const errorDiv = document.getElementById(inputId + 'Error'); // Ensure you have <div id="inputIdError" class="invalid-feedback"></div> in HTML

    if (input) input.classList.add('is-invalid');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

function clearErrors() {
    document.querySelectorAll('.form-control').forEach(i => i.classList.remove('is-invalid'));
    document.querySelectorAll('.invalid-feedback').forEach(d => d.style.display = 'none');
}

function handleFormReset() {
    setTimeout(resetPasswordUI, 10);
}

function resetPasswordUI() {
    if (document.getElementById('strengthFill')) document.getElementById('strengthFill').style.width = '0';
    if (document.getElementById('passwordMatch')) document.getElementById('passwordMatch').style.display = 'none';
    clearErrors();
}

function showToast(type, message) {
    // Simple alert fallback if toast container missing
    const container = document.querySelector('.toast-container');
    if (!container) { alert(message); return; }

    const toastHtml = `
    <div class="toast show align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0" role="alert">
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>`;

    container.innerHTML = toastHtml;
    setTimeout(() => { container.innerHTML = ''; }, 3000);
}