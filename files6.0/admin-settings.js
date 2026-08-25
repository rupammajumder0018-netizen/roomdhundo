// =========================================================
// ROOMDHUNDO ADMIN - SETTINGS
// =========================================================


// ---------------------------------------------------------
// LOGOUT
// ---------------------------------------------------------

const logoutButton =
    document.getElementById("adminLogoutBtn");

const dangerLogoutButton =
    document.getElementById("dangerLogoutBtn");


function logoutAdmin() {

    const confirmLogout =
        confirm(
            "Are you sure you want to logout?"
        );

    if (confirmLogout) {

        window.location.href =
            "index.html";

    }

}


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        logoutAdmin
    );

}


if (dangerLogoutButton) {

    dangerLogoutButton.addEventListener(
        "click",
        logoutAdmin
    );

}


// ---------------------------------------------------------
// SAVE PROFILE
// ---------------------------------------------------------

const saveProfileButton =
    document.getElementById("saveProfileBtn");


if (saveProfileButton) {

    saveProfileButton.addEventListener(
        "click",
        function () {

            const name =
                document.getElementById(
                    "adminName"
                ).value.trim();


            const email =
                document.getElementById(
                    "adminEmail"
                ).value.trim();


            const phone =
                document.getElementById(
                    "adminPhone"
                ).value.trim();


            if (name === "") {

                alert(
                    "Please enter your name."
                );

                return;

            }


            if (email === "") {

                alert(
                    "Please enter your email address."
                );

                return;

            }


            if (phone === "") {

                alert(
                    "Please enter your phone number."
                );

                return;

            }


            alert(
                "Profile updated successfully!"
            );

        }
    );

}


// ---------------------------------------------------------
// CHANGE PASSWORD
// ---------------------------------------------------------

const changePasswordButton =
    document.getElementById(
        "changePasswordBtn"
    );


if (changePasswordButton) {

    changePasswordButton.addEventListener(
        "click",
        function () {

            const currentPassword =
                document.getElementById(
                    "currentPassword"
                ).value;


            const newPassword =
                document.getElementById(
                    "newPassword"
                ).value;


            const confirmPassword =
                document.getElementById(
                    "confirmPassword"
                ).value;


            // Current password check

            if (currentPassword === "") {

                alert(
                    "Please enter your current password."
                );

                return;

            }


            // New password check

            if (newPassword === "") {

                alert(
                    "Please enter a new password."
                );

                return;

            }


            // Minimum password length

            if (newPassword.length < 6) {

                alert(
                    "New password must contain at least 6 characters."
                );

                return;

            }


            // Confirm password

            if (confirmPassword === "") {

                alert(
                    "Please confirm your new password."
                );

                return;

            }


            // Password match

            if (
                newPassword !==
                confirmPassword
            ) {

                alert(
                    "New password and confirm password do not match."
                );

                return;

            }


            alert(
                "Password changed successfully!"
            );


            // Clear password fields

            document.getElementById(
                "currentPassword"
            ).value = "";


            document.getElementById(
                "newPassword"
            ).value = "";


            document.getElementById(
                "confirmPassword"
            ).value = "";

        }
    );

}


// ---------------------------------------------------------
// SAVE NOTIFICATIONS
// ---------------------------------------------------------

const saveNotificationButton =
    document.getElementById(
        "saveNotificationBtn"
    );


if (saveNotificationButton) {

    saveNotificationButton.addEventListener(
        "click",
        function () {

            const propertyNotification =
                document.getElementById(
                    "propertyNotification"
                ).checked;


            const enquiryNotification =
                document.getElementById(
                    "enquiryNotification"
                ).checked;


            const verificationNotification =
                document.getElementById(
                    "verificationNotification"
                ).checked;


            const reviewNotification =
                document.getElementById(
                    "reviewNotification"
                ).checked;


            console.log(
                "Notification Settings:",
                {
                    propertyNotification,
                    enquiryNotification,
                    verificationNotification,
                    reviewNotification
                }
            );


            alert(
                "Notification settings saved successfully!"
            );

        }
    );

}


// ---------------------------------------------------------
// SAVE WEBSITE SETTINGS
// ---------------------------------------------------------

const saveWebsiteButton =
    document.getElementById(
        "saveWebsiteBtn"
    );


if (saveWebsiteButton) {

    saveWebsiteButton.addEventListener(
        "click",
        function () {

            const websiteName =
                document.getElementById(
                    "websiteName"
                ).value.trim();


            const supportEmail =
                document.getElementById(
                    "supportEmail"
                ).value.trim();


            const websiteLocation =
                document.getElementById(
                    "websiteLocation"
                ).value.trim();


            const currency =
                document.getElementById(
                    "currency"
                ).value;


            if (websiteName === "") {

                alert(
                    "Please enter the website name."
                );

                return;

            }


            if (supportEmail === "") {

                alert(
                    "Please enter the support email."
                );

                return;

            }


            if (websiteLocation === "") {

                alert(
                    "Please enter the primary location."
                );

                return;

            }


            console.log(
                "Website Settings:",
                {
                    websiteName,
                    supportEmail,
                    websiteLocation,
                    currency
                }
            );


            alert(
                "Website settings saved successfully!"
            );

        }
    );

}


// ---------------------------------------------------------
// NAVIGATION
// ---------------------------------------------------------

const navItems =
    document.querySelectorAll(
        ".nav-item"
    );


navItems.forEach(
    function (item) {

        item.addEventListener(
            "click",
            function () {

                // Let the browser
                // follow the HTML href.

                navItems.forEach(
                    function (nav) {

                        nav.classList.remove(
                            "active"
                        );

                    }
                );


                this.classList.add(
                    "active"
                );

            }
        );

    }
);


// ---------------------------------------------------------
// INITIALIZE SETTINGS
// ---------------------------------------------------------

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "RoomDhundo Admin Settings loaded successfully."
        );

    }
);
