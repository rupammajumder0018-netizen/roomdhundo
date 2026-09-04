async function initRenterDashboard() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const onOwnPage =
        window.location.pathname.endsWith(
            "user-dashboard.html"
        );

    const isDashboard =
        params.get("dashboard") === "renter" ||
        onOwnPage;

    const dashboard =
        document.getElementById(
            "renterDashboard"
        );

    const searchHeader =
        document.querySelector(
            ".search-header"
        );

    const searchContainer =
        document.querySelector(
            ".search-container"
        );

    if (!dashboard) {
        return;
    }

    if (!isDashboard) {
        dashboard.style.display = "none";
        return;
    }

    dashboard.style.display = "block";

    if (searchHeader) {
        searchHeader.style.display = "none";
    }

    if (searchContainer) {
        searchContainer.style.display = "none";
    }


    // =================================================
    // CURRENT USER
    // =================================================

    const user =
        await getCurrentUser();

    if (!user) {

        window.location.href =
            "index.html";

        return;
    }


    // =================================================
    // PROFILE
    // =================================================

    const {
        data: profile,
        error: profileError
    } =
        await supabaseClient
            .from("profiles")
            .select(
                "id, full_name, role"
            )
            .eq(
                "id",
                user.id
            )
            .maybeSingle();


    if (profileError) {

        console.error(
            "Profile error:",
            profileError
        );

    }


    const userRole =
        String(
            profile?.role || "user"
        )
            .trim()
            .toLowerCase();


    // =================================================
    // ADMIN
    //
    // Admin is still allowed to use the User Dashboard.
    // Do NOT redirect admin to another dashboard here.
    // =================================================

    const isAdmin =
        isAdminEmail(user) &&
        userRole === "admin";


    const displayName =
        profile?.full_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "User";


    const roleLabel =
        isAdmin
            ? "Super Admin"
            : userRole === "owner"
                ? "Owner"
                : "Renter";


    // =================================================
    // PROFILE DISPLAY
    // =================================================

    const renterNameEl =
        document.getElementById(
            "renterName"
        );

    const renterFullNameEl =
        document.getElementById(
            "renterFullName"
        );

    const renterEmailEl =
        document.getElementById(
            "renterEmail"
        );

    const dashboardProfileRole =
        document.getElementById(
            "dashboardProfileRole"
        );

    const dashboardAccountType =
        document.getElementById(
            "dashboardAccountType"
        );


    if (renterNameEl) {
        renterNameEl.textContent =
            displayName;
    }

    if (renterFullNameEl) {
        renterFullNameEl.textContent =
            displayName;
    }

    if (renterEmailEl) {
        renterEmailEl.textContent =
            user.email || "—";
    }

    if (dashboardProfileRole) {
        dashboardProfileRole.textContent =
            roleLabel;
    }

    if (dashboardAccountType) {
        dashboardAccountType.textContent =
            roleLabel;
    }

// =================================================
// SAVED PROPERTY COUNT
// =================================================

const savedCountEl =
    document.getElementById(
        "savedPropertyCount"
    );

if (savedCountEl) {

    savedCountEl.textContent = "0";

}


try {

    const {
        count,
        error: savedCountError
    } =
        await supabaseClient
           .from("saved_buildings")
.select(
    "building_id",
    {
        count: "exact",
        head: true
    }
)
            .eq(
                "user_id",
                user.id
            );


    if (savedCountError) {

        console.error(
            "Saved property count error:",
            savedCountError
        );

    } else if (savedCountEl) {

        savedCountEl.textContent =
            Number.isFinite(count)
                ? count
                : 0;

    }

}
catch (error) {

    console.error(
        "Saved property count failed:",
        error
    );

}


    // =================================================
    // ENQUIRY COUNT
    // =================================================

    let enquiryCount = 0;

    const {
        data: enquiries,
        error: enquiryError
    } =
        await supabaseClient
            .from("enquiries")
            .select("id")
            .eq(
                "user_id",
                user.id
            );


    if (enquiryError) {

        console.warn(
            "Enquiry count error:",
            enquiryError
        );

    } else {

        enquiryCount =
            enquiries?.length || 0;

    }

    // =================================================
// DISPLAY ENQUIRY COUNT
// =================================================

const enquiryCountEl =
    document.getElementById(
        "enquiryCount"
    );

if (enquiryCountEl) {

    enquiryCountEl.textContent =
        enquiryCount;

}




    // =================================================
    // EXPLORE
    // =================================================

    function goToSearch() {

        window.location.href =
            "search.html";

    }


    document
        .getElementById(
            "dashboardExploreBtn"
        )
        ?.addEventListener(
            "click",
            goToSearch
        );


    document
        .getElementById(
            "dashboardExploreMainBtn"
        )
        ?.addEventListener(
            "click",
            goToSearch
        );


    // =================================================
    // SAVED PROPERTIES
    // =================================================

    function goToSaved() {

        window.location.href =
            "saved.html";

    }


    document
        .getElementById(
            "dashboardSavedBtn"
        )
        ?.addEventListener(
            "click",
            goToSaved
        );


    document
        .getElementById(
            "dashboardSavedStatBtn"
        )
        ?.addEventListener(
            "click",
            goToSaved
        );


    // =================================================
    // ENQUIRIES
    // =================================================

    function goToEnquiries() {

        /*
         * Use enquiries.html when it exists.
         * Otherwise keep the user informed.
         */

        window.location.href =
            "enquiries.html";

    }


    document
        .getElementById(
            "dashboardEnquiriesBtn"
        )
        ?.addEventListener(
            "click",
            goToEnquiries
        );


    document
        .getElementById(
            "dashboardEnquiriesStatBtn"
        )
        ?.addEventListener(
            "click",
            goToEnquiries
        );


    // =================================================
    // EDIT PROFILE
    // =================================================

    const editProfileBtn =
        document.getElementById(
            "editProfileBtn"
        );

    const editModal =
        document.getElementById(
            "profileEditModal"
        );

    const closeEditBtn =
        document.getElementById(
            "profileEditCloseBtn"
        );

    const cancelEditBtn =
        document.getElementById(
            "profileEditCancelBtn"
        );

    const editForm =
        document.getElementById(
            "profileEditForm"
        );

    const editNameInput =
        document.getElementById(
            "editProfileName"
        );

    const editEmailInput =
        document.getElementById(
            "editProfileEmail"
        );

    const editMessage =
        document.getElementById(
            "profileEditMessage"
        );

    const editSaveBtn =
        document.getElementById(
            "profileEditSaveBtn"
        );


    function openEditProfile() {

        if (!editModal) {
            return;
        }


        if (editNameInput) {

            editNameInput.value =
                displayName;

        }


        if (editEmailInput) {

            editEmailInput.value =
                user.email || "";

        }


        if (editMessage) {

            editMessage.textContent =
                "";

            editMessage.style.color =
                "";

        }


        editModal.classList.add(
            "show"
        );

        editModal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.style.overflow =
            "hidden";


        editNameInput?.focus();

    }


    function closeEditProfile() {

        if (!editModal) {
            return;
        }

        editModal.classList.remove(
            "show"
        );

        editModal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.style.overflow =
            "";

    }


    editProfileBtn?.addEventListener(
        "click",
        openEditProfile
    );


    closeEditBtn?.addEventListener(
        "click",
        closeEditProfile
    );


    cancelEditBtn?.addEventListener(
        "click",
        closeEditProfile
    );


    editModal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                editModal
            ) {

                closeEditProfile();

            }

        }
    );


    editForm?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const newName =
                editNameInput?.value
                    ?.trim() ||
                "";

            const newEmail =
                editEmailInput?.value
                    ?.trim() ||
                "";


            if (
                !newName ||
                newName.length < 2
            ) {

                if (editMessage) {

                    editMessage.style.color =
                        "#dc2626";

                    editMessage.textContent =
                        "Please enter your full name.";

                }

                return;
            }


            if (!validateEmail(newEmail)) {

                if (editMessage) {

                    editMessage.style.color =
                        "#dc2626";

                    editMessage.textContent =
                        "Please enter a valid email address.";

                }

                return;
            }


            if (
                editSaveBtn
            ) {

                editSaveBtn.disabled =
                    true;

                editSaveBtn.textContent =
                    "Saving...";

            }


            if (editMessage) {

                editMessage.style.color =
                    "#6b7280";

                editMessage.textContent =
                    "Updating your profile...";

            }


            try {

                // -----------------------------------------
                // UPDATE PROFILE NAME
                // -----------------------------------------

                const {
                    error: nameError
                } =
                    await supabaseClient
                        .from("profiles")
                        .update({
                            full_name:
                                newName
                        })
                        .eq(
                            "id",
                            user.id
                        );


                if (nameError) {

                    throw new Error(
                        nameError.message
                    );

                }


                // -----------------------------------------
                // UPDATE AUTH METADATA
                // -----------------------------------------

                const {
                    error: metadataError
                } =
                    await supabaseClient.auth
                        .updateUser({
                            data: {
                                full_name:
                                    newName
                            }
                        });


                if (metadataError) {

                    console.warn(
                        "Metadata update warning:",
                        metadataError
                    );

                }


                // -----------------------------------------
                // UPDATE EMAIL ONLY WHEN CHANGED
                // -----------------------------------------

                let emailChanged =
    String(newEmail || "").trim().toLowerCase() !==
    String(user.email || "").trim().toLowerCase();


                if (emailChanged) {

                    const {
                        error: emailError
                    } =
                        await supabaseClient.auth
                            .updateUser({
                                email:
                                    newEmail
                            });


                    if (emailError) {

                        throw new Error(
                            emailError.message
                        );

                    }

                }


                // -----------------------------------------
                // UPDATE UI
                // -----------------------------------------

                if (renterNameEl) {
                    renterNameEl.textContent =
                        newName;
                }

                if (renterFullNameEl) {
                    renterFullNameEl.textContent =
                        newName;
                }


                if (editMessage) {

                    editMessage.style.color =
                        "#16a34a";

                    editMessage.textContent =
                        emailChanged
                            ? "Profile updated. Please confirm your new email if Supabase requires confirmation."
                            : "Profile updated successfully.";

                }


                // Refresh navbar profile
                await updateNavForUser(user);


                setTimeout(
                    closeEditProfile,
                    1300
                );


            } catch (error) {

                console.error(
                    "Edit profile error:",
                    error
                );


                if (editMessage) {

                    editMessage.style.color =
                        "#dc2626";

                    editMessage.textContent =
                        error.message ||
                        "Unable to update your profile.";

                }

            } finally {

                if (editSaveBtn) {

                    editSaveBtn.disabled =
                        false;

                    editSaveBtn.textContent =
                        "💾 Save Changes";

                }

            }

        }
    );


    // =================================================
    // ESC TO CLOSE EDIT MODAL
    // =================================================

    const escapeHandler =
        event => {

            if (
                event.key === "Escape" &&
                editModal?.classList.contains("show")
            ) {

                closeEditProfile();

            }

        };


    document.addEventListener(
        "keydown",
        escapeHandler
    );



// =================================================
// NEED HELP / WHATSAPP
// =================================================

document
    .getElementById(
        "needHelpWhatsAppBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            const whatsappNumber =
                "9382991409";

            const message =
                "Hello RoomDhundo, I need help with my account.";

            const whatsappUrl =
                `https://wa.me/91${whatsappNumber}?text=${encodeURIComponent(message)}`;

            window.open(
                whatsappUrl,
                "_blank"
            );

        }
    );



    // =================================================
    // LOGOUT
    // =================================================

    document
        .getElementById(
            "dashboardLogoutBtn"
        )
        ?.addEventListener(
            "click",
            async () => {

                const confirmed =
                    window.confirm(
                        "Are you sure you want to logout?"
                    );


                if (!confirmed) {
                    return;
                }


                const {
                    error
                } =
                    await supabaseClient.auth
                        .signOut();


                if (error) {

                    console.error(
                        "Logout error:",
                        error
                    );

                    alert(
                        "Unable to log out. Please try again."
                    );

                    return;

                }


                window.location.href =
                    "index.html";

            }
        );

}