const BOOKING_API_URL = "http://127.0.0.1:8000";

document.addEventListener(
    "DOMContentLoaded",
    initializeBooking
);


// ========================================
// INITIALIZE
// ========================================

async function initializeBooking() {

    const token =
        localStorage.getItem("access_token");


    if (!token) {

        window.location.href =
            "login/login.html";

        return;
    }


    try {

        const response =
            await fetch(
                `${BOOKING_API_URL}/api/me`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (!response.ok) {

            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "user"
            );

            window.location.href =
                "login/login.html";

            return;
        }


        const user =
            await response.json();

        console.log(
            "Logged in as:",
            user
        );


        /*
         * Check whether this page was opened
         * from EDIT BOOKING.
         *
         * Example:
         *
         * booking.html?edit=5
         */

        const params =
            new URLSearchParams(
                window.location.search
            );


        const bookingId =
            params.get("edit");


        if (bookingId) {

            await initializeEditBooking(
                bookingId,
                token
            );

        }


        setupBookingForm();

    }

    catch (error) {

        console.error(
            "AUTH ERROR:",
            error
        );

        showBookingMessage(
            "Unable to connect to the server.",
            true
        );

    }

}


// ========================================
// EDIT BOOKING INITIALIZATION
// ========================================

async function initializeEditBooking(
    bookingId,
    token
) {

    try {

        /*
         * Get the user's bookings.
         *
         * We already have this endpoint:
         *
         * GET /api/bookings
         */

        const response =
            await fetch(
                `${BOOKING_API_URL}/api/bookings`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.detail ||
                "Unable to load booking."
            );

        }


        const bookings =
            result.bookings || [];


        const booking =
            bookings.find(
                item =>
                    String(item.id) ===
                    String(bookingId)
            );


        if (!booking) {

            showBookingMessage(
                "Booking not found.",
                true
            );

            return;

        }


        /*
         * Only pending bookings
         * can be edited.
         */

        if (
            String(
                booking.status
            ).toLowerCase() !==
            "pending"
        ) {

            showBookingMessage(
                "Only pending bookings can be edited.",
                true
            );

            return;

        }


        console.log(
            "EDITING BOOKING:",
            booking
        );


        /*
         * Store booking ID so submitBooking()
         * knows this is an edit.
         */

        window.editingBookingId =
            booking.id;


        /*
         * Fill the form.
         */

        const eventType =
            document.getElementById(
                "event-type"
            );

        const eventDate =
            document.getElementById(
                "event-date"
            );

        const venue =
            document.getElementById(
                "venue"
            );

        const city =
            document.getElementById(
                "city"
            );

        const message =
            document.getElementById(
                "message"
            );


        if (eventType) {

            eventType.value =
                booking.event_type || "";

        }


        if (eventDate) {

            eventDate.value =
                booking.event_date || "";

        }


        if (venue) {

            venue.value =
                booking.venue || "";

        }


        if (city) {

            city.value =
                booking.city || "";

        }


        if (message) {

            message.value =
                booking.message || "";

        }


        /*
         * Change page/button text.
         */

        const submitButton =
            document.getElementById(
                "bookingSubmit"
            );


        if (submitButton) {

            submitButton.textContent =
                "SAVE CHANGES";

        }


        /*
         * Change the heading if desired.
         */

        const bookingTitle =
            document.querySelector(
                ".booking-title"
            );


        if (bookingTitle) {

            bookingTitle.innerHTML = `
                <span class="reveal-item">
                    EDIT YOUR BOOKING
                </span>

                <span class="reveal-item">
                    REQUEST.
                </span>
            `;

        }


        const bookingDescription =
            document.querySelector(
                ".booking-description"
            );


        if (bookingDescription) {

            bookingDescription.textContent =
                "Update your booking details before the request is approved.";

        }

    }

    catch (error) {

        console.error(
            "EDIT BOOKING LOAD ERROR:",
            error
        );


        showBookingMessage(
            error.message ||
            "Unable to load booking.",
            true
        );

    }

}


// ========================================
// FORM SETUP
// ========================================

function setupBookingForm() {

    const form =
        document.getElementById(
            "bookingForm"
        );


    if (!form) {

        console.error(
            "Booking form not found."
        );

        return;

    }


    /*
     * Prevent duplicate event listeners.
     */

    form.removeEventListener(
        "submit",
        submitBooking
    );


    form.addEventListener(
        "submit",
        submitBooking
    );

}


// ========================================
// SUBMIT / UPDATE BOOKING
// ========================================

async function submitBooking(event) {

    event.preventDefault();


    const token =
        localStorage.getItem(
            "access_token"
        );


    if (!token) {

        window.location.href =
            "login/login.html";

        return;

    }


    // ========================================
    // FORM VALUES
    // ========================================

    const eventType =
        document.getElementById(
            "event-type"
        ).value;


    const eventDate =
        document.getElementById(
            "event-date"
        ).value;


    const venue =
        document.getElementById(
            "venue"
        ).value.trim();


    const city =
        document.getElementById(
            "city"
        ).value.trim();


    const message =
        document.getElementById(
            "message"
        ).value.trim();


    // ========================================
    // REQUEST DATA
    // ========================================

    const bookingData = {

        event_type:
            eventType,

        event_date:
            eventDate,

        venue:
            venue || null,

        city:
            city || null,

        guest_count:
            null,

        message:
            message || null

    };


    console.log(
        "BOOKING DATA:",
        bookingData
    );


    // ========================================
    // BUTTON
    // ========================================

    const submitButton =
        document.getElementById(
            "bookingSubmit"
        );


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.textContent =
            window.editingBookingId
                ? "SAVING..."
                : "SENDING...";

    }


    showBookingMessage(
        window.editingBookingId
            ? "Saving your changes..."
            : "Sending booking request...",
        false
    );


    // ========================================
    // CREATE OR UPDATE
    // ========================================

    try {

        let response;


        /*
         * ======================================
         * EDIT EXISTING BOOKING
         * ======================================
         */

        if (
            window.editingBookingId
        ) {

            response =
                await fetch(
                    `${BOOKING_API_URL}/api/bookings/${window.editingBookingId}`,
                    {
                        method: "PUT",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`

                        },

                        body:
                            JSON.stringify(
                                bookingData
                            )

                    }
                );

        }


        /*
         * ======================================
         * CREATE NEW BOOKING
         * ======================================
         */

        else {

            response =
                await fetch(
                    `${BOOKING_API_URL}/api/bookings`,
                    {
                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`

                        },

                        body:
                            JSON.stringify(
                                bookingData
                            )

                    }
                );

        }


        const result =
            await response.json();


        console.log(
            "BOOKING RESPONSE:",
            response.status,
            result
        );


        // ========================================
        // AUTH ERROR
        // ========================================

        if (
            response.status ===
            401
        ) {

            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "user"
            );

            window.location.href =
                "login/login.html";

            return;

        }


        // ========================================
        // OTHER ERROR
        // ========================================

        if (!response.ok) {

            showBookingMessage(
                result.detail ||
                "Unable to save booking.",
                true
            );

            return;

        }


        // ========================================
        // SUCCESS
        // ========================================

        if (
            window.editingBookingId
        ) {

            showBookingMessage(
                "Booking updated successfully!",
                false
            );

        }

        else {

            showBookingMessage(
                "Booking request sent successfully!",
                false
            );

        }


        /*
         * Reset form after successful
         * operation.
         */

        document
            .getElementById(
                "bookingForm"
            )
            .reset();


        /*
         * Clear edit mode.
         */

        window.editingBookingId =
            null;


        /*
         * Restore button.
         */

        if (submitButton) {

            submitButton.textContent =
                "SEND BOOKING REQUEST";

        }


        /*
         * If this was an edit, return
         * the user to My Bookings after
         * a short delay.
         */

        if (
            new URLSearchParams(
                window.location.search
            ).get("edit")
        ) {

            setTimeout(
                () => {

                    window.location.href =
                        "my-bookings.html";

                },
                1000
            );

        }

    }

    catch (error) {

        console.error(
            "BOOKING ERROR:",
            error
        );


        showBookingMessage(
            "Unable to connect to the server.",
            true
        );

    }

    finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            /*
             * Don't overwrite SAVE CHANGES
             * while still editing.
             */

            if (
                !window.editingBookingId
            ) {

                submitButton.textContent =
                    "SEND BOOKING REQUEST";

            }

        }

    }

}


// ========================================
// MESSAGE
// ========================================

function showBookingMessage(
    text,
    isError = false
) {

    const message =
        document.getElementById(
            "bookingMessage"
        );


    if (!message) {
        return;
    }


    message.textContent =
        text;


    if (isError) {

        message.classList.add(
            "booking-message-error"
        );

    }

    else {

        message.classList.remove(
            "booking-message-error"
        );

    }

}