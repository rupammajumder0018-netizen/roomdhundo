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

    const totalUsers =
        document.getElementById("totalUsers");

    const totalOwners =
        document.getElementById("totalOwners");

    const totalProperties =
        document.getElementById("totalProperties");

    const pendingEnquiries =
        document.getElementById("pendingEnquiries");


    if (totalUsers) {

        totalUsers.textContent =
            adminStats.users;

    }


    if (totalOwners) {

        totalOwners.textContent =
            adminStats.owners;

    }


    if (totalProperties) {

        totalProperties.textContent =
            adminStats.properties;

    }


    if (pendingEnquiries) {

        pendingEnquiries.textContent =
            adminStats.pendingEnquiries;

    }

}


// ---------------------------------------------------------
// LOGOUT
// ---------------------------------------------------------

function setupLogout() {

    const logoutButton =
        document.getElementById("adminLogoutBtn");


    if (!logoutButton) {
        return;
    }


    logoutButton.addEventListener(
        "click",
        function () {

            const confirmLogout =
                confirm(
                    "Are you sure you want to logout?"
                );


            if (confirmLogout) {

                window.location.href =
                    "index.html";

            }

        }
    );

}


// ---------------------------------------------------------
// REVIEW BUTTONS
// ---------------------------------------------------------

function setupReviewButtons() {

    const reviewButtons =
        document.querySelectorAll(".review-btn");


    reviewButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                alert(
                    "Property review system will be connected to Supabase next."
                );

            }
        );

    });

}


// ---------------------------------------------------------
// VIEW ALL PROPERTIES
// ---------------------------------------------------------

function setupViewAllButton() {

    const viewAllButton =
        document.querySelector(".view-all-btn");


    if (!viewAllButton) {
        return;
    }


    // HTML href will normally handle navigation.
    // This is only a backup.

    viewAllButton.addEventListener(
        "click",
        function () {

            const targetPage =
                this.getAttribute("href");


            if (targetPage) {

                window.location.href =
                    targetPage;

            }

        }
    );

}


// ---------------------------------------------------------
// INITIALIZE DASHBOARD
// ---------------------------------------------------------

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadDashboardStats();

        setupLogout();

        setupReviewButtons();

        setupViewAllButton();

    }
);


// ---------------------------------------------------------
// CONFIRM JAVASCRIPT LOADED
// ---------------------------------------------------------

console.log(
    "RoomDhundo Admin Dashboard loaded successfully."
);