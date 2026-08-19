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


    // User must be logged in
    if (!token) {

        window.location.href =
            "login/login.html";

        return;
    }


    // Verify the login token
    try {

        const response = await fetch(
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


        setupBookingForm();

    } catch (error) {

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


    form.addEventListener(
        "submit",
        submitBooking
    );
}


// ========================================
// SUBMIT BOOKING
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
    // GET FORM VALUES
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

        submitButton.disabled = true;

        submitButton.textContent =
            "SENDING...";
    }


    showBookingMessage(
        "Sending booking request...",
        false
    );


    // ========================================
    // SEND TO FASTAPI
    // ========================================

    try {

        const response = await fetch(
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

        if (response.status === 401) {

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
                "Unable to submit booking.",
                true
            );

            return;
        }


        // ========================================
        // SUCCESS
        // ========================================

        showBookingMessage(
            "Booking request sent successfully!",
            false
        );


        document
            .getElementById("bookingForm")
            .reset();


    } catch (error) {

        console.error(
            "BOOKING ERROR:",
            error
        );


        showBookingMessage(
            "Unable to connect to the server.",
            true
        );


    } finally {

        if (submitButton) {

            submitButton.disabled = false;

            submitButton.textContent =
                "SEND BOOKING REQUEST";
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


    message.textContent = text;


    if (isError) {

        message.classList.add(
            "booking-message-error"
        );

    } else {

        message.classList.remove(
            "booking-message-error"
        );
    }
}