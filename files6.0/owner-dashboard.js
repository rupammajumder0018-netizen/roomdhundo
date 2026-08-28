```javascript
/* =========================================================
   ROOMDHUNDO OWNER DASHBOARD
   ========================================================= */


/* =========================================================
   MOBILE SIDEBAR
   ========================================================= */

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

if (menuBtn) {

    menuBtn.addEventListener("click", () => {

        sidebar.classList.toggle("open");

        sidebarOverlay.classList.toggle("show");

    });

}


if (sidebarOverlay) {

    sidebarOverlay.addEventListener("click", () => {

        sidebar.classList.remove("open");

        sidebarOverlay.classList.remove("show");

    });

}


/* =========================================================
   ROOM STATUS MANAGEMENT
   ========================================================= */

const statusButtons = document.querySelectorAll(".status-btn");


statusButtons.forEach(button => {

    button.addEventListener("click", () => {

        const row = button.closest("tr");

        const statusElement = row.querySelector(".room-status");

        const currentStatus = statusElement.classList.contains("available")
            ? "available"
            : "occupied";


        if (currentStatus === "available") {

            /* AVAILABLE → OCCUPIED */

            statusElement.textContent = "Occupied";

            statusElement.classList.remove("available");

            statusElement.classList.add("occupied");


            button.textContent = "Mark Available";

            button.classList.remove("occupied-action");

            button.classList.add("available-action");


        } else {

            /* OCCUPIED → AVAILABLE */

            statusElement.textContent = "Available";

            statusElement.classList.remove("occupied");

            statusElement.classList.add("available");


            button.textContent = "Mark Occupied";

            button.classList.remove("available-action");

            button.classList.add("occupied-action");

        }


        updateStatistics();

    });

});


/* =========================================================
   UPDATE DASHBOARD STATISTICS
   ========================================================= */

function updateStatistics() {

    const rows = document.querySelectorAll("#roomTableBody tr");

    let available = 0;
    let occupied = 0;


    rows.forEach(row => {

        const status = row.querySelector(".room-status");

        if (status.classList.contains("available")) {

            available++;

        } else {

            occupied++;

        }

    });


    const total = available + occupied;


    document.getElementById("totalRooms").textContent = total;

    document.getElementById("availableRooms").textContent = available;

    document.getElementById("occupiedRooms").textContent = occupied;

}


/* =========================================================
   PROPERTY FILTER
   ========================================================= */

const propertyFilter = document.getElementById("propertyFilter");

if (propertyFilter) {

    propertyFilter.addEventListener("change", () => {

        const selectedProperty = propertyFilter.value;

        const rows = document.querySelectorAll("#roomTableBody tr");


        rows.forEach(row => {

            const rowProperty = row.dataset.property;


            if (
                selectedProperty === "all" ||
                rowProperty === selectedProperty
            ) {

                row.style.display = "";

            } else {

                row.style.display = "none";

            }

        });

    });

}


/* =========================================================
   MANAGE ROOMS BUTTON
   ========================================================= */

const manageButtons = document.querySelectorAll(".manage-btn");


manageButtons.forEach(button => {

    button.addEventListener("click", () => {

        const propertyName = button.dataset.property;


        const roomsSection = document.getElementById("rooms");

        roomsSection.scrollIntoView({
            behavior: "smooth"
        });


        if (propertyFilter) {

            propertyFilter.value = propertyName;

            propertyFilter.dispatchEvent(new Event("change"));

        }

    });

});


/* =========================================================
   ADD PROPERTY
   ========================================================= */

const addPropertyBtn = document.getElementById("addPropertyBtn");

if (addPropertyBtn) {

    addPropertyBtn.addEventListener("click", () => {

        alert(
            "Add Property feature will be connected in the next step."
        );

    });

}


/* =========================================================
   LOGOUT
   ========================================================= */

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", () => {

        const confirmLogout = confirm(
            "Are you sure you want to logout?"
        );


        if (confirmLogout) {

            alert("You have been logged out.");

            // Later we will redirect to owner-login.html

        }

    });

}


/* =========================================================
   SIDEBAR NAVIGATION
   ========================================================= */

const navLinks = document.querySelectorAll(".nav-link");


navLinks.forEach(link => {

    link.addEventListener("click", () => {

        navLinks.forEach(item => {

            item.classList.remove("active");

        });


        link.classList.add("active");


        if (window.innerWidth <= 850) {

            sidebar.classList.remove("open");

            sidebarOverlay.classList.remove("show");

        }

    });

});


/* =========================================================
   INITIAL STATISTICS
   ========================================================= */

updateStatistics();
```
