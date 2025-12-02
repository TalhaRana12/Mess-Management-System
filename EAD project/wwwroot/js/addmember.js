// DOM Elements
const emailInput = document.getElementById('email');
const cnicInput = document.getElementById('cnic');
const departmentSelect = document.getElementById('department');
const roleSelect = document.getElementById('role');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const submitBtn = document.getElementById('submitBtn');
const addUserForm = document.getElementById('addUserForm');

// Buttons
const regenerateUsernameBtn = document.getElementById('regenerateUsername');
const regeneratePasswordBtn = document.getElementById('regeneratePassword');
const copyPasswordBtn = document.getElementById('copyPassword');
const copyAllCredentialsBtn = document.getElementById('copyAllCredentials');
const sidebarToggle = document.getElementById('sidebarToggle');

// Preview Elements
const credentialsPreview = document.getElementById('credentialsPreview');
const previewEmail = document.getElementById('previewEmail');
const previewUsername = document.getElementById('previewUsername');
const previewPassword = document.getElementById('previewPassword');
const previewRole = document.getElementById('previewRole');

// Email Validation Regex
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// CNIC Validation Regex (Pakistani CNIC format: XXXXX-XXXXXXX-X)
const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;

// Validate Email
function validateEmail(email) {
    return emailRegex.test(email);
}

// Validate CNIC
function validateCNIC(cnic) {
    return cnicRegex.test(cnic);
}

// Generate Username from Email
function generateUsername(email) {
    if (!email || !validateEmail(email)) return '';

    // Extract the part before @ symbol
    let username = email.split('@')[0];

    // Remove special characters and keep only alphanumeric
    username = username.replace(/[^a-zA-Z0-9]/g, '');

    // Add random number to make it unique
    const randomNum = Math.floor(Math.random() * 1000);
    username = username + randomNum;

    // Limit length to 50 characters
    return username.substring(0, 50);
}

// Generate Random Password
function generatePassword(length = 12) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%&*';

    const allChars = uppercase + lowercase + numbers + special;

    // Ensure at least one character from each category
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    return password;
}

// Format CNIC Input (auto-add dashes)
function formatCNIC(value) {
    // Remove all non-digits
    let digits = value.replace(/\D/g, '');

    // Limit to 13 digits
    digits = digits.substring(0, 13);

    // Format as XXXXX-XXXXXXX-X
    if (digits.length > 5) {
        digits = digits.substring(0, 5) + '-' + digits.substring(5);
    }
    if (digits.length > 13) {
        digits = digits.substring(0, 13) + '-' + digits.substring(13);
    }

    return digits;
}

// Check if form is valid
function checkFormValidity() {
    const isEmailValid = validateEmail(emailInput.value);
    const isCNICValid = validateCNIC(cnicInput.value);
    const isDepartmentSelected = departmentSelect.value !== '';
    const hasUsername = usernameInput.value.trim() !== '';
    const hasPassword = passwordInput.value.trim() !== '';

    const isFormValid = isEmailValid && isCNICValid && isDepartmentSelected && hasUsername && hasPassword;

    submitBtn.disabled = !isFormValid;

    // Show/hide credentials preview
    if (isFormValid) {
        credentialsPreview.style.display = 'block';
        previewEmail.textContent = emailInput.value;
        previewUsername.textContent = usernameInput.value;
        previewPassword.textContent = passwordInput.value;
        previewRole.textContent = roleSelect.value;
    } else {
        credentialsPreview.style.display = 'none';
    }

    return isFormValid;
}

// Email Input Event Listener
emailInput.addEventListener('input', function () {
    const email = this.value.trim();

    if (email === '') {
        this.classList.remove('is-valid', 'is-invalid');
        usernameInput.value = '';
        passwordInput.value = '';
    } else if (validateEmail(email)) {
        this.classList.remove('is-invalid');
        this.classList.add('is-valid');

        // Auto-generate username and password
        usernameInput.value = generateUsername(email);
        if (!passwordInput.value) {
            passwordInput.value = generatePassword();
        }
    } else {
        this.classList.remove('is-valid');
        this.classList.add('is-invalid');
        usernameInput.value = '';
    }

    checkFormValidity();
});

// Email blur event - final validation
emailInput.addEventListener('blur', function () {
    const email = this.value.trim();
    if (email !== '' && !validateEmail(email)) {
        this.classList.add('is-invalid');
    }
});

// CNIC Input Event Listener
cnicInput.addEventListener('input', function () {
    // Auto-format CNIC
    this.value = formatCNIC(this.value);

    const cnic = this.value;

    if (cnic === '') {
        this.classList.remove('is-valid', 'is-invalid');
    } else if (validateCNIC(cnic)) {
        this.classList.remove('is-invalid');
        this.classList.add('is-valid');
    } else {
        this.classList.remove('is-valid');
        if (cnic.length === 15) {
            this.classList.add('is-invalid');
        }
    }

    checkFormValidity();
});

// Department Change Event
departmentSelect.addEventListener('change', function () {
    checkFormValidity();
});

// Role Change Event
roleSelect.addEventListener('change', function () {
    checkFormValidity();
});

// Regenerate Username Button
regenerateUsernameBtn.addEventListener('click', function () {
    if (validateEmail(emailInput.value)) {
        usernameInput.value = generateUsername(emailInput.value);
        checkFormValidity();
        showToast('Username regenerated!', 'success');
    } else {
        showToast('Please enter a valid email first', 'warning');
    }
});

// Regenerate Password Button
regeneratePasswordBtn.addEventListener('click', function () {
    passwordInput.value = generatePassword();
    checkFormValidity();
    showToast('Password regenerated!', 'success');
});

// Copy Password Button
copyPasswordBtn.addEventListener('click', function () {
    if (passwordInput.value) {
        navigator.clipboard.writeText(passwordInput.value).then(() => {
            showToast('Password copied to clipboard!', 'success');
        }).catch(() => {
            showToast('Failed to copy password', 'error');
        });
    }
});

// Copy All Credentials Button
copyAllCredentialsBtn.addEventListener('click', function () {
    const roleSelect = document.getElementById('role');
    const credentials = `
Email: ${emailInput.value}
Username: ${usernameInput.value}
Password: ${passwordInput.value}
Role: ${roleSelect.value}
    `.trim();

    navigator.clipboard.writeText(credentials).then(() => {
        showToast('All credentials copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy credentials', 'error');
    });
});
// Collect all form data into a single object
const getUserData = () => {
    return {
        name: emailInput.value.trim(),           // email as Name
        cnic: cnicInput.value.trim() || null,    // CNIC (nullable)
        department: departmentSelect.value || null, // Department (nullable)
        Username: usernameInput.value.trim(),
        passwordHash: passwordInput.value,       // password
        role: roleSelect.value,
        isActive: true                            // default active
    };
};

async function saveUser(userData) {
    try {
        const response = await fetch('/AddMember/adduser_api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const msg = await response.text();
            throw new Error(msg);
        }

        const result = await response.text();
        showSuccessPopup();
    }
    catch (err) {
        showToast(err.message, "error");
    }
}

// Form Submit Handler
addUserForm.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!checkFormValidity()) {
        showToast('Please fill all required fields correctly', 'error');
        return false;
    }
    const userdata = getUserData();
    saveUser(userdata);
});

// Success Popup Function
function showSuccessPopup() {
    const roleSelect = document.getElementById('role');
    const selectedRole = roleSelect.value;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;

    // Create popup
    const popup = document.createElement('div');
    popup.className = 'success-popup';
    popup.style.cssText = `
        background: white;
        border-radius: 20px;
        padding: 2.5rem;
        text-align: center;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: popIn 0.4s ease;
    `;

    popup.innerHTML = `
        <div style="width: 80px; height: 80px; background: linear-gradient(45deg, #198754, #20c997); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
            <i class="bi bi-check-lg" style="font-size: 2.5rem; color: white;"></i>
        </div>
        <h3 style="color: #198754; font-weight: 700; margin-bottom: 0.5rem;">Member Added Successfully!</h3>
        <p style="color: #6c757d; margin-bottom: 1.5rem;">The new member has been registered.</p>
        <div style="background: #f0f7f4; border-radius: 12px; padding: 1rem; text-align: left; margin-bottom: 1.5rem; border-left: 4px solid #198754;">
            <p style="margin: 0.3rem 0; color: #212529;"><strong>Email:</strong> ${emailInput.value}</p>
            <p style="margin: 0.3rem 0; color: #212529;"><strong>Username:</strong> ${usernameInput.value}</p>
            <p style="margin: 0.3rem 0; color: #212529;"><strong>Password:</strong> ${passwordInput.value}</p>
            <p style="margin: 0.3rem 0; color: #212529;"><strong>Role:</strong> ${selectedRole}</p>
        </div>
        <div style="display: flex; gap: 10px; justify-content: center;">
            <button class="btn-add-another" style="background: linear-gradient(45deg, #198754, #20c997); color: white; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
                <i class="bi bi-plus-circle me-2"></i>Add Another
            </button>
            <button class="btn-go-dashboard" style="background: #f8f9fa; color: #212529; border: 2px solid #e0e0e0; padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
                <i class="bi bi-grid me-2"></i>Dashboard
            </button>
        </div>
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        @keyframes popIn {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .btn-add-another:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(32, 201, 151, 0.3);
        }
        .btn-go-dashboard:hover {
            background: #6c757d !important;
            color: white !important;
            border-color: #6c757d !important;
        }
    `;
    document.head.appendChild(style);

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Add Another button click
    popup.querySelector('.btn-add-another').addEventListener('click', function () {
        closePopup(overlay);
        resetForm();
    });

    // Go to Dashboard button click
    popup.querySelector('.btn-go-dashboard').addEventListener('click', function () {
        window.location.href = 'dashborad.html';
    });

    // Close on overlay click
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            closePopup(overlay);
        }
    });
}

// Close Popup Function
function closePopup(overlay) {
    overlay.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => overlay.remove(), 300);
}

// Reset Form Function
function resetForm() {
    addUserForm.reset();
    emailInput.classList.remove('is-valid', 'is-invalid');
    cnicInput.classList.remove('is-valid', 'is-invalid');
    usernameInput.value = '';
    passwordInput.value = generatePassword();
    credentialsPreview.style.display = 'none';
    submitBtn.disabled = true;
    showToast('Form reset. Ready to add another member!', 'info');
}

// Sidebar Toggle for Mobile
if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function () {
        document.querySelector('.sidebar').classList.toggle('show');
    });
}

// Toast Notification Function
function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.custom-toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'custom-toast';

    // Set background color based on type
    let bgColor, icon;
    switch (type) {
        case 'success':
            bgColor = '#198754';
            icon = 'bi-check-circle-fill';
            break;
        case 'error':
            bgColor = '#dc3545';
            icon = 'bi-x-circle-fill';
            break;
        case 'warning':
            bgColor = '#ffc107';
            icon = 'bi-exclamation-circle-fill';
            break;
        default:
            bgColor = '#0dcaf0';
            icon = 'bi-info-circle-fill';
    }

    toast.innerHTML = `<i class="bi ${icon} me-2"></i>${message}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 12px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 9999;
        font-size: 0.9rem;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;

    // Add animation style
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Initialize - Generate password on page load
document.addEventListener('DOMContentLoaded', function () {
    passwordInput.value = generatePassword();
});
