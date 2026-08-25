// ============================================================
// ROOMDHUNDO - ADMIN OWNERS
// Temporary Owner Management System
// ============================================================


// ============================================================
// OWNER DATA
// ============================================================

const owners = [

    {
        id: 2001,
        name: "Rahul Das",
        email: "rahul@example.com",
        location: "Jaguli",
        properties: 4,
        joined: "Aug 20, 2026",
        date: "2026-08-20",
        status: "Active"
    },

    {
        id: 2002,
        name: "Amit Roy",
        email: "amit@example.com",
        location: "Haringhata",
        properties: 3,
        joined: "Aug 18, 2026",
        date: "2026-08-18",
        status: "Active"
    },

    {
        id: 2003,
        name: "Suman Ghosh",
        email: "suman@example.com",
        location: "Jaguli",
        properties: 2,
        joined: "Aug 15, 2026",
        date: "2026-08-15",
        status: "Suspended"
    },

    {
        id: 2004,
        name: "Sanjay Paul",
        email: "sanjay@example.com",
        location: "Haringhata",
        properties: 5,
        joined: "Aug 12, 2026",
        date: "2026-08-12",
        status: "Active"
    },

    {
        id: 2005,
        name: "Arindam Sen",
        email: "arindam@example.com",
        location: "Haringhata",
        properties: 6,
        joined: "Aug 10, 2026",
        date: "2026-08-10",
        status: "Active"
    },

    {
        id: 2006,
        name: "Debashis Roy",
        email: "debashis@example.com",
        location: "Jaguli",
        properties: 1,
        joined: "Aug 05, 2026",
        date: "2026-08-05",
        status: "Suspended"
    }

];


// ============================================================
// GET HTML ELEMENTS
// ============================================================

const searchInput =
    document.getElementById("ownerSearch");

const searchBtn =
    document.getElementById("searchBtn");

const statusFilter =
    document.getElementById("ownerStatusFilter");

const sortSelect =
    document.getElementById("ownerSort");

const tableBody =
    document.getElementById("ownerTableBody");

const ownerCount =
    document.getElementById("ownerCount");


// ============================================================
// DISPLAY OWNERS
// ============================================================

function displayOwners(ownerList) {

    tableBody.innerHTML = "";


    if (ownerList.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    style="text-align:center; padding:30px;"
                >
                    No owners found.
                </td>
            </tr>
        `;

        ownerCount.textContent = "0 Owners";

        return;
    }


    ownerList.forEach(owner => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>

                <div class="owner-info">

                    <div class="owner-avatar">
                        ${owner.name.charAt(0)}
                    </div>

                    <div>

                        <strong>
                            ${owner.name}
                        </strong>

                        <span>
                            Owner #${owner.id}
                        </span>

                    </div>

                </div>

            </td>


            <td>
                ${owner.email}
            </td>


            <td>
                ${owner.location}
            </td>


            <td>
                ${owner.properties}
            </td>


            <td>
                ${owner.joined}
            </td>


            <td>

                <span
                    class="status ${owner.status.toLowerCase()}"
                >
                    ${owner.status}
                </span>

            </td>


            <td>

                <button
                    type="button"
                    class="action-btn view-btn"
                    data-id="${owner.id}"
                >
                    View
                </button>

            </td>

        `;


        tableBody.appendChild(row);

    });


    ownerCount.textContent =
        `${ownerList.length} ${
            ownerList.length === 1
                ? "Owner"
                : "Owners"
        }`;


    addViewButtonEvents();

}


// ============================================================
// SEARCH + FILTER + SORT
// ============================================================

function updateOwners() {

    let filteredOwners =
        [...owners];


    // SEARCH

    const searchText =
        searchInput.value
            .trim()
            .toLowerCase();


    if (searchText !== "") {

        filteredOwners =
            filteredOwners.filter(owner => {

                return (

                    owner.name
                        .toLowerCase()
                        .includes(searchText)

                    ||

                    owner.email
                        .toLowerCase()
                        .includes(searchText)

                    ||

                    owner.location
                        .toLowerCase()
                        .includes(searchText)

                );

            });

    }


    // STATUS

    const selectedStatus =
        statusFilter.value;


    if (selectedStatus !== "all") {

        filteredOwners =
            filteredOwners.filter(owner => {

                return (
                    owner.status.toLowerCase() ===
                    selectedStatus
                );

            });

    }


    // SORT

    const selectedSort =
        sortSelect.value;


    if (selectedSort === "newest") {

        filteredOwners.sort((a, b) => {

            return (
                new Date(b.date) -
                new Date(a.date)
            );

        });

    }


    else if (selectedSort === "oldest") {

        filteredOwners.sort((a, b) => {

            return (
                new Date(a.date) -
                new Date(b.date)
            );

        });

    }


    else if (selectedSort === "name") {

        filteredOwners.sort((a, b) => {

            return a.name.localeCompare(
                b.name
            );

        });

    }


    displayOwners(filteredOwners);

}


// ============================================================
// VIEW OWNER
// ============================================================

function addViewButtonEvents() {

    const viewButtons =
        document.querySelectorAll(
            ".view-btn"
        );


    viewButtons.forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const ownerId =
                    Number(
                        this.dataset.id
                    );


                const owner =
                    owners.find(
                        owner =>
                            owner.id === ownerId
                    );


                if (!owner) {
                    return;
                }


                document.getElementById(
                    "modalOwnerName"
                ).textContent =
                    owner.name;


                document.getElementById(
                    "modalOwnerId"
                ).textContent =
                    `Owner #${owner.id}`;


                document.getElementById(
                    "modalOwnerAvatar"
                ).textContent =
                    owner.name.charAt(0);


                document.getElementById(
                    "modalEmail"
                ).textContent =
                    owner.email;


                document.getElementById(
                    "modalLocation"
                ).textContent =
                    owner.location;


                document.getElementById(
                    "modalProperties"
                ).textContent =
                    owner.properties;


                document.getElementById(
                    "modalJoined"
                ).textContent =
                    owner.joined;


                document.getElementById(
                    "modalStatus"
                ).textContent =
                    owner.status;


                document.getElementById(
                    "ownerModal"
                ).classList.add("show");


            }
        );

    });

}


// ============================================================
// CLOSE MODAL
// ============================================================

const closeOwnerModal =
    document.getElementById(
        "closeOwnerModal"
    );

const closeOwnerBtn =
    document.getElementById(
        "closeOwnerBtn"
    );


function closeModal() {

    document.getElementById(
        "ownerModal"
    ).classList.remove("show");

}


closeOwnerModal.addEventListener(
    "click",
    closeModal
);


closeOwnerBtn.addEventListener(
    "click",
    closeModal
);


// ============================================================
// SEARCH BUTTON
// ============================================================

searchBtn.addEventListener(
    "click",
    function () {

        updateOwners();

    }
);


// ============================================================
// SEARCH WHILE TYPING
// ============================================================

searchInput.addEventListener(
    "input",
    function () {

        updateOwners();

    }
);


// ============================================================
// ENTER KEY SEARCH
// ============================================================

searchInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            updateOwners();

        }

    }
);


// ============================================================
// STATUS FILTER
// ============================================================

statusFilter.addEventListener(
    "change",
    function () {

        updateOwners();

    }
);


// ============================================================
// SORT
// ============================================================

sortSelect.addEventListener(
    "change",
    function () {

        updateOwners();

    }
);


// ============================================================
// LOGOUT
// ============================================================

const logoutButton =
    document.getElementById(
        "adminLogoutBtn"
    );


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


// ============================================================
// INITIAL DISPLAY
// ============================================================

updateOwners();


console.log(
    "RoomDhundo Admin Owners loaded successfully."
);