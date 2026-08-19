const BOOKINGS_API_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", loadBookings);


async function loadBookings() {

    const bookingsList =
        document.getElementById("bookingsList");

    const token =
        localStorage.getItem("access_token");


    // ========================================
    // NOT LOGGED IN
    // ========================================

    if (!token) {

        bookingsList.innerHTML = `
            <div class="bookings-empty">

                <p>
                    You need to log in to view your bookings.
                </p>

                <a href="login/login.html">
                    LOGIN
                </a>

            </div>
        `;

        return;
    }


    // ========================================
    // LOAD BOOKINGS
    // ========================================

    try {

        console.log("BOOKINGS: Starting request");
        console.log("BOOKINGS: Token exists:", !!token);
        console.log("BOOKINGS: API:", `${API_URL}/api/bookings`);

        const response = await fetch(
            `${BOOKINGS_API_URL}/api/bookings`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        console.log(
            "BOOKINGS: Response status:",
            response.status
        );

        const result =
            await response.json();

        console.log(
            "BOOKINGS: Response data:",
            result
        );

        // ========================================
        // INVALID TOKEN
        // ========================================

        if (response.status === 401) {

            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "user"
            );

            bookingsList.innerHTML = `
                <div class="bookings-empty">

                    <p>
                        Your session has expired.
                    </p>

                    <a href="login/login.html">
                        LOGIN AGAIN
                    </a>

                </div>
            `;

            return;
        }


        // ========================================
        // OTHER ERROR
        // ========================================

        if (!response.ok) {

            throw new Error(
                result.detail ||
                "Unable to load bookings."
            );
        }


        const bookings =
            result.bookings || [];


        // ========================================
        // NO BOOKINGS
        // ========================================

        if (bookings.length === 0) {

            bookingsList.innerHTML = `
                <div class="bookings-empty">

                    <p>
                        You don't have any bookings yet.
                    </p>

                    <a href="booking.html">
                        BOOK AN EVENT
                    </a>

                </div>
            `;

            return;
        }


        // ========================================
        // DISPLAY BOOKINGS
        // ========================================

        bookingsList.innerHTML =
            bookings
                .map(createBookingCard)
                .join("");


    } catch (error) {

        console.error(
            "BOOKINGS ERROR:",
            error
        );


        bookingsList.innerHTML = `
            <div class="bookings-empty">

                <p>
                    Unable to load your bookings.
                </p>

                <small>
                    Make sure the Rohn Music server is running.
                </small>

            </div>
        `;
    }
}


// ========================================
// BOOKING CARD
// ========================================

function createBookingCard(booking) {

    const status =
        booking.status || "pending";


    const statusText =
        status.toUpperCase();


    const date =
        formatDate(booking.event_date);


    return `
        <article class="booking-card">

            <div class="booking-card-top">

                <div>

                    <p class="booking-card-label">
                        ${escapeHtml(
                            booking.event_type
                        )}
                    </p>

                    <h2>
                        ${date}
                    </h2>

                </div>


                <span
                    class="booking-status booking-status-${status}"
                >
                    ${statusText}
                </span>

            </div>


            <div class="booking-card-details">

                ${
                    booking.venue
                        ? `
                            <div>
                                <span>VENUE</span>
                                <p>
                                    ${escapeHtml(
                                        booking.venue
                                    )}
                                </p>
                            </div>
                        `
                        : ""
                }


                ${
                    booking.city
                        ? `
                            <div>
                                <span>CITY</span>
                                <p>
                                    ${escapeHtml(
                                        booking.city
                                    )}
                                </p>
                            </div>
                        `
                        : ""
                }


                ${
                    booking.guest_count
                        ? `
                            <div>
                                <span>GUESTS</span>
                                <p>
                                    ${booking.guest_count}
                                </p>
                            </div>
                        `
                        : ""
                }

            </div>


            ${
                booking.message
                    ? `
                        <div class="booking-card-message">

                            <span>MESSAGE</span>

                            <p>
                                ${escapeHtml(
                                    booking.message
                                )}
                            </p>

                        </div>
                    `
                    : ""
            }

        </article>
    `;
}


// ========================================
// DATE FORMAT
// ========================================

function formatDate(dateString) {

    if (!dateString) {
        return "Date not available";
    }

    const date =
        new Date(dateString);


    if (isNaN(date.getTime())) {
        return dateString;
    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );
}


// ========================================
// HTML ESCAPE
// ========================================

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    const div =
        document.createElement("div");

    div.textContent = String(value);

    return div.innerHTML;
}