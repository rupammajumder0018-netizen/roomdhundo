// =========================================================
// ROOMDHUNDO ADMIN - REVIEWS
// =========================================================


// ---------------------------------------------------------
// 1. REVIEW DATA
// ---------------------------------------------------------

const reviews = [

    {
        id: 1,
        user: "Rupam Majumder",
        property: "Jaguli Student PG",
        rating: 5,
        review: "Very good room and the location is convenient for students.",
        date: "2026-08-24",
        status: "Published"
    },

    {
        id: 2,
        user: "Ankit Roy",
        property: "Haringhata Room",
        rating: 4,
        review: "The room was clean and the owner was helpful.",
        date: "2026-08-22",
        status: "Published"
    },

    {
        id: 3,
        user: "Sayan Ghosh",
        property: "Maa Mess",
        rating: 5,
        review: "Food quality is good and the monthly price is reasonable.",
        date: "2026-08-20",
        status: "Published"
    },

    {
        id: 4,
        user: "Priya Sen",
        property: "Green Guest House",
        rating: 3,
        review: "The location is good but some facilities could be improved.",
        date: "2026-08-18",
        status: "Hidden"
    },

    {
        id: 5,
        user: "Debashis Das",
        property: "University Flat",
        rating: 4,
        review: "Nice flat with enough space. Good option for students.",
        date: "2026-08-15",
        status: "Published"
    },

    {
        id: 6,
        user: "Manish Paul",
        property: "Campus Room",
        rating: 2,
        review: "The room was not as expected and needs some maintenance.",
        date: "2026-08-12",
        status: "Hidden"
    }

];


// ---------------------------------------------------------
// 2. GET HTML ELEMENTS
// ---------------------------------------------------------

const searchInput =
    document.getElementById("reviewSearch");

const searchBtn =
    document.getElementById("searchBtn");

const statusFilter =
    document.getElementById("reviewStatusFilter");

const ratingFilter =
    document.getElementById("reviewRatingFilter");

const sortSelect =
    document.getElementById("reviewSort");

const tableBody =
    document.getElementById("reviewTableBody");

const reviewCount =
    document.getElementById("reviewCount");


// Statistics

const totalReviews =
    document.getElementById("totalReviews");

const publishedReviews =
    document.getElementById("publishedReviews");

const hiddenReviews =
    document.getElementById("hiddenReviews");

const averageRating =
    document.getElementById("averageRating");


// Modal

const reviewModal =
    document.getElementById("reviewModal");

const closeModal =
    document.getElementById("closeModal");

const closeReviewBtn =
    document.getElementById("closeReviewBtn");

const hideReviewBtn =
    document.getElementById("hideReviewBtn");

const publishReviewBtn =
    document.getElementById("publishReviewBtn");

const modalUserName =
    document.getElementById("modalUserName");

const modalPropertyName =
    document.getElementById("modalPropertyName");

const modalRating =
    document.getElementById("modalRating");

const modalUser =
    document.getElementById("modalUser");

const modalProperty =
    document.getElementById("modalProperty");

const modalDate =
    document.getElementById("modalDate");

const modalStatus =
    document.getElementById("modalStatus");

const modalReviewText =
    document.getElementById("modalReviewText");


// ---------------------------------------------------------
// 3. CURRENT REVIEW
// ---------------------------------------------------------

let currentReviewId = null;


// ---------------------------------------------------------
// 4. CREATE STAR RATING
// ---------------------------------------------------------

function createStars(rating) {

    return "⭐".repeat(rating);

}


// ---------------------------------------------------------
// 5. UPDATE STATISTICS
// ---------------------------------------------------------

function updateStatistics() {

    const total =
        reviews.length;

    const published =
        reviews.filter(function (review) {

            return review.status === "Published";

        }).length;


    const hidden =
        reviews.filter(function (review) {

            return review.status === "Hidden";

        }).length;


    let average = 0;


    if (total > 0) {

        const totalRating =
            reviews.reduce(function (sum, review) {

                return sum + review.rating;

            }, 0);


        average =
            totalRating / total;

    }


    if (totalReviews) {

        totalReviews.textContent =
            total;

    }


    if (publishedReviews) {

        publishedReviews.textContent =
            published;

    }


    if (hiddenReviews) {

        hiddenReviews.textContent =
            hidden;

    }


    if (averageRating) {

        averageRating.textContent =
            average.toFixed(1);

    }

}


// ---------------------------------------------------------
// 6. DISPLAY REVIEWS
// ---------------------------------------------------------

function displayReviews(reviewList) {

    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = "";


    if (reviewList.length === 0) {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td
                colspan="7"
                style="
                    text-align:center;
                    padding:30px;
                    color:#6b7280;
                "
            >
                No reviews found.
            </td>

        `;


        tableBody.appendChild(row);


        if (reviewCount) {

            reviewCount.textContent =
                "0 Reviews";

        }

        return;

    }


    reviewList.forEach(function (review) {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>

                <div class="user-info">

                    <div class="user-avatar">

                        ${review.user.charAt(0)}

                    </div>

                    <div>

                        <strong>
                            ${review.user}
                        </strong>

                        <span>
                            User #${review.id}
                        </span>

                    </div>

                </div>

            </td>


            <td>

                <div class="property-info">

                    <strong>
                        ${review.property}
                    </strong>

                </div>

            </td>


            <td>

                <div class="rating">

                    ${createStars(review.rating)}

                    <span class="rating-number">
                        ${review.rating}/5
                    </span>

                </div>

            </td>


            <td>

                <div class="review-text">

                    ${review.review}

                </div>

            </td>


            <td>
                ${formatDate(review.date)}
            </td>


            <td>

                <span
                    class="status ${review.status.toLowerCase()}"
                >

                    ${review.status}

                </span>

            </td>


            <td>

                <button
                    type="button"
                    class="action-btn view-btn"
                    data-id="${review.id}"
                >

                    View

                </button>

            </td>

        `;


        tableBody.appendChild(row);

    });


    if (reviewCount) {

        reviewCount.textContent =
            `${reviewList.length} ${
                reviewList.length === 1
                    ? "Review"
                    : "Reviews"
            }`;

    }


    addViewButtonEvents();

}


// ---------------------------------------------------------
// 7. FORMAT DATE
// ---------------------------------------------------------

function formatDate(dateString) {

    const date =
        new Date(dateString);


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// ---------------------------------------------------------
// 8. SEARCH + FILTER + SORT
// ---------------------------------------------------------

function updateReviews() {

    let filteredReviews =
        [...reviews];


    // SEARCH

    const searchText =
        searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";


    if (searchText !== "") {

        filteredReviews =
            filteredReviews.filter(function (review) {

                return (

                    review.user
                        .toLowerCase()
                        .includes(searchText)

                    ||

                    review.property
                        .toLowerCase()
                        .includes(searchText)

                    ||

                    review.review
                        .toLowerCase()
                        .includes(searchText)

                );

            });

    }


    // STATUS FILTER

    const selectedStatus =
        statusFilter
            ? statusFilter.value
            : "all";


    if (selectedStatus !== "all") {

        filteredReviews =
            filteredReviews.filter(function (review) {

                return (
                    review.status.toLowerCase() ===
                    selectedStatus
                );

            });

    }


    // RATING FILTER

    const selectedRating =
        ratingFilter
            ? ratingFilter.value
            : "all";


    if (selectedRating !== "all") {

        filteredReviews =
            filteredReviews.filter(function (review) {

                return (
                    review.rating ===
                    Number(selectedRating)
                );

            });

    }


    // SORT

    const selectedSort =
        sortSelect
            ? sortSelect.value
            : "newest";


    if (selectedSort === "newest") {

        filteredReviews.sort(function (a, b) {

            return (
                new Date(b.date) -
                new Date(a.date)
            );

        });

    }


    else if (selectedSort === "oldest") {

        filteredReviews.sort(function (a, b) {

            return (
                new Date(a.date) -
                new Date(b.date)
            );

        });

    }


    else if (selectedSort === "rating-high") {

        filteredReviews.sort(function (a, b) {

            return b.rating - a.rating;

        });

    }


    else if (selectedSort === "rating-low") {

        filteredReviews.sort(function (a, b) {

            return a.rating - b.rating;

        });

    }


    // DISPLAY

    displayReviews(filteredReviews);

}


// ---------------------------------------------------------
// 9. OPEN REVIEW MODAL
// ---------------------------------------------------------

function openReviewModal(reviewId) {

    const review =
        reviews.find(function (item) {

            return item.id === reviewId;

        });


    if (!review) {

        console.error(
            "Review not found:",
            reviewId
        );

        return;

    }


    currentReviewId =
        review.id;


    if (modalUserName) {

        modalUserName.textContent =
            review.user;

    }


    if (modalPropertyName) {

        modalPropertyName.textContent =
            review.property;

    }


    if (modalRating) {

        modalRating.textContent =
            `${createStars(review.rating)} ${review.rating}/5`;

    }


    if (modalUser) {

        modalUser.textContent =
            review.user;

    }


    if (modalProperty) {

        modalProperty.textContent =
            review.property;

    }


    if (modalDate) {

        modalDate.textContent =
            formatDate(review.date);

    }


    if (modalStatus) {

        modalStatus.textContent =
            review.status;

    }


    if (modalReviewText) {

        modalReviewText.textContent =
            review.review;

    }


    // Button visibility

    if (hideReviewBtn) {

        hideReviewBtn.style.display =
            review.status === "Hidden"
                ? "none"
                : "inline-block";

    }


    if (publishReviewBtn) {

        publishReviewBtn.style.display =
            review.status === "Published"
                ? "none"
                : "inline-block";

    }


    if (reviewModal) {

        reviewModal.classList.add("show");

    }

}


// ---------------------------------------------------------
// 10. CLOSE MODAL
// ---------------------------------------------------------

function closeReviewModal() {

    if (reviewModal) {

        reviewModal.classList.remove("show");

    }


    currentReviewId = null;

}


// ---------------------------------------------------------
// 11. VIEW BUTTON EVENTS
// ---------------------------------------------------------

function addViewButtonEvents() {

    const viewButtons =
        document.querySelectorAll(".view-btn");


    viewButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const reviewId =
                    Number(
                        this.dataset.id
                    );


                openReviewModal(reviewId);

            }
        );

    });

}


// ---------------------------------------------------------
// 12. HIDE REVIEW
// ---------------------------------------------------------

if (hideReviewBtn) {

    hideReviewBtn.addEventListener(
        "click",
        function () {

            const review =
                reviews.find(function (item) {

                    return (
                        item.id ===
                        currentReviewId
                    );

                });


            if (!review) {
                return;
            }


            const confirmHide =
                confirm(
                    "Are you sure you want to hide this review?"
                );


            if (confirmHide) {

                review.status =
                    "Hidden";


                closeReviewModal();

                updateStatistics();

                updateReviews();

            }

        }
    );

}


// ---------------------------------------------------------
// 13. PUBLISH REVIEW
// ---------------------------------------------------------

if (publishReviewBtn) {

    publishReviewBtn.addEventListener(
        "click",
        function () {

            const review =
                reviews.find(function (item) {

                    return (
                        item.id ===
                        currentReviewId
                    );

                });


            if (!review) {
                return;
            }


            const confirmPublish =
                confirm(
                    "Are you sure you want to publish this review?"
                );


            if (confirmPublish) {

                review.status =
                    "Published";


                closeReviewModal();

                updateStatistics();

                updateReviews();

            }

        }
    );

}


// ---------------------------------------------------------
// 14. CLOSE MODAL BUTTON
// ---------------------------------------------------------

if (closeModal) {

    closeModal.addEventListener(
        "click",
        closeReviewModal
    );

}


if (closeReviewBtn) {

    closeReviewBtn.addEventListener(
        "click",
        closeReviewModal
    );

}


// ---------------------------------------------------------
// 15. CLOSE MODAL BY CLICKING OUTSIDE
// ---------------------------------------------------------

if (reviewModal) {

    reviewModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                reviewModal
            ) {

                closeReviewModal();

            }

        }
    );

}


// ---------------------------------------------------------
// 16. SEARCH BUTTON
// ---------------------------------------------------------

if (searchBtn) {

    searchBtn.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            updateReviews();

        }
    );

}


// ---------------------------------------------------------
// 17. SEARCH WHILE TYPING
// ---------------------------------------------------------

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {

            updateReviews();

        }
    );


    searchInput.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                updateReviews();

            }

        }
    );

}


// ---------------------------------------------------------
// 18. STATUS FILTER
// ---------------------------------------------------------

if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        function () {

            updateReviews();

        }
    );

}


// ---------------------------------------------------------
// 19. RATING FILTER
// ---------------------------------------------------------

if (ratingFilter) {

    ratingFilter.addEventListener(
        "change",
        function () {

            updateReviews();

        }
    );

}


// ---------------------------------------------------------
// 20. SORT
// ---------------------------------------------------------

if (sortSelect) {

    sortSelect.addEventListener(
        "change",
        function () {

            updateReviews();

        }
    );

}


// ---------------------------------------------------------
// 21. LOGOUT
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
// 22. INITIALIZE
// ---------------------------------------------------------

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateStatistics();

        updateReviews();

        console.log(
            "RoomDhundo Admin Reviews loaded successfully."
        );

    }
);