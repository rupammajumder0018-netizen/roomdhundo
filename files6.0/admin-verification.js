// ============================================================
// ROOMDHUNDO ADMIN - VERIFICATION
// ============================================================


// ------------------------------------------------------------
// VERIFICATION DATA
// ------------------------------------------------------------

const verificationData = [

    {
        id: 1,
        property: "Jaguli Student PG",
        type: "PG",
        owner: "Rahul Das",
        location: "Jaguli",
        rent: "₹5,000",
        date: "2026-08-25",
        submitted: "Aug 25, 2026",
        status: "Pending",
        icon: "🏠",
        description:
            "Student-friendly PG near MAKAUT with furnished rooms and basic facilities."
    },


    {
        id: 2,
        property: "Haringhata Room",
        type: "Room",
        owner: "Amit Roy",
        location: "Haringhata",
        rent: "₹6,000",
        date: "2026-08-24",
        submitted: "Aug 24, 2026",
        status: "Pending",
        icon: "🛏️",
        description:
            "Furnished room suitable for students and working professionals."
    },


    {
        id: 3,
        property: "Maa Student Mess",
        type: "Mess",
        owner: "Suman Ghosh",
        location: "Jaguli",
        rent: "₹2,500",
        date: "2026-08-22",
        submitted: "Aug 22, 2026",
        status: "Verified",
        icon: "🍛",
        description:
            "Affordable student mess providing regular meals near the university area."
    },


    {
        id: 4,
        property: "Green Guest House",
        type: "Guest House",
        owner: "Sanjay Paul",
        location: "Haringhata",
        rent: "₹900/night",
        date: "2026-08-21",
        submitted: "Aug 21, 2026",
        status: "Pending",
        icon: "🏡",
        description:
            "Guest house offering short-term daily and nightly accommodation."
    },


    {
        id: 5,
        property: "University Flat",
        type: "Flat",
        owner: "Arindam Sen",
        location: "Haringhata",
        rent: "₹12,000",
        date: "2026-08-18",
        submitted: "Aug 18, 2026",
        status: "Verified",
        icon: "🏢",
        description:
            "2 BHK flat located near the university and local transportation."
    },


    {
        id: 6,
        property: "Campus Single Room",
        type: "Room",
        owner: "Debashis Roy",
        location: "Jaguli",
        rent: "₹4,500",
        date: "2026-08-15",
        submitted: "Aug 15, 2026",
        status: "Rejected",
        icon: "🛏️",
        description:
            "Single student room listing that did not meet verification requirements."
    }

];



// ------------------------------------------------------------
// GET ELEMENTS
// ------------------------------------------------------------

const searchInput =
    document.getElementById("verificationSearch");

const searchBtn =
    document.getElementById("searchBtn");

const statusFilter =
    document.getElementById("verificationStatusFilter");

const typeFilter =
    document.getElementById("verificationTypeFilter");

const sortSelect =
    document.getElementById("verificationSort");

const tableBody =
    document.getElementById("verificationTableBody");

const verificationCount =
    document.getElementById("verificationCount");



// ------------------------------------------------------------
// STATISTICS
// ------------------------------------------------------------

function updateStatistics() {

    const total =
        verificationData.length;

    const pending =
        verificationData.filter(
            item => item.status === "Pending"
        ).length;

    const verified =
        verificationData.filter(
            item => item.status === "Verified"
        ).length;

    const rejected =
        verificationData.filter(
            item => item.status === "Rejected"
        ).length;


    document.getElementById(
        "totalSubmissions"
    ).textContent = total;


    document.getElementById(
        "pendingVerification"
    ).textContent = pending;


    document.getElementById(
        "verifiedProperties"
    ).textContent = verified;


    document.getElementById(
        "rejectedProperties"
    ).textContent = rejected;

}



// ------------------------------------------------------------
// DISPLAY DATA
// ------------------------------------------------------------

function displayVerification(list) {

    tableBody.innerHTML = "";


    if (list.length === 0) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    style="
                        text-align:center;
                        padding:30px;
                    "
                >
                    No verification records found.
                </td>

            </tr>

        `;

        verificationCount.textContent =
            "0 Properties";

        return;
    }


    list.forEach(item => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>

                <div class="property-info">

                    <div class="property-icon">
                        ${item.icon}
                    </div>

                    <div>

                        <strong>
                            ${item.property}
                        </strong>

                        <span>
                            Verification ID #${item.id}
                        </span>

                    </div>

                </div>

            </td>


            <td>
                ${item.type}
            </td>


            <td>
                ${item.owner}
            </td>


            <td>
                ${item.location}
            </td>


            <td>
                ${item.submitted}
            </td>


            <td>

                <span
                    class="status ${item.status.toLowerCase()}"
                >
                    ${item.status}
                </span>

            </td>


            <td>

                <button
                    type="button"
                    class="action-btn view-btn"
                    data-id="${item.id}"
                >
                    View
                </button>

            </td>

        `;


        tableBody.appendChild(row);

    });


    verificationCount.textContent =
        `${list.length} ${
            list.length === 1
                ? "Property"
                : "Properties"
        }`;


    addViewEvents();

}



// ------------------------------------------------------------
// SEARCH + FILTER + SORT
// ------------------------------------------------------------

function updateVerification() {

    let filtered =
        [...verificationData];


    // SEARCH

    const searchText =
        searchInput.value
            .trim()
            .toLowerCase();


    if (searchText !== "") {

        filtered =
            filtered.filter(item => {

                return (

                    item.property
                        .toLowerCase()
                        .includes(searchText)

                    ||

                    item.owner
                        .toLowerCase()
                        .includes(searchText)

                    ||

                    item.location
                        .toLowerCase()
                        .includes(searchText)

                );

            });

    }



    // STATUS FILTER

    const selectedStatus =
        statusFilter.value;


    if (selectedStatus !== "all") {

        filtered =
            filtered.filter(item => {

                return (
                    item.status.toLowerCase() ===
                    selectedStatus
                );

            });

    }



    // TYPE FILTER

    const selectedType =
        typeFilter.value;


    if (selectedType !== "all") {

        filtered =
            filtered.filter(item => {

                return (
                    item.type ===
                    selectedType
                );

            });

    }



    // SORT

    const selectedSort =
        sortSelect.value;


    if (selectedSort === "newest") {

        filtered.sort((a, b) => {

            return (
                new Date(b.date) -
                new Date(a.date)
            );

        });

    }


    else if (selectedSort === "oldest") {

        filtered.sort((a, b) => {

            return (
                new Date(a.date) -
                new Date(b.date)
            );

        });

    }


    else if (selectedSort === "name") {

        filtered.sort((a, b) => {

            return a.property.localeCompare(
                b.property
            );

        });

    }


    displayVerification(filtered);

}



// ------------------------------------------------------------
// VIEW BUTTON
// ------------------------------------------------------------

function addViewEvents() {

    const buttons =
        document.querySelectorAll(".view-btn");


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const id =
                    Number(
                        this.dataset.id
                    );


                const item =
                    verificationData.find(
                        data => data.id === id
                    );


                if (!item) {
                    return;
                }


                openModal(item);

            }
        );

    });

}



// ------------------------------------------------------------
// OPEN MODAL
// ------------------------------------------------------------

function openModal(item) {

    document.getElementById(
        "modalPropertyName"
    ).textContent =
        item.property;


    document.getElementById(
        "modalPropertyType"
    ).textContent =
        item.type;


    document.getElementById(
        "modalOwner"
    ).textContent =
        item.owner;


    document.getElementById(
        "modalLocation"
    ).textContent =
        item.location;


    document.getElementById(
        "modalType"
    ).textContent =
        item.type;


    document.getElementById(
        "modalRent"
    ).textContent =
        item.rent;


    document.getElementById(
        "modalDate"
    ).textContent =
        item.submitted;


    document.getElementById(
        "modalStatus"
    ).textContent =
        item.status;


    document.getElementById(
        "modalDescription"
    ).textContent =
        item.description;


    document.querySelector(
        ".modal-icon"
    ).textContent =
        item.icon;


    document.getElementById(
        "verificationModal"
    ).classList.add("show");


    const approveBtn =
        document.getElementById(
            "approveBtn"
        );

    const rejectBtn =
        document.getElementById(
            "rejectBtn"
        );


    approveBtn.dataset.id =
        item.id;

    rejectBtn.dataset.id =
        item.id;


    if (item.status === "Verified") {

        approveBtn.style.display =
            "none";

    } else {

        approveBtn.style.display =
            "block";

    }


    if (item.status === "Rejected") {

        rejectBtn.style.display =
            "none";

    } else {

        rejectBtn.style.display =
            "block";

    }

}



// ------------------------------------------------------------
// CLOSE MODAL
// ------------------------------------------------------------

function closeModal() {

    document.getElementById(
        "verificationModal"
    ).classList.remove("show");

}


document.getElementById(
    "closeModal"
).addEventListener(
    "click",
    closeModal
);


document.getElementById(
    "closeBtn"
).addEventListener(
    "click",
    closeModal
);



// ------------------------------------------------------------
// APPROVE PROPERTY
// ------------------------------------------------------------

document.getElementById(
    "approveBtn"
).addEventListener(
    "click",
    function () {

        const id =
            Number(this.dataset.id);


        const item =
            verificationData.find(
                data => data.id === id
            );


        if (!item) {
            return;
        }


        item.status = "Verified";


        updateStatistics();

        updateVerification();

        closeModal();


        alert(
            `${item.property} has been approved successfully.`
        );

    }
);



// ------------------------------------------------------------
// REJECT PROPERTY
// ------------------------------------------------------------

document.getElementById(
    "rejectBtn"
).addEventListener(
    "click",
    function () {

        const id =
            Number(this.dataset.id);


        const item =
            verificationData.find(
                data => data.id === id
            );


        if (!item) {
            return;
        }


        item.status = "Rejected";


        updateStatistics();

        updateVerification();

        closeModal();


        alert(
            `${item.property} has been rejected.`
        );

    }
);



// ------------------------------------------------------------
// SEARCH BUTTON
// ------------------------------------------------------------

searchBtn.addEventListener(
    "click",
    function () {

        updateVerification();

    }
);



// ------------------------------------------------------------
// ENTER KEY SEARCH
// ------------------------------------------------------------

searchInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            updateVerification();

        }

    }
);



// ------------------------------------------------------------
// LIVE SEARCH
// ------------------------------------------------------------

searchInput.addEventListener(
    "input",
    function () {

        updateVerification();

    }
);



// ------------------------------------------------------------
// FILTERS
// ------------------------------------------------------------

statusFilter.addEventListener(
    "change",
    updateVerification
);


typeFilter.addEventListener(
    "change",
    updateVerification
);


sortSelect.addEventListener(
    "change",
    updateVerification
);



// ------------------------------------------------------------
// LOGOUT
// ------------------------------------------------------------

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



// ------------------------------------------------------------
// INITIAL LOAD
// ------------------------------------------------------------

updateStatistics();

updateVerification();


console.log(
    "RoomDhundo Admin Verification loaded successfully."
);