// =========================================================
// ROOMDHUNDO ADMIN - PROPERTY MANAGEMENT
// =========================================================


// ---------------------------------------------------------
// TEMPORARY PROPERTY DATA
// ---------------------------------------------------------

const properties = [
    {
        name: "Jaguli Student PG",
        description: "2-person room",
        type: "PG",
        owner: "Rahul Das",
        location: "Jaguli",
        rent: 5000,
        status: "approved",
        icon: "🏠"
    },

    {
        name: "Haringhata Room",
        description: "Furnished room",
        type: "Room",
        owner: "Amit Roy",
        location: "Haringhata",
        rent: 6000,
        status: "pending",
        icon: "🛏️"
    },

    {
        name: "Maa Mess",
        description: "Student mess",
        type: "Mess",
        owner: "Suman Ghosh",
        location: "Jaguli",
        rent: 2500,
        status: "approved",
        icon: "🍛"
    },

    {
        name: "Green Guest House",
        description: "Daily stay",
        type: "Guest House",
        owner: "Sanjay Paul",
        location: "Haringhata",
        rent: 900,
        status: "pending",
        icon: "🏡"
    },

    {
        name: "University Flat",
        description: "2 BHK",
        type: "Flat",
        owner: "Arindam Sen",
        location: "Haringhata",
        rent: 12000,
        status: "approved",
        icon: "🏢"
    },

    {
        name: "Campus Room",
        description: "Single room",
        type: "Room",
        owner: "Debashis Roy",
        location: "Jaguli",
        rent: 4500,
        status: "rejected",
        icon: "🛏️"
    }
];


// ---------------------------------------------------------
// ELEMENTS
// ---------------------------------------------------------

const tableBody =
    document.getElementById("propertyTableBody");

const searchInput =
    document.getElementById("propertySearch");

const searchButton =
    document.getElementById("searchBtn");

const typeFilter =
    document.getElementById("propertyTypeFilter");

const statusFilter =
    document.getElementById("propertyStatusFilter");

const sortFilter =
    document.getElementById("propertySort");

const propertyCount =
    document.getElementById("propertyCount");


// ---------------------------------------------------------
// DISPLAY PROPERTIES
// ---------------------------------------------------------

function displayProperties(propertyList) {

    tableBody.innerHTML = "";


    if (propertyList.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="no-results">
                    No properties found.
                </td>
            </tr>
        `;

        propertyCount.textContent = "0 Properties";

        return;
    }


    propertyList.forEach(function (property, index) {

        const row = document.createElement("tr");


        let statusText =
            property.status.charAt(0).toUpperCase() +
            property.status.slice(1);


        row.innerHTML = `

            <td>

                <div class="property-info">

                    <div class="property-image">
                        ${property.icon}
                    </div>

                    <div>

                        <strong>
                            ${property.name}
                        </strong>

                        <span>
                            ${property.description}
                        </span>

                    </div>

                </div>

            </td>


            <td>
                ${property.type}
            </td>


            <td>
                ${property.owner}
            </td>


            <td>
                ${property.location}
            </td>


            <td>
                ₹${property.rent.toLocaleString("en-IN")}
            </td>


            <td>

                <span class="status ${property.status}">
                    ${statusText}
                </span>

            </td>


            <td>

                <button
                    class="action-btn view-btn"
                    onclick="viewProperty(${index})"
                >
                    View
                </button>

            </td>

        `;


        tableBody.appendChild(row);

    });


    propertyCount.textContent =
        `${propertyList.length} Properties`;
}


// ---------------------------------------------------------
// FILTER PROPERTIES
// ---------------------------------------------------------

function filterProperties() {

    const searchValue =
        searchInput.value.toLowerCase().trim();

    const selectedType =
        typeFilter.value;

    const selectedStatus =
        statusFilter.value;


    let filteredProperties =
        properties.filter(function (property) {

            const matchesSearch =
                property.name
                    .toLowerCase()
                    .includes(searchValue) ||

                property.owner
                    .toLowerCase()
                    .includes(searchValue) ||

                property.location
                    .toLowerCase()
                    .includes(searchValue);


            const matchesType =
                selectedType === "all" ||
                property.type === selectedType;


            const matchesStatus =
                selectedStatus === "all" ||
                property.status === selectedStatus;


            return (
                matchesSearch &&
                matchesType &&
                matchesStatus
            );

        });


    sortProperties(filteredProperties);

}


// ---------------------------------------------------------
// SORT PROPERTIES
// ---------------------------------------------------------

function sortProperties(propertyList) {

    const sortValue =
        sortFilter.value;


    if (sortValue === "price-low") {

        propertyList.sort(function (a, b) {
            return a.rent - b.rent;
        });

    }


    else if (sortValue === "price-high") {

        propertyList.sort(function (a, b) {
            return b.rent - a.rent;
        });

    }


    else if (sortValue === "oldest") {

        propertyList.reverse();

    }


    displayProperties(propertyList);
}


// ---------------------------------------------------------
// VIEW PROPERTY
// ---------------------------------------------------------

function viewProperty(index) {

    const property = properties[index];


    document.getElementById(
        "modalPropertyName"
    ).textContent = property.name;


    document.getElementById(
        "modalPropertyType"
    ).textContent = property.type;


    document.getElementById(
        "modalPropertyIcon"
    ).textContent = property.icon;


    document.getElementById(
        "modalOwner"
    ).textContent = property.owner;


    document.getElementById(
        "modalLocation"
    ).textContent = property.location;


    document.getElementById(
        "modalRent"
    ).textContent =
        "₹" +
        property.rent.toLocaleString("en-IN");


    document.getElementById(
        "modalStatus"
    ).textContent =
        property.status.charAt(0).toUpperCase() +
        property.status.slice(1);


    document.getElementById(
        "modalDescription"
    ).textContent =
        property.description;


    document.getElementById(
        "propertyModal"
    ).classList.add("show");
}

// =========================================================
// PROPERTY MODAL CONTROLS
// =========================================================

const propertyModal =
    document.getElementById("propertyModal");


const closePropertyModal =
    document.getElementById("closePropertyModal");


const closePropertyBtn =
    document.getElementById("closePropertyBtn");


const approvePropertyBtn =
    document.getElementById("approvePropertyBtn");


const rejectPropertyBtn =
    document.getElementById("rejectPropertyBtn");


// ---------------------------------------------------------
// CLOSE MODAL
// ---------------------------------------------------------

function closeModal() {

    propertyModal.classList.remove("show");

}


closePropertyModal.addEventListener(
    "click",
    closeModal
);


closePropertyBtn.addEventListener(
    "click",
    closeModal
);


// ---------------------------------------------------------
// CLOSE WHEN CLICKING OUTSIDE
// ---------------------------------------------------------

propertyModal.addEventListener(
    "click",
    function (event) {

        if (event.target === propertyModal) {

            closeModal();

        }

    }
);


// ---------------------------------------------------------
// APPROVE PROPERTY
// ---------------------------------------------------------

approvePropertyBtn.addEventListener(
    "click",
    function () {

        alert(
            "Property approved successfully."
        );

        closeModal();

    }
);


// ---------------------------------------------------------
// REJECT PROPERTY
// ---------------------------------------------------------

rejectPropertyBtn.addEventListener(
    "click",
    function () {

        const confirmed =
            confirm(
                "Are you sure you want to reject this property?"
            );


        if (confirmed) {

            alert(
                "Property rejected."
            );

            closeModal();

        }

    }
);


// ---------------------------------------------------------
// SEARCH
// ---------------------------------------------------------

searchButton.addEventListener(
    "click",
    filterProperties
);


searchInput.addEventListener(
    "input",
    filterProperties
);


// ---------------------------------------------------------
// FILTER EVENTS
// ---------------------------------------------------------

typeFilter.addEventListener(
    "change",
    filterProperties
);


statusFilter.addEventListener(
    "change",
    filterProperties
);


sortFilter.addEventListener(
    "change",
    filterProperties
);


// ---------------------------------------------------------
// LOGOUT
// ---------------------------------------------------------

const logoutButton =
    document.getElementById("adminLogoutBtn");


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


// ---------------------------------------------------------
// INITIAL LOAD
// ---------------------------------------------------------

displayProperties(properties);