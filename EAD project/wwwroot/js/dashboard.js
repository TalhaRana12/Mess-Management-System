document.addEventListener('DOMContentLoaded', function () {
    // 1. Initialize Sidebar
    initSidebar();

    // 2. Load Data
    console.log("Initializing Dashboard Data...");
    if (window.dashboardData) {
        loadDashboardData(window.dashboardData);
    } else {
        console.error("No data found in window.dashboardData. Check your .cshtml file.");
    }
});

// --- Sidebar Logic ---
function initSidebar() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }
}

// --- Data Loading Logic ---
function loadDashboardData(data) {
    try {
        // 1. Update Stats
        setText('statTotalMembers', data.stats.totalMembers);
        setText('statPresentToday', data.stats.presentToday);
        setText('statPendingDisputes', data.stats.pendingDisputes);

        const billEl = document.getElementById('statPendingBills');
        if (billEl) {
            billEl.textContent = `Rs. ${data.stats.pendingBills.toLocaleString()}`;
        }

        // 2. Update Menu List (Separated by Lunch and Dinner)
        const menuList = document.getElementById('dashboardMenuList');
        const dayBadge = document.getElementById('currentDayBadge');

        // Set Day Name
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        if (dayBadge) dayBadge.textContent = days[new Date().getDay()];

        if (menuList) {
            if (data.menu && data.menu.length > 0) {
                // Filter items
                const lunchItems = data.menu.filter(m => m.type === 'Lunch');
                const dinnerItems = data.menu.filter(m => m.type === 'Dinner');

                let htmlContent = '';

                // Helper function to generate list HTML
                const generateList = (items) => {
                    return items.map(item => `
                        <li>
                            <span class="menu-item">${item.name}</span>
                            <span class="menu-price">Rs. ${item.price}</span>
                        </li>
                    `).join('');
                };

                // Add Lunch Section
                if (lunchItems.length > 0) {
                    htmlContent += `
                        <li class="bg-light fw-bold text-primary px-2 py-1 mt-2 rounded">
                            <i class="bi bi-brightness-high-fill me-1"></i> Lunch
                        </li>
                        ${generateList(lunchItems)}
                    `;
                }

                // Add Dinner Section
                if (dinnerItems.length > 0) {
                    htmlContent += `
                        <li class="bg-light fw-bold text-primary px-2 py-1 mt-2 rounded">
                            <i class="bi bi-moon-fill me-1"></i> Dinner
                        </li>
                        ${generateList(dinnerItems)}
                    `;
                }

                // If items exist but don't match Lunch/Dinner exactly (Fallback)
                if (lunchItems.length === 0 && dinnerItems.length === 0) {
                    htmlContent = generateList(data.menu);
                }

                menuList.innerHTML = htmlContent;

            } else {
                menuList.innerHTML = '<li class="text-center text-muted py-2">No menu available today</li>';
            }
        }

        // 3. Update Recent Disputes
        const disputeList = document.getElementById('dashboardDisputeList');

        if (disputeList) {
            if (data.disputes && data.disputes.length > 0) {
                disputeList.innerHTML = data.disputes.map(d => {
                    const dateStr = new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                    let badgeClass = 'bg-secondary';
                    if (d.status === 'Pending') badgeClass = 'bg-warning text-dark';
                    else if (d.status === 'Approved') badgeClass = 'bg-success';
                    else if (d.status === 'Rejected') badgeClass = 'bg-danger';

                    return `
                        <li>
                            <div class="dispute-info">
                                <strong>${d.userName}</strong>
                                <small>${dateStr}</small>
                            </div>
                            <span class="badge ${badgeClass}">${d.status}</span>
                        </li>
                    `;
                }).join('');
            } else {
                disputeList.innerHTML = '<li class="text-center text-muted py-2">No recent disputes</li>';
            }
        }
    } catch (e) {
        console.error("Error rendering dashboard:", e);
    }
}

// Helper function to safely set text
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}