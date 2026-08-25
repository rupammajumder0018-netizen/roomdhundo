// =========================================================
// ROOMDHUNDO ADMIN - ENQUIRIES
// =========================================================


// ---------------------------------------------------------
// ENQUIRY DATA
// ---------------------------------------------------------

const enquiries = [

    {
        id: 2001,
        user: "Rupam Majumder",
        email: "rupam@example.com",
        property: "Jaguli Student PG",
        location: "Jaguli",
        message: "I want to know if a 2-person room is available.",
        date: "2026-08-25",
        displayDate: "Aug 25, 2026",
        status: "Pending"
    },

    {
        id: 2002,
        user: "Ankit Roy",
        email: "ankit@example.com",
        property: "Haringhata Room",
        location: "Haringhata",
        message: "Is the room furnished and what is the monthly rent?",
        date: "2026-08-24",
        displayDate: "Aug 24, 2026",
        status: "Replied"
    },

    {
        id: 2003,
        user: "Sayan Ghosh",
        email: "sayan@example.com",
        property: "Maa Mess",
        location: "Jaguli",
        message: "I would like to know about the monthly mess charges.",
        date: "2026-08-23",
        displayDate: "Aug 23, 2026",
        status: "Pending"
    },

    {
        id: 2004,
        user: "Priya Sen",
        email: "priya@example.com",
        property: "Green Guest House",
        location: "Haringhata",
        message: "Can I book the guest house for one night?",
        date: "2026-08-21",
        displayDate: "Aug 21, 2026",
        status: "Replied"
    },

    {
        id: 2005,
        user: "Debashis Das",
        email: "debashis@example.com",
        property: "University Flat",
        location: "Haringhata",
        message: "I am interested in the 2 BHK flat.",
        date: "2026-08-18",
        displayDate: "Aug 18, 2026",
        status: "Closed"
    },

    {
        id: 2006,
        user: "Manish Paul",
        email: "manish@example.com",
        property: "Campus Room",
        location: "Jaguli",
        message: "Is this room suitable for a student?",
        date: "2026-08-15",
        displayDate: "Aug 15, 2026",
        status: "Pending"
    }

];


// ---------------------------------------------------------
// GET ELEMENTS
// ---------------------------------------------------------

const searchInput =
    document.getElementById("enquirySearch");

const searchBtn =
    document.getElementById("searchBtn");

const statusFilter =
    document.getElementById("enquiryStatusFilter");

const sortSelect =
    document.getElementById("enquirySort");

const tableBody =
    document.getElementById("enquiryTableBody");

const enquiryCount =
    document.getElementById("enquiryCount");

const modal =
    document.getElementById("enquiryModal");

const closeModal =
    document.getElementById("closeModal");

const closeModalBtn =
    document.getElementById("closeModalBtn");

const replyBtn =
    document.getElementById("replyBtn");


// ---------------------------------------------------------
// DISPLAY ENQUIRIES
// ---------------------------------------------------------

function displayEnquiries(list) {

    tableBody.innerHTML = "";


    if (list.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    style="text-align:center; padding:30px;"
                >
                    No enquiries found.
                </td>
            </tr>
        `;

        enquiryCount.textContent = "0 Enquiries";

        return;
    }


    list.forEach(function (enquiry) {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>

                <div class="user-info">

                    <div class="user-avatar">
                        ${enquiry.user.charAt(0)}
                    </div>

                    <div>

                        <strong>
                            ${enquiry.user}
                        </strong>

                        <span>
                            #${enquiry.id}
                        </span>

                    </div>

                </div>

            </td>


            <td>
                ${enquiry.property}
            </td>


            <td>
                ${enquiry.location}
            </td>


            <td>

                <div class="message-text">
                    ${enquiry.message}
                </div>

            </td>


            <td>
                ${enquiry.displayDate}
            </td>


            <td>

                <span
                    class="status ${enquiry.status.toLowerCase()}"
                >
                    ${enquiry.status}
                </span>

            </td>


            <td>

                <button
                    type="button"
                    class="action-btn view-btn"
                    data-id="${enquiry.id}"
                >
                    View
                </button>

            </td>

        `;


        tableBody.appendChild(row);

    });


    enquiryCount.textContent =
        `${list.length} ${
            list.length === 1
                ? "Enquiry"
                : "Enquiries"
        }`;


    addViewEvents();

}


// ---------------------------------------------------------
// SEARCH + FILTER + SORT
// ---------------------------------------------------------

function updateEnquiries() {

    let filtered =
        [...enquiries];


    // SEARCH

    const searchText =
        searchInput.value
            .trim()
            .toLowerCase();


    if (searchText !== "") {

        filtered =
            filtered.filter(function (enquiry) {

                return (

                    enquiry.user
                        .toLowerCase()
                        .includes(searchText)

                    ||

                    enquiry.email
                        .toLowerCase()
                        .includes(searchText)

                    ||

                    enquiry.property
                        .toLowerCase()
                        .includes(searchText)

                    ||

                    enquiry.message
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
            filtered.filter(function (enquiry) {

                return (
                    enquiry.status
                        .toLowerCase()
                    ===
                    selectedStatus
                );

            });

    }


    // SORT

    if (sortSelect.value === "newest") {

        filtered.sort(function (a, b) {

            return (
                new Date(b.date) -
                new Date(a.date)
            );

        });

    }


    else if (sortSelect.value === "oldest") {

        filtered.sort(function (a, b) {

            return (
                new Date(a.date) -
                new Date(b.date)
            );

        });

    }


    displayEnquiries(filtered);

}


// ---------------------------------------------------------
// VIEW BUTTON
// ---------------------------------------------------------

function addViewEvents() {

    const buttons =
        document.querySelectorAll(".view-btn");


    buttons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const id =
                    Number(
                        this.dataset.id
                    );


                const enquiry =
                    enquiries.find(
                        function (item) {

                            return item.id === id;

                        }
                    );


                if (!enquiry) {
                    return;
                }


                document.getElementById(
                    "modalUserName"
                ).textContent =
                    enquiry.user;


                document.getElementById(
                    "modalEnquiryId"
                ).textContent =
                    `Enquiry #${enquiry.id}`;


                document.getElementById(
                    "modalUser"
                ).textContent =
                    enquiry.user;


                document.getElementById(
                    "modalEmail"
                ).textContent =
                    enquiry.email;


                document.getElementById(
                    "modalProperty"
                ).textContent =
                    enquiry.property;


                document.getElementById(
                    "modalLocation"
                ).textContent =
                    enquiry.location;


                document.getElementById(
                    "modalDate"
                ).textContent =
                    enquiry.displayDate;


                document.getElementById(
                    "modalStatus"
                ).textContent =
                    enquiry.status;


                document.getElementById(
                    "modalMessage"
                ).textContent =
                    enquiry.message;


                replyBtn.dataset.id =
                    enquiry.id;


                if (
                    enquiry.status ===
                    "Replied"
                ) {

                    replyBtn.textContent =
                        "✓ Already Replied";

                }

                else {

                    replyBtn.textContent =
                        "💬 Mark as Replied";

                }


                modal.classList.add("show");

            }
        );

    });

}


// ---------------------------------------------------------
// CLOSE MODAL
// ---------------------------------------------------------

function closeEnquiryModal() {

    modal.classList.remove("show");

}


closeModal.addEventListener(
    "click",
    closeEnquiryModal
);


closeModalBtn.addEventListener(
    "click",
    closeEnquiryModal
);


modal.addEventListener(
    "click",
    function (event) {

        if (event.target === modal) {

            closeEnquiryModal();

        }

    }
);


// ---------------------------------------------------------
// MARK AS REPLIED
// ---------------------------------------------------------

replyBtn.addEventListener(
    "click",
    function () {

        const id =
            Number(this.dataset.id);


        const enquiry =
            enquiries.find(
                function (item) {

                    return item.id === id;

                }
            );


        if (!enquiry) {
            return;
        }


        enquiry.status =
            "Replied";


        updateEnquiries();


        document.getElementById(
            "modalStatus"
        ).textContent =
            "Replied";


        this.textContent =
            "✓ Already Replied";


        alert(
            "Enquiry marked as replied."
        );

    }
);


// ---------------------------------------------------------
// SEARCH BUTTON
// ---------------------------------------------------------

searchBtn.addEventListener(
    "click",
    function (event) {

        event.preventDefault();

        updateEnquiries();

    }
);


// ---------------------------------------------------------
// SEARCH WHILE TYPING
// ---------------------------------------------------------

searchInput.addEventListener(
    "input",
    function () {

        updateEnquiries();

    }
);


// ---------------------------------------------------------
// ENTER KEY
// ---------------------------------------------------------

searchInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            updateEnquiries();

        }

    }
);


// ---------------------------------------------------------
// STATUS FILTER
// ---------------------------------------------------------

statusFilter.addEventListener(
    "change",
    function () {

        updateEnquiries();

    }
);


// ---------------------------------------------------------
// SORT
// ---------------------------------------------------------

sortSelect.addEventListener(
    "change",
    function () {

        updateEnquiries();

    }
);


// ---------------------------------------------------------
// LOGOUT
// ---------------------------------------------------------

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


// ---------------------------------------------------------
// INITIAL LOAD
// ---------------------------------------------------------

updateEnquiries();


console.log(
    "RoomDhundo Admin Enquiries loaded successfully."
);