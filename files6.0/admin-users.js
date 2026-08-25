// ============================================================
// RoomDhundo - Admin Users
// Temporary user management system
// ============================================================


// ------------------------------------------------------------
// 1. USER DATA
// ------------------------------------------------------------

const users = [

    {
        id: 1001,
        name: "Rupam Majumder",
        email: "rupam@example.com",
        location: "Haringhata",
        joined: "Aug 20, 2026",
        date: "2026-08-20",
        status: "Active"
    },

    {
        id: 1002,
        name: "Ankit Roy",
        email: "ankit@example.com",
        location: "Jaguli",
        joined: "Aug 18, 2026",
        date: "2026-08-18",
        status: "Active"
    },

    {
        id: 1003,
        name: "Sayan Ghosh",
        email: "sayan@example.com",
        location: "Kalyani",
        joined: "Aug 15, 2026",
        date: "2026-08-15",
        status: "Suspended"
    },

    {
        id: 1004,
        name: "Priya Sen",
        email: "priya@example.com",
        location: "Haringhata",
        joined: "Aug 12, 2026",
        date: "2026-08-12",
        status: "Active"
    },

    {
        id: 1005,
        name: "Debashis Das",
        email: "debashis@example.com",
        location: "Jaguli",
        joined: "Aug 10, 2026",
        date: "2026-08-10",
        status: "Active"
    },

    {
        id: 1006,
        name: "Manish Paul",
        email: "manish@example.com",
        location: "Kalyani",
        joined: "Aug 05, 2026",
        date: "2026-08-05",
        status: "Suspended"
    }

];


// ------------------------------------------------------------
// 2. GET HTML ELEMENTS
// ------------------------------------------------------------

const searchInput =
    document.getElementById("userSearch");

const searchBtn =
    document.getElementById("searchBtn");

const statusFilter =
    document.getElementById("userStatusFilter");

const sortSelect =
    document.getElementById("userSort");

const tableBody =
    document.getElementById("userTableBody");

const userCount =
    document.getElementById("userCount");


// ------------------------------------------------------------
// 3. MODAL ELEMENTS
// ------------------------------------------------------------

const userModal =
    document.getElementById("userModal");

const closeUserModal =
    document.getElementById("closeUserModal");

const modalCloseBtn =
    document.getElementById("modalCloseBtn");

const modalAvatar =
    document.getElementById("modalAvatar");

const modalName =
    document.getElementById("modalName");

const modalUserId =
    document.getElementById("modalUserId");

const modalEmail =
    document.getElementById("modalEmail");

const modalLocation =
    document.getElementById("modalLocation");

const modalJoined =
    document.getElementById("modalJoined");

const modalStatus =
    document.getElementById("modalStatus");


// ------------------------------------------------------------
// 4. CHECK REQUIRED ELEMENTS
// ------------------------------------------------------------

if (
    !searchInput ||
    !searchBtn ||
    !statusFilter ||
    !sortSelect ||
    !tableBody ||
    !userCount
) {

    console.error(
        "RoomDhundo: Required Users page elements were not found."
    );

}


// ------------------------------------------------------------
// 5. DISPLAY USERS
// ------------------------------------------------------------

function displayUsers(userList) {

    tableBody.innerHTML = "";


    // --------------------------------------------------------
    // NO USERS FOUND
    // --------------------------------------------------------

    if (userList.length === 0) {

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td
                colspan="6"
                style="
                    text-align:center;
                    padding:30px;
                    color:#6b7280;
                "
            >
                No users found.
            </td>
        `;

        tableBody.appendChild(row);

        userCount.textContent = "0 Users";

        return;
    }


    // --------------------------------------------------------
    // CREATE USER ROWS
    // --------------------------------------------------------

    userList.forEach(user => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>

                <div class="user-info">

                    <div class="user-avatar">
                        ${user.name.charAt(0)}
                    </div>

                    <div>

                        <strong>
                            ${user.name}
                        </strong>

                        <span>
                            User #${user.id}
                        </span>

                    </div>

                </div>

            </td>


            <td>
                ${user.email}
            </td>


            <td>
                ${user.location}
            </td>


            <td>
                ${user.joined}
            </td>


            <td>

                <span class="status ${user.status.toLowerCase()}">
                    ${user.status}
                </span>

            </td>


            <td>

                <button
                    type="button"
                    class="action-btn view-btn"
                    data-id="${user.id}"
                >
                    View
                </button>

            </td>

        `;


        tableBody.appendChild(row);

    });


    // --------------------------------------------------------
    // UPDATE USER COUNT
    // --------------------------------------------------------

    userCount.textContent =
        `${userList.length} ${
            userList.length === 1
                ? "User"
                : "Users"
        }`;


    // --------------------------------------------------------
    // ADD VIEW BUTTON EVENTS
    // --------------------------------------------------------

    addViewButtonEvents();

}


// ------------------------------------------------------------
// 6. SEARCH + FILTER + SORT
// ------------------------------------------------------------

function updateUsers() {

    // Copy original users array

    let filteredUsers =
        [...users];


    // --------------------------------------------------------
    // SEARCH
    // --------------------------------------------------------

    const searchText =
        searchInput.value
            .trim()
            .toLowerCase();


    if (searchText !== "") {

        filteredUsers =
            filteredUsers.filter(user => {

                const name =
                    user.name.toLowerCase();

                const email =
                    user.email.toLowerCase();

                return (
                    name.includes(searchText) ||
                    email.includes(searchText)
                );

            });

    }


    // --------------------------------------------------------
    // STATUS FILTER
    // --------------------------------------------------------

    const selectedStatus =
        statusFilter.value;


    if (selectedStatus !== "all") {

        filteredUsers =
            filteredUsers.filter(user => {

                return (
                    user.status.toLowerCase() ===
                    selectedStatus
                );

            });

    }


    // --------------------------------------------------------
    // SORT
    // --------------------------------------------------------

    const selectedSort =
        sortSelect.value;


    // NEWEST

    if (selectedSort === "newest") {

        filteredUsers.sort((a, b) => {

            return (
                new Date(b.date) -
                new Date(a.date)
            );

        });

    }


    // OLDEST

    else if (selectedSort === "oldest") {

        filteredUsers.sort((a, b) => {

            return (
                new Date(a.date) -
                new Date(b.date)
            );

        });

    }


    // NAME A-Z

    else if (selectedSort === "name") {

        filteredUsers.sort((a, b) => {

            return a.name.localeCompare(
                b.name
            );

        });

    }


    // --------------------------------------------------------
    // DISPLAY RESULT
    // --------------------------------------------------------

    displayUsers(filteredUsers);

}


// ------------------------------------------------------------
// 7. OPEN USER DETAILS MODAL
// ------------------------------------------------------------

function openUserModal(user) {

    // Safety check

    if (!userModal) {

        console.error(
            "RoomDhundo: User modal not found."
        );

        return;
    }


    // Avatar

    modalAvatar.textContent =
        user.name.charAt(0);


    // Name

    modalName.textContent =
        user.name;


    // User ID

    modalUserId.textContent =
        `User #${user.id}`;


    // Email

    modalEmail.textContent =
        user.email;


    // Location

    modalLocation.textContent =
        user.location;


    // Joined date

    modalJoined.textContent =
        user.joined;


    // Status

    modalStatus.textContent =
        user.status;


    // Update status class

    modalStatus.className = "";


    modalStatus.classList.add(
        "status",
        user.status.toLowerCase()
    );


    // Show modal

    userModal.classList.add("show");


    // Prevent background scrolling

    document.body.style.overflow =
        "hidden";

}


// ------------------------------------------------------------
// 8. CLOSE USER MODAL
// ------------------------------------------------------------

function closeModal() {

    if (!userModal) {
        return;
    }


    userModal.classList.remove("show");


    // Enable scrolling again

    document.body.style.overflow =
        "";

}


// ------------------------------------------------------------
// 9. VIEW BUTTON EVENTS
// ------------------------------------------------------------

function addViewButtonEvents() {

    const viewButtons =
        document.querySelectorAll(
            ".view-btn"
        );


    viewButtons.forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const userId =
                    Number(
                        this.dataset.id
                    );


                const user =
                    users.find(
                        user =>
                            user.id === userId
                    );


                if (!user) {

                    console.error(
                        "User not found:",
                        userId
                    );

                    return;
                }


                openUserModal(user);

            }
        );

    });

}


// ------------------------------------------------------------
// 10. SEARCH BUTTON
// ------------------------------------------------------------

searchBtn.addEventListener(
    "click",
    function (event) {

        event.preventDefault();

        updateUsers();

    }
);


// ------------------------------------------------------------
// 11. SEARCH USING ENTER
// ------------------------------------------------------------

searchInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            updateUsers();

        }

    }
);


// ------------------------------------------------------------
// 12. SEARCH WHILE TYPING
// ------------------------------------------------------------

searchInput.addEventListener(
    "input",
    function () {

        updateUsers();

    }
);


// ------------------------------------------------------------
// 13. STATUS FILTER
// ------------------------------------------------------------

statusFilter.addEventListener(
    "change",
    function () {

        updateUsers();

    }
);


// ------------------------------------------------------------
// 14. SORT USERS
// ------------------------------------------------------------

sortSelect.addEventListener(
    "change",
    function () {

        updateUsers();

    }
);


// ------------------------------------------------------------
// 15. CLOSE BUTTON - X
// ------------------------------------------------------------

if (closeUserModal) {

    closeUserModal.addEventListener(
        "click",
        function () {

            closeModal();

        }
    );

}


// ------------------------------------------------------------
// 16. CLOSE BUTTON - CLOSE
// ------------------------------------------------------------

if (modalCloseBtn) {

    modalCloseBtn.addEventListener(
        "click",
        function () {

            closeModal();

        }
    );

}


// ------------------------------------------------------------
// 17. CLOSE MODAL BY CLICKING OUTSIDE
// ------------------------------------------------------------

if (userModal) {

    userModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target === userModal
            ) {

                closeModal();

            }

        }
    );

}


// ------------------------------------------------------------
// 18. CLOSE MODAL WITH ESCAPE KEY
// ------------------------------------------------------------

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
            userModal &&
            userModal.classList.contains("show")
        ) {

            closeModal();

        }

    }
);


// ------------------------------------------------------------
// 19. INITIAL DISPLAY
// ------------------------------------------------------------

updateUsers();


// ------------------------------------------------------------
// 20. CONFIRM JAVASCRIPT LOADED
// ------------------------------------------------------------

console.log(
    "RoomDhundo Admin Users loaded successfully."
);