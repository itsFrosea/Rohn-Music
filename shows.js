/* ========================================
   ROHN MUSIC
   PUBLIC SHOWS
======================================== */

async function initializeShows() {

    const container =
        document.getElementById("showsList");

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="shows-loading">
            LOADING SHOWS...
        </div>
    `;

    try {

        const response =
            await fetch("/api/shows", {
                cache: "no-cache"
            });

        if (!response.ok) {
            throw new Error(
                "Unable to load shows."
            );
        }

        const data =
            await response.json();

        const shows =
            data.shows || [];

        if (!shows.length) {

            container.innerHTML = `
                <div class="shows-empty">
                    NO UPCOMING SHOWS CURRENTLY ANNOUNCED.
                </div>
            `;

            return;
        }

        container.innerHTML =
            shows.map(show => {

                const date =
                    new Date(
                        `${show.date}T00:00:00`
                    );

                const day =
                    date.toLocaleDateString(
                        "en-US",
                        {
                            day: "2-digit"
                        }
                    );

                const month =
                    date.toLocaleDateString(
                        "en-US",
                        {
                            month: "short"
                        }
                    ).toUpperCase();

                let time = "";

                if (show.start_time) {

                    time =
                        show.start_time
                            .slice(0, 5);

                }

                const location =
                    [
                        show.venue,
                        show.city
                    ]
                    .filter(Boolean)
                    .join(" · ");

                return `

                    <article
                        class="public-show scroll-reveal"
                    >

                        <div class="public-show-date">

                            <span
                                class="public-show-day"
                            >
                                ${day}
                            </span>

                            <span
                                class="public-show-month"
                            >
                                ${month}
                            </span>

                        </div>


                        <div class="public-show-info">

                            <h2
                                class="public-show-title"
                            >
                                ${escapeHTML(
                                    show.title
                                )}
                            </h2>

                            ${
                                location
                                    ? `
                                        <p
                                            class="public-show-location"
                                        >
                                            ${escapeHTML(
                                                location
                                            )}
                                        </p>
                                      `
                                    : ""
                            }

                            ${
                                time
                                    ? `
                                        <p
                                            class="public-show-time"
                                        >
                                            ${time}
                                        </p>
                                      `
                                    : ""
                            }

                        </div>


                        <a
                            href="booking.html"
                            class="public-show-action"
                        >
                            BOOK EVENT
                        </a>

                    </article>

                `;

            })
            .join("");


        /*
         * Initialize scroll reveal for
         * newly created show cards.
         */

        if (
            typeof window.initializeScrollReveal ===
            "function"
        ) {

            window.initializeScrollReveal();

        }

    } catch (error) {

        console.error(
            "SHOWS ERROR:",
            error
        );

        container.innerHTML = `
            <div class="shows-empty">
                UNABLE TO LOAD SHOWS.
            </div>
        `;

    }

}


/* ========================================
   HTML ESCAPE
======================================== */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* ========================================
   INITIAL LOAD
======================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeShows
);


/* ========================================
   SPA NAVIGATION SUPPORT
======================================== */

window.initializeShows =
    initializeShows;