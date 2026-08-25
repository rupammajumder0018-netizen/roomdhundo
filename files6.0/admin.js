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

const logoutButton =
    document.getElementById("adminLogoutBtn");


if (logoutButton) {

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


// ---------------------------------------------------------
// ADMIN PAGE NAVIGATION
// ---------------------------------------------------------

const navItems =
    document.querySelectorAll(".nav-item");


navItems.forEach(function (item) {

    item.addEventListener(
        "click",
        function (event) {

            const page =
                this.getAttribute("data-page");


            // Only handle Dashboard,
            // Properties and Users.

            if (page === "dashboard") {

                event.preventDefault();

                window.location.href =
                    "./admin.html";

                return;

            }


            if (page === "properties") {

                event.preventDefault();

                window.location.href =
                    "./admin-properties.html";

                return;

            }


            if (page === "users") {

                event.preventDefault();

                window.location.href =
                    "./admin-users.html";

                return;

            }

        }
    );

});


// ---------------------------------------------------------
// VIEW ALL PROPERTIES
// ---------------------------------------------------------

const viewAllButton =
    document.querySelector(".view-all-btn");


if (viewAllButton) {

    viewAllButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            window.location.href =
                "./admin-properties.html";

        }
    );

}


// ---------------------------------------------------------
// INITIALIZE
// ---------------------------------------------------------

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadDashboardStats();

    }
);


console.log(
    "RoomDhundo Admin Dashboard loaded successfully."
);