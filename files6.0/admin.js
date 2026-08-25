// =========================================================
// ROOMDHUNDO ADMIN DASHBOARD
// =========================================================


// ---------------------------------------------------------
// TEMPORARY DASHBOARD DATA
// ---------------------------------------------------------

const adminStats = {
    users: 142,
    owners: 37,
    properties: 84,
    pendingEnquiries: 8
};


// ---------------------------------------------------------
// LOAD DASHBOARD STATISTICS
// ---------------------------------------------------------

function loadDashboardStats() {

    document.getElementById("totalUsers").textContent =
        adminStats.users;

    document.getElementById("totalOwners").textContent =
        adminStats.owners;

    document.getElementById("totalProperties").textContent =
        adminStats.properties;

    document.getElementById("pendingEnquiries").textContent =
        adminStats.pendingEnquiries;
}


// ---------------------------------------------------------
// LOGOUT BUTTON
// ---------------------------------------------------------

const logoutButton = document.getElementById("adminLogoutBtn");

if (logoutButton) {

    logoutButton.addEventListener("click", function () {

        const confirmLogout = confirm(
            "Are you sure you want to logout?"
        );

        if (confirmLogout) {

            // Temporary logout behavior
            window.location.href = "index.html";
        }

    });

}


// ---------------------------------------------------------
// REVIEW BUTTONS
// ---------------------------------------------------------

const reviewButtons =
    document.querySelectorAll(".review-btn");

reviewButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        alert(
            "Property review system will be connected to Supabase next."
        );

    });

});


// ---------------------------------------------------------
// NAVIGATION
// ---------------------------------------------------------

const navItems =
    document.querySelectorAll(".nav-item");

navItems.forEach(function (item) {

    item.addEventListener("click", function (event) {

        event.preventDefault();

        // Remove active state
        navItems.forEach(function (nav) {
            nav.classList.remove("active");
        });

        // Add active state
        this.classList.add("active");

    });

});


// ---------------------------------------------------------
// INITIALIZE DASHBOARD
// ---------------------------------------------------------

document.addEventListener("DOMContentLoaded", function () {

    loadDashboardStats();

});