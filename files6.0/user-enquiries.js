/* =========================================================
   ROOMDHUNDO - USER ENQUIRIES
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeUserEnquiries();

});


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeUserEnquiries() {

    const list =
        document.getElementById(
            "userEnquiriesList"
        );

    if (!list) {
        return;
    }


    // -----------------------------------------------------
    // CURRENT USER
    // -----------------------------------------------------

    const {
        data,
        error
    } =
        await supabaseClient.auth.getUser();


    if (error) {

        console.error(
            "Auth error:",
            error
        );

        showEnquiryError(
            error.message
        );

        return;

    }


    const user =
        data?.user;


    if (!user) {

        window.location.href =
            "index.html";

        return;

    }


    await loadUserEnquiries(
        user.id
    );

}


/* =========================================================
   LOAD USER ENQUIRIES
   ========================================================= */

async function loadUserEnquiries(
    userId
) {

    const list =
        document.getElementById(
            "userEnquiriesList"
        );


    if (!list) {
        return;
    }


    // -----------------------------------------------------
    // LOADING
    // -----------------------------------------------------

    list.innerHTML = `
        <div class="enquiries-loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Loading your enquiries...
        </div>
    `;


    // -----------------------------------------------------
    // LOAD ENQUIRIES
    // -----------------------------------------------------

    const {
        data: enquiries,
        error: enquiryError
    } =
        await supabaseClient
            .from("enquiries")
            .select("*")
            .eq(
                "user_id",
                userId
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (enquiryError) {

        console.error(
            "Enquiry loading error:",
            enquiryError
        );

        showEnquiryError(
            enquiryError.message
        );

        return;

    }


    const enquiryList =
        enquiries || [];


    // -----------------------------------------------------
    // UPDATE COUNTS
    // -----------------------------------------------------

    updateEnquiryStats(
        enquiryList
    );


    // -----------------------------------------------------
    // EMPTY STATE
    // -----------------------------------------------------

    if (
        enquiryList.length === 0
    ) {

        list.innerHTML = `
            <div class="user-enquiries-empty">

                <div class="user-enquiries-empty-icon">
                    <i class="fa-regular fa-envelope"></i>
                </div>

                <h3>
                    No enquiries yet
                </h3>

                <p>
                    When you contact a property owner,
                    your enquiry will appear here.
                </p>

                <a
                    href="search.html"
                    class="explore-properties-btn"
                >
                    Explore Properties
                </a>

            </div>
        `;

        return;

    }


    // -----------------------------------------------------
    // GET UNIQUE IDs
    // -----------------------------------------------------

    const ownerIds = [
        ...new Set(
            enquiryList
                .map(
                    enquiry =>
                        enquiry.owner_id
                )
                .filter(Boolean)
        )
    ];


    const propertyIds = [
        ...new Set(
            enquiryList
                .map(
                    enquiry =>
                        enquiry.property_id
                )
                .filter(Boolean)
        )
    ];


    // -----------------------------------------------------
    // LOAD OWNER PROFILES
    // -----------------------------------------------------

    let ownerProfiles = [];


    if (
        ownerIds.length > 0
    ) {

     const {
    data: profiles,
    error: ownerError
} =
    await supabaseClient
        .from("profiles")
        .select(
            "id, full_name, role"
        )
        .in(
            "id",
            ownerIds
        );


        if (ownerError) {

            console.error(
                "Owner profile loading error:",
                ownerError
            );

        } else {

            ownerProfiles =
                profiles || [];

        }

    }


    // -----------------------------------------------------
    // CREATE OWNER MAP
    // -----------------------------------------------------

    const ownerMap = {};


    ownerProfiles.forEach(
        profile => {

            ownerMap[
                profile.id
            ] = profile;

        }
    );


    // -----------------------------------------------------
    // LOAD PROPERTIES
    // -----------------------------------------------------

    let properties = [];


    if (
        propertyIds.length > 0
    ) {


      const {
    data: propertyData,
    error: propertyError
} =
    await supabaseClient
        .from("buildings")
        .select(
    "id, name, location, owner_name, owner_phone, owner_whatsapp"
)
        .in(
            "id",
            propertyIds
        );


        if (propertyError) {

            console.error(
                "Property loading error:",
                propertyError
            );

        } else {

            properties =
                propertyData || [];

        }

    }


    // -----------------------------------------------------
    // CREATE PROPERTY MAP
    // -----------------------------------------------------

    const propertyMap = {};


    properties.forEach(
        property => {

            propertyMap[
                property.id
            ] = property;

        }
    );


    // -----------------------------------------------------
    // RENDER
    // -----------------------------------------------------

    list.innerHTML =
        enquiryList
            .map(
                enquiry =>
                    createUserEnquiryCard(
                        enquiry,
                        ownerMap[
                            enquiry.owner_id
                        ],
                        propertyMap[
                            enquiry.property_id
                        ]
                    )
            )
            .join("");

}


/* =========================================================
   UPDATE STATS
   ========================================================= */

function updateEnquiryStats(
    enquiries
) {

    const total =
        enquiries.length;


    const pending =
        enquiries.filter(
            enquiry =>
                String(
                    enquiry.status || ""
                ).toLowerCase() ===
                "pending"
        ).length;


    const accepted =
        enquiries.filter(
            enquiry =>
                String(
                    enquiry.status || ""
                ).toLowerCase() ===
                "accepted"
        ).length;

        const contacted =
    enquiries.filter(
        enquiry =>
            String(
                enquiry.status || ""
            ).toLowerCase() ===
            "contacted"
    ).length;


    const rejected =
        enquiries.filter(
            enquiry =>
                String(
                    enquiry.status || ""
                ).toLowerCase() ===
                "rejected"
        ).length;


    setEnquiryText(
        "userTotalEnquiries",
        total
    );


    setEnquiryText(
        "userPendingEnquiries",
        pending
    );


    setEnquiryText(
        "userAcceptedEnquiries",
        accepted
    );

    setEnquiryText(
    "userContactedEnquiries",
    contacted
);

    setEnquiryText(
        "userRejectedEnquiries",
        rejected
    );

}


/* =========================================================
   CREATE ENQUIRY CARD
   ========================================================= */

function createUserEnquiryCard(
    enquiry,
    owner,
    property
) {

    const status =
        String(
            enquiry.status ||
            "pending"
        )
            .trim()
            .toLowerCase();


    const statusLabel =
        status.charAt(0).toUpperCase() +
        status.slice(1);


    const propertyName =
        property?.name ||
        "Property";


    const roomType =
        enquiry.room_type ||
        "Room";

const ownerName =
    owner?.full_name ||
    property?.owner_name ||
    "Property Owner";

    const ownerPhone =
    property?.owner_phone ||
    "";

const ownerWhatsApp =
    property?.owner_whatsapp ||
    ownerPhone ||
    "";

    let ownerContactActions = "";

if (
    status === "accepted" ||
    status === "contacted"
) {

    const cleanOwnerPhone =
        String(ownerPhone)
            .replace(/\D/g, "");

   const cleanWhatsAppRaw =
    String(ownerWhatsApp)
        .replace(/\D/g, "");

const cleanWhatsApp =
    cleanWhatsAppRaw.length === 10
        ? `91${cleanWhatsAppRaw}`
        : cleanWhatsAppRaw;

    ownerContactActions = `
        <div class="user-enquiry-contact-actions">

            ${
                cleanOwnerPhone
                    ? `
                        <a
                            href="tel:${cleanOwnerPhone}"
                            class="owner-contact-btn owner-call-btn"
                        >
                            <i class="fa-solid fa-phone"></i>
                            Call Owner
                        </a>
                    `
                    : ""
            }

            ${
                cleanWhatsApp
                    ? `
                        <a
                            href="https://wa.me/${cleanWhatsApp}"
                            target="_blank"
                            rel="noopener"
                            class="owner-contact-btn owner-whatsapp-btn"
                        >
                            <i class="fa-brands fa-whatsapp"></i>
                            WhatsApp Owner
                        </a>
                    `
                    : ""
            }

        </div>
    `;
}


    const message =
        enquiry.message ||
        "I am interested in your room.";


    const createdAt =
        enquiry.created_at
            ? new Date(
                enquiry.created_at
            ).toLocaleString(
                "en-IN",
                {
                    dateStyle: "medium",
                    timeStyle: "short"
                }
            )
            : "—";


    const propertyUrl =
        enquiry.property_id
            ? `property.html?id=${encodeURIComponent(
                enquiry.property_id
            )}`
            : "search.html";


    let statusMessage =
        "";


    if (
        status === "pending"
    ) {

        statusMessage =
            "Your enquiry is waiting for the owner's response.";

    } else if (
        status === "accepted"
    ) {

        statusMessage =
            "The owner has accepted your enquiry.";

    } else if (
        status === "rejected"
    ) {

        statusMessage =
            "The owner has rejected this enquiry.";

    } else if (
        status === "contacted"
    ) {

        statusMessage =
            "The owner has marked this enquiry as contacted.";

    } else {

        statusMessage =
            "Your enquiry status has been updated.";

    }


    return `
        <article class="user-enquiry-card">


            <!-- =============================================
                 HEADER
                 ============================================= -->

            <div class="user-enquiry-header">

                <div class="user-enquiry-property">

                    <h3>
                        ${escapeUserEnquiryHtml(
                            propertyName
                        )}
                    </h3>

                    <p>
                        <i class="fa-solid fa-bed"></i>
                        ${escapeUserEnquiryHtml(
                            roomType
                        )}
                    </p>

                </div>


                <span
                    class="user-enquiry-status ${escapeUserEnquiryHtml(
                        status
                    )}"
                >
                    ${escapeUserEnquiryHtml(
                        statusLabel
                    )}
                </span>

            </div>


            <!-- =============================================
                 BODY
                 ============================================= -->

            <div class="user-enquiry-body">


                <!-- OWNER -->

                <div class="user-enquiry-detail">

                    <div class="user-enquiry-detail-icon">

                        <i class="fa-solid fa-user"></i>

                    </div>

                    <div class="user-enquiry-detail-text">

                        <span>
                            Owner
                        </span>

                        <strong>
                            ${escapeUserEnquiryHtml(
                                ownerName
                            )}
                        </strong>

                    </div>

                </div>


                <!-- DATE -->

                <div class="user-enquiry-detail">

                    <div class="user-enquiry-detail-icon">

                        <i class="fa-regular fa-clock"></i>

                    </div>

                    <div class="user-enquiry-detail-text">

                        <span>
                            Sent
                        </span>

                        <strong>
                            ${escapeUserEnquiryHtml(
                                createdAt
                            )}
                        </strong>

                    </div>

                </div>


                <!-- LOCATION -->

                <div class="user-enquiry-detail">

                    <div class="user-enquiry-detail-icon">

                        <i class="fa-solid fa-location-dot"></i>

                    </div>

                    <div class="user-enquiry-detail-text">

                        <span>
                            Location
                        </span>

                        <strong>
                            ${escapeUserEnquiryHtml(
                                property?.location ||
                                "Not available"
                            )}
                        </strong>

                    </div>

                </div>


                <!-- MESSAGE -->

                <div class="user-enquiry-message">

                    <span class="user-enquiry-message-label">
                        Your Message
                    </span>

                    <p>
                        “${escapeUserEnquiryHtml(
                            message
                        )}”
                    </p>

                </div>


            </div>


            <!-- =============================================
                 FOOTER
                 ============================================= -->

         <div class="user-enquiry-footer">

    <div class="user-enquiry-footer-left">

        <span class="user-enquiry-footer-note">
            ${escapeUserEnquiryHtml(statusMessage)}
        </span>

        ${ownerContactActions}

    </div>

    <a
        href="${propertyUrl}"
        class="view-property-btn"
    >
        <i class="fa-solid fa-eye"></i>
        View Property
    </a>

</div>


        </article>
    `;

}


/* =========================================================
   ERROR STATE
   ========================================================= */

function showEnquiryError(
    message
) {

    const list =
        document.getElementById(
            "userEnquiriesList"
        );


    if (!list) {
        return;
    }


    list.innerHTML = `
        <div class="user-enquiries-error">

            <div class="user-enquiries-error-icon">
                <i class="fa-solid fa-triangle-exclamation"></i>
            </div>

            <h3>
                Unable to load enquiries
            </h3>

            <p>
                ${escapeUserEnquiryHtml(
                    message
                )}
            </p>

            <button
                type="button"
                class="retry-enquiries-btn"
                onclick="loadCurrentUserEnquiries()"
            >
                Try Again
            </button>

        </div>
    `;

}


/* =========================================================
   RETRY
   ========================================================= */

async function loadCurrentUserEnquiries() {

    const {
        data,
        error
    } =
        await supabaseClient.auth.getUser();


    if (error || !data?.user) {

        window.location.href =
            "index.html";

        return;

    }


    await loadUserEnquiries(
        data.user.id
    );

}


/* =========================================================
   HELPERS
   ========================================================= */

function setEnquiryText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


function escapeUserEnquiryHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}