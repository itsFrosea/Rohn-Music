/* ========================================
   ROHN MUSIC
   ADMIN DASHBOARD
   SHOWS + BOOKINGS MANAGEMENT

   IMPORTANT:
   SHOWS = NO FILTERS
   BOOKINGS = BOOKING FILTERS ONLY
======================================== */


/* ========================================
   ADMIN AUTH CHECK
======================================== */

const adminToken =
    localStorage.getItem("adminToken");

if (!adminToken) {

    window.location.href =
        "../login/admin-login.html";

    throw new Error(
        "Admin authentication required."
    );

}


/* ========================================
   DOM READY
======================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {


        /* ========================================
           CONFIG
        ======================================== */

        const API_BASE =
            "http://127.0.0.1:8000";


        /* ========================================
           MAIN ELEMENTS
        ======================================== */

        const adminMain =
            document.querySelector(
                ".admin-main"
            );

        const showList =
            document.getElementById(
                "showList"
            );

        const showModal =
            document.getElementById(
                "showModal"
            );

        const showForm =
            document.getElementById(
                "showForm"
            );

        const addShowButton =
            document.getElementById(
                "addShowButton"
            );

        const modalClose =
            document.getElementById(
                "modalClose"
            );

        const cancelShow =
            document.getElementById(
                "cancelShow"
            );

        const modalTitle =
            document.getElementById(
                "modalTitle"
            );

        const formMessage =
            document.getElementById(
                "formMessage"
            );

        const logoutButton =
            document.getElementById(
                "logoutButton"
            );


        /* ========================================
           SHOW FORM ELEMENTS
        ======================================== */

        const showId =
            document.getElementById(
                "showId"
            );

        const showTitle =
            document.getElementById(
                "showTitle"
            );

        const showDate =
            document.getElementById(
                "showDate"
            );

        const showTime =
            document.getElementById(
                "showTime"
            );

        const showVenue =
            document.getElementById(
                "showVenue"
            );

        const showCity =
            document.getElementById(
                "showCity"
            );

        const showDescription =
            document.getElementById(
                "showDescription"
            );

        const showStatus =
            document.getElementById(
                "showStatus"
            );

        const showImage =
            document.getElementById(
                "showImage"
            );


        /* ========================================
           STATE
        ======================================== */

        let shows = [];

        let bookings = [];

        let currentPage =
            "shows";

        let currentBookingFilter =
            "all";


        /* ========================================
           AUTH HEADERS
        ======================================== */

        function getAuthHeaders() {

            const token =
                localStorage.getItem(
                    "adminToken"
                );


            const headers = {

                "Content-Type":
                    "application/json"

            };


            if (token) {

                headers[
                    "Authorization"
                ] =
                    `Bearer ${token}`;

            }


            return headers;

        }


        /* ========================================
           API REQUEST
        ======================================== */

        async function apiRequest(
            endpoint,
            options = {}
        ) {

            const response =
                await fetch(
                    `${API_BASE}${endpoint}`,
                    {

                        ...options,

                        headers: {

                            ...getAuthHeaders(),

                            ...(options.headers || {})

                        }

                    }
                );


            let data = null;


            try {

                data =
                    await response.json();

            }

            catch {

                data = null;

            }


            if (!response.ok) {

                const message =
                    data?.detail ||
                    data?.message ||
                    "Something went wrong.";

                throw new Error(
                    message
                );

            }


            return data;

        }


        /* ========================================
           NAVIGATION
        ======================================== */

        document
            .querySelectorAll(
                ".admin-nav-item"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const page =
                                button.dataset.page;


                            if (!page) {
                                return;
                            }


                            switchPage(
                                page
                            );

                        }
                    );

                }
            );


        /* ========================================
           SWITCH PAGE
        ======================================== */

        function switchPage(
            page
        ) {

            currentPage =
                page;


            /*
             * Update sidebar active state.
             */

            document
                .querySelectorAll(
                    ".admin-nav-item"
                )
                .forEach(
                    button => {

                        button.classList.toggle(
                            "active",
                            button.dataset.page ===
                                page
                        );

                    }
                );


            /*
             * Shows
             */

            if (
                page === "shows"
            ) {

                showShowsPage();

                loadShows();

                return;

            }


            /*
             * Bookings
             */

            if (
                page === "bookings"
            ) {

                showBookingsPage();

                loadBookings();

                return;

            }


            /*
             * Releases
             */

            if (
                page === "releases"
            ) {

                showReleasesPage();

                return;

            }

        }


        /* ========================================
           GET ORIGINAL SHOW ELEMENTS
        ======================================== */

        function getShowElements() {

            return {

                header:
                    document.querySelector(
                        ".admin-page-header"
                    ),

                toolbar:
                    document.querySelector(
                        ".show-toolbar"
                    ),

                list:
                    document.querySelector(
                        ".show-list"
                    )

            };

        }


        /* ========================================
           SHOWS PAGE

           IMPORTANT:
           NO SHOW FILTERS.
        ======================================== */

        function showShowsPage() {

            const elements =
                getShowElements();


            /*
             * Show original HTML elements.
             */

            if (elements.header) {

                elements.header.style.display =
                    "";

            }


            if (elements.toolbar) {

                elements.toolbar.style.display =
                    "none";

            }


            if (elements.list) {

                elements.list.style.display =
                    "";

            }


            /*
             * Hide bookings page.
             */

            const bookingPage =
                document.getElementById(
                    "adminBookingsPage"
                );


            if (bookingPage) {

                bookingPage.style.display =
                    "none";

            }

        }


        /* ========================================
           BOOKINGS PAGE
        ======================================== */

        function showBookingsPage() {

            const elements =
                getShowElements();


            /*
             * Hide Shows UI.
             */

            if (elements.header) {

                elements.header.style.display =
                    "none";

            }


            if (elements.toolbar) {

                elements.toolbar.style.display =
                    "none";

            }


            if (elements.list) {

                elements.list.style.display =
                    "none";

            }


            /*
             * Create booking page only once.
             */

            let bookingPage =
                document.getElementById(
                    "adminBookingsPage"
                );


            if (!bookingPage) {

                bookingPage =
                    createBookingsPage();

                adminMain.appendChild(
                    bookingPage
                );

            }


            bookingPage.style.display =
                "block";

        }


        /* ========================================
           CREATE BOOKINGS PAGE

           CREATED ONLY ONCE.
        ======================================== */

        function createBookingsPage() {

            const section =
                document.createElement(
                    "section"
                );


            section.id =
                "adminBookingsPage";


            section.className =
                "admin-bookings-page";


            section.innerHTML = `

                <!-- =================================
                     BOOKINGS HEADER
                ================================= -->

                <section
                    class="admin-page-header"
                >

                    <div>

                        <p class="admin-label">
                            MANAGEMENT
                        </p>

                        <h1>
                            BOOKINGS
                        </h1>

                        <p class="admin-description">
                            Review booking requests
                            and approve or decline
                            upcoming events.
                        </p>

                    </div>

                </section>


                <!-- =================================
                     BOOKING FILTERS
                ================================= -->

                <section
                    class="show-toolbar"
                >

                    <div class="show-filter">


                        <button
                            type="button"
                            class="
                                filter-button
                                booking-filter
                                active
                            "
                            data-booking-status="all"
                        >
                            ALL
                        </button>


                        <button
                            type="button"
                            class="
                                filter-button
                                booking-filter
                            "
                            data-booking-status="pending"
                        >
                            PENDING
                        </button>


                        <button
                            type="button"
                            class="
                                filter-button
                                booking-filter
                            "
                            data-booking-status="approved"
                        >
                            APPROVED
                        </button>


                        <button
                            type="button"
                            class="
                                filter-button
                                booking-filter
                            "
                            data-booking-status="declined"
                        >
                            DECLINED
                        </button>


                    </div>

                </section>


                <!-- =================================
                     BOOKING LIST
                ================================= -->

                <section
                    class="show-list"
                >

                    <div
                        id="bookingList"
                        class="show-list-inner"
                    >

                        <div
                            class="admin-loading"
                        >

                            <span>
                                Loading bookings...
                            </span>

                        </div>

                    </div>

                </section>

            `;


            initializeBookingFilters(
                section
            );


            return section;

        }


        /* ========================================
           RELEASES PAGE
        ======================================== */

        function showReleasesPage() {

            const elements =
                getShowElements();


            if (elements.header) {

                elements.header.style.display =
                    "none";

            }


            if (elements.toolbar) {

                elements.toolbar.style.display =
                    "none";

            }


            if (elements.list) {

                elements.list.style.display =
                    "none";

            }


            const bookingPage =
                document.getElementById(
                    "adminBookingsPage"
                );


            if (bookingPage) {

                bookingPage.style.display =
                    "none";

            }


            /*
             * Keep this simple for now.
             */

            alert(
                "Releases management is not connected yet."
            );

        }


        /* ========================================
           LOAD SHOWS
        ======================================== */

        async function loadShows() {

            if (!showList) {
                return;
            }


            showList.innerHTML = `

                <div class="admin-loading">

                    <span>
                        Loading shows...
                    </span>

                </div>

            `;


            try {

                const data =
                    await apiRequest(
                        "/api/shows/admin"
                    );


                console.log(
                    "ADMIN SHOW API RESPONSE:",
                    data
                );


                if (
                    Array.isArray(data)
                ) {

                    shows =
                        data;

                }

                else {

                    shows =
                        Array.isArray(
                            data?.shows
                        )
                            ? data.shows
                            : [];

                }


                console.log(
                    "ADMIN SHOWS ARRAY:",
                    shows
                );


                renderShows();

            }

            catch (error) {

                console.error(
                    "LOAD SHOWS ERROR:",
                    error
                );


                showList.innerHTML = `

                    <div
                        class="admin-loading"
                    >

                        <span>
                            Unable to load shows.
                        </span>

                        <p
                            style="
                                margin-top:10px;
                                color:#555;
                            "
                        >
                            ${escapeHtml(
                                error.message
                            )}
                        </p>

                    </div>

                `;

            }

        }


        /* ========================================
           RENDER SHOWS

           NO FILTERING.
        ======================================== */

        function renderShows() {

            /*
             * IMPORTANT:
             * Every show returned by
             * /api/shows/admin is displayed.
             *
             * No pending/approved/rejected
             * filtering here.
             */

            const list =
                [...shows];


            list.sort(
                (a, b) => {

                    return String(
                        a.date || ""
                    ).localeCompare(
                        String(
                            b.date || ""
                        )
                    );

                }
            );


            if (
                list.length === 0
            ) {

                showList.innerHTML = `

                    <div
                        class="admin-loading"
                    >

                        <span>
                            No shows found.
                        </span>

                    </div>

                `;

                return;

            }


            showList.innerHTML =
                list
                    .map(
                        show =>
                            createShowCard(
                                show
                            )
                    )
                    .join("");

        }


        /* ========================================
           CREATE SHOW CARD
        ======================================== */

        function createShowCard(
            show
        ) {

            const id =
                show.id;


            const title =
                escapeHtml(
                    show.title ||
                    "Untitled Show"
                );


            const date =
                formatDate(
                    show.date
                );


            const venue =
                escapeHtml(
                    show.venue ||
                    "Venue TBA"
                );


            const city =
                escapeHtml(
                    show.city ||
                    ""
                );


            const approvalStatus =
                String(
                    show.approval_status ??
                    "pending"
                ).toLowerCase();


            const showStatusValue =
                String(
                    show.status ||
                    "upcoming"
                ).toLowerCase();


            return `

                <article
                    class="admin-show-card"
                    data-show-id="${id}"
                >


                    <!-- ================================
                         SHOW INFORMATION
                    ================================= -->

                    <div>

                        <h2
                            class="admin-show-title"
                        >
                            ${title}
                        </h2>


                        <div
                            style="
                                margin-top:12px;
                            "
                        >

                            <span
                                class="
                                    show-status
                                    show-status-${approvalStatus}
                                "
                            >
                                ${approvalStatus.toUpperCase()}
                            </span>

                        </div>


                        <div
                            style="
                                margin-top:8px;
                            "
                        >

                            <span
                                class="
                                    show-status
                                    show-status-${showStatusValue}
                                "
                            >
                                ${showStatusValue.toUpperCase()}
                            </span>

                        </div>

                    </div>


                    <!-- ================================
                         SHOW META
                    ================================= -->

                    <div
                        class="admin-show-meta"
                    >

                        <span
                            class="admin-show-date"
                        >

                            ${date}

                            ${
                                show.start_time
                                    ? " · " +
                                      escapeHtml(
                                          show.start_time
                                      )
                                    : ""
                            }

                        </span>


                        <span
                            class="admin-show-location"
                        >

                            ${venue}

                            ${
                                city
                                    ? " · " +
                                      city
                                    : ""
                            }

                        </span>

                    </div>


                    <!-- ================================
                         ACTIONS
                    ================================= -->

                    <div
                        class="admin-show-actions"
                    >


                        ${
                            approvalStatus ===
                            "pending"

                                ? `

                                    <button
                                        class="show-action"
                                        data-action="approve"
                                        data-id="${id}"
                                        title="Approve"
                                    >

                                        <i
                                            class="
                                                fa-solid
                                                fa-check
                                            "
                                        ></i>

                                    </button>


                                    <button
                                        class="show-action"
                                        data-action="reject"
                                        data-id="${id}"
                                        title="Reject"
                                    >

                                        <i
                                            class="
                                                fa-solid
                                                fa-xmark
                                            "
                                        ></i>

                                    </button>

                                `

                                : ""
                        }


                        <button
                            class="show-action"
                            data-action="edit"
                            data-id="${id}"
                            title="Edit"
                        >

                            <i
                                class="
                                    fa-solid
                                    fa-pen
                                "
                            ></i>

                        </button>


                        <button
                            class="show-action"
                            data-action="delete"
                            data-id="${id}"
                            title="Delete"
                        >

                            <i
                                class="
                                    fa-solid
                                    fa-trash
                                "
                            ></i>

                        </button>


                    </div>

                </article>

            `;

        }


        /* ========================================
           SHOW ACTION HANDLER
        ======================================== */

        if (showList) {

            showList.addEventListener(
                "click",
                event => {

                    const button =
                        event.target.closest(
                            "[data-action]"
                        );


                    if (!button) {
                        return;
                    }


                    const action =
                        button.dataset.action;


                    const id =
                        button.dataset.id;


                    if (
                        action === "edit"
                    ) {

                        openEditModal(
                            id
                        );

                    }

                    else if (
                        action === "approve"
                    ) {

                        approveShow(
                            id
                        );

                    }

                    else if (
                        action === "reject"
                    ) {

                        rejectShow(
                            id
                        );

                    }

                    else if (
                        action === "delete"
                    ) {

                        deleteShow(
                            id
                        );

                    }

                }
            );

        }


        /* ========================================
           APPROVE SHOW
        ======================================== */

        async function approveShow(
            id
        ) {

            if (
                !confirm(
                    "Approve this show?"
                )
            ) {
                return;
            }


            try {

                await apiRequest(
                    `/api/shows/${id}/approve`,
                    {
                        method:
                            "PATCH"
                    }
                );


                await loadShows();

            }

            catch (error) {

                console.error(
                    "APPROVE SHOW ERROR:",
                    error
                );


                alert(
                    error.message
                );

            }

        }


        /* ========================================
           REJECT SHOW
        ======================================== */

        async function rejectShow(
            id
        ) {

            if (
                !confirm(
                    "Reject this show?"
                )
            ) {
                return;
            }


            try {

                await apiRequest(
                    `/api/shows/${id}/reject`,
                    {
                        method:
                            "PATCH"
                    }
                );


                await loadShows();

            }

            catch (error) {

                console.error(
                    "REJECT SHOW ERROR:",
                    error
                );


                alert(
                    error.message
                );

            }

        }


        /* ========================================
           DELETE SHOW
        ======================================== */

        async function deleteShow(
            id
        ) {

            const show =
                shows.find(
                    item =>
                        String(
                            item.id
                        ) ===
                        String(id)
                );


            const name =
                show?.title ||
                "this show";


            if (
                !confirm(
                    `Delete "${name}" permanently?`
                )
            ) {
                return;
            }


            try {

                await apiRequest(
                    `/api/shows/${id}`,
                    {
                        method:
                            "DELETE"
                    }
                );


                await loadShows();

            }

            catch (error) {

                console.error(
                    "DELETE SHOW ERROR:",
                    error
                );


                alert(
                    error.message
                );

            }

        }


        /* ========================================
           OPEN ADD SHOW MODAL
        ======================================== */

        function openAddModal() {

            if (
                !showModal ||
                !showForm
            ) {
                return;
            }


            modalTitle.textContent =
                "ADD SHOW";


            showForm.reset();


            showId.value =
                "";


            showStatus.value =
                "upcoming";


            formMessage.textContent =
                "";


            showModal.classList.add(
                "show"
            );


            document.body.style.overflow =
                "hidden";

        }


        /* ========================================
           OPEN EDIT SHOW MODAL
        ======================================== */

        function openEditModal(
            id
        ) {

            const show =
                shows.find(
                    item =>
                        String(
                            item.id
                        ) ===
                        String(id)
                );


            if (!show) {
                return;
            }


            modalTitle.textContent =
                "EDIT SHOW";


            showId.value =
                show.id;


            showTitle.value =
                show.title || "";


            showDate.value =
                show.date || "";


            showTime.value =
                show.start_time || "";


            showVenue.value =
                show.venue || "";


            showCity.value =
                show.city || "";


            showDescription.value =
                show.description || "";


            showStatus.value =
                show.status ||
                "upcoming";


            showImage.value =
                show.image_url || "";


            formMessage.textContent =
                "";


            showModal.classList.add(
                "show"
            );


            document.body.style.overflow =
                "hidden";

        }


        /* ========================================
           CLOSE MODAL
        ======================================== */

        function closeModal() {

            if (!showModal) {
                return;
            }


            showModal.classList.remove(
                "show"
            );


            document.body.style.overflow =
                "";

        }


        /* ========================================
           SAVE SHOW
        ======================================== */

        async function saveShow(
            event
        ) {

            event.preventDefault();


            if (!formMessage) {
                return;
            }


            formMessage.textContent =
                "Saving...";


            const id =
                showId.value;


            const payload = {

                title:
                    showTitle.value.trim(),

                date:
                    showDate.value,

                start_time:
                    showTime.value ||
                    null,

                venue:
                    showVenue.value.trim() ||
                    null,

                city:
                    showCity.value.trim() ||
                    null,

                description:
                    showDescription.value.trim() ||
                    null,

                status:
                    showStatus.value,

                image_url:
                    showImage.value.trim() ||
                    null

            };


            try {

                if (id) {

                    await apiRequest(
                        `/api/shows/${id}`,
                        {

                            method:
                                "PUT",

                            body:
                                JSON.stringify(
                                    payload
                                )

                        }
                    );

                }

                else {

                    await apiRequest(
                        "/api/shows",
                        {

                            method:
                                "POST",

                            body:
                                JSON.stringify(
                                    payload
                                )

                        }
                    );

                }


                formMessage.textContent =
                    "Show saved successfully.";


                await loadShows();


                setTimeout(
                    () => {

                        closeModal();

                    },
                    500
                );

            }

            catch (error) {

                console.error(
                    "SAVE SHOW ERROR:",
                    error
                );


                formMessage.textContent =
                    error.message;

            }

        }


        /* ========================================
           LOAD BOOKINGS
        ======================================== */

        async function loadBookings() {

            const bookingList =
                document.getElementById(
                    "bookingList"
                );


            if (!bookingList) {
                return;
            }


            bookingList.innerHTML = `

                <div
                    class="admin-loading"
                >

                    <span>
                        Loading bookings...
                    </span>

                </div>

            `;


            try {

                console.log(
                    "REQUESTING ADMIN BOOKINGS..."
                );


                const data =
                    await apiRequest(
                        "/api/bookings/admin"
                    );


                console.log(
                    "ADMIN BOOKING API RESPONSE:",
                    data
                );


                if (
                    Array.isArray(data)
                ) {

                    bookings =
                        data;

                }

                else {

                    bookings =
                        Array.isArray(
                            data?.bookings
                        )
                            ? data.bookings
                            : [];

                }


                console.log(
                    "ADMIN BOOKINGS ARRAY:",
                    bookings
                );


                renderBookings();

            }

            catch (error) {

                console.error(
                    "LOAD BOOKINGS ERROR:",
                    error
                );


                bookingList.innerHTML = `

                    <div
                        class="admin-loading"
                    >

                        <span>
                            Unable to load bookings.
                        </span>

                        <p
                            style="
                                margin-top:10px;
                                color:#555;
                            "
                        >
                            ${escapeHtml(
                                error.message
                            )}
                        </p>

                    </div>

                `;

            }

        }


        /* ========================================
           RENDER BOOKINGS
        ======================================== */

        function renderBookings() {

            const bookingList =
                document.getElementById(
                    "bookingList"
                );


            if (!bookingList) {
                return;
            }


            let filtered =
                [...bookings];


            /*
             * Booking filters ONLY.
             */

            if (
                currentBookingFilter !==
                "all"
            ) {

                filtered =
                    filtered.filter(
                        booking => {

                            const status =
                                String(
                                    booking.status ||
                                    "pending"
                                ).toLowerCase();


                            return (
                                status ===
                                currentBookingFilter
                            );

                        }
                    );

            }


            /*
             * Newest requests first.
             */

            filtered.sort(
                (a, b) => {

                    return String(
                        b.created_at || ""
                    ).localeCompare(
                        String(
                            a.created_at || ""
                        )
                    );

                }
            );


            if (
                filtered.length === 0
            ) {

                bookingList.innerHTML = `

                    <div
                        class="admin-loading"
                    >

                        <span>
                            No bookings found.
                        </span>

                    </div>

                `;

                return;

            }


            bookingList.innerHTML =
                filtered
                    .map(
                        booking =>
                            createBookingCard(
                                booking
                            )
                    )
                    .join("");

        }


        /* ========================================
           CREATE BOOKING CARD
        ======================================== */

        function createBookingCard(
            booking
        ) {

            const id =
                booking.id;


            const status =
                String(
                    booking.status ||
                    "pending"
                ).toLowerCase();


            const eventType =
                escapeHtml(
                    booking.event_type ||
                    "Event"
                );


            const userName =
                escapeHtml(
                    booking.user_name ||
                    "Unknown User"
                );


            const userEmail =
                escapeHtml(
                    booking.user_email ||
                    ""
                );


            const userPhone =
                escapeHtml(
                    booking.user_phone ||
                    ""
                );


            const date =
                formatDate(
                    booking.event_date
                );


            const venue =
                escapeHtml(
                    booking.venue ||
                    "Venue TBA"
                );


            const city =
                escapeHtml(
                    booking.city ||
                    ""
                );


            const guestCount =
                escapeHtml(
                    booking.guest_count ??
                    "Not specified"
                );


            const message =
                escapeHtml(
                    booking.message ||
                    ""
                );


            return `

                <article
                    class="
                        admin-show-card
                        admin-booking-card
                    "
                    data-booking-id="${id}"
                >


                    <!-- ================================
                         BOOKING INFORMATION
                    ================================= -->

                    <div>

                        <p
                            class="admin-label"
                            style="
                                margin-bottom:10px;
                            "
                        >
                            BOOKING REQUEST
                        </p>


                        <h2
                            class="admin-show-title"
                        >
                            ${eventType}
                        </h2>


                        <div
                            style="
                                margin-top:12px;
                            "
                        >

                            <span
                                class="
                                    show-status
                                    show-status-${status}
                                "
                            >
                                ${status.toUpperCase()}
                            </span>

                        </div>

                    </div>


                    <!-- ================================
                         CUSTOMER
                    ================================= -->

                    <div
                        class="admin-show-meta"
                    >

                        <span
                            class="admin-show-location"
                        >
                            ${userName}
                        </span>


                        <span
                            class="admin-show-location"
                        >
                            ${userEmail}
                        </span>


                        ${
                            userPhone
                                ? `

                                    <span
                                        class="
                                            admin-show-location
                                        "
                                    >
                                        ${userPhone}
                                    </span>

                                `
                                : ""
                        }

                    </div>


                    <!-- ================================
                         EVENT DETAILS
                    ================================= -->

                    <div
                        class="admin-show-meta"
                    >

                        <span
                            class="admin-show-date"
                        >
                            ${date}
                        </span>


                        <span
                            class="admin-show-location"
                        >

                            ${venue}

                            ${
                                city
                                    ? " · " +
                                      city
                                    : ""
                            }

                        </span>


                        <span
                            class="admin-show-location"
                        >
                            GUESTS:
                            ${guestCount}
                        </span>

                    </div>


                    ${
                        message
                            ? `

                                <div
                                    style="
                                        margin-top:20px;
                                        max-width:700px;
                                        color:#888;
                                        font-size:13px;
                                        line-height:1.7;
                                    "
                                >
                                    ${message}
                                </div>

                            `
                            : ""
                    }


                    <!-- ================================
                         ACTIONS
                    ================================= -->

                    ${
                        status === "pending"
                            ? `

                                <div
                                    class="
                                        admin-show-actions
                                    "
                                    style="
                                        margin-top:25px;
                                    "
                                >

                                    <button
                                        class="show-action"
                                        data-booking-action="approve"
                                        data-id="${id}"
                                        title="Approve booking"
                                    >

                                        <i
                                            class="
                                                fa-solid
                                                fa-check
                                            "
                                        ></i>

                                    </button>


                                    <button
                                        class="show-action"
                                        data-booking-action="decline"
                                        data-id="${id}"
                                        title="Decline booking"
                                    >

                                        <i
                                            class="
                                                fa-solid
                                                fa-xmark
                                            "
                                        ></i>

                                    </button>

                                </div>

                            `
                            : ""
                    }

                </article>

            `;

        }


        /* ========================================
           BOOKING ACTIONS
        ======================================== */

        document.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-booking-action]"
                    );


                if (!button) {
                    return;
                }


                const action =
                    button.dataset
                        .bookingAction;


                const id =
                    button.dataset.id;


                if (
                    action ===
                    "approve"
                ) {

                    approveBooking(
                        id
                    );

                }

                else if (
                    action ===
                    "decline"
                ) {

                    declineBooking(
                        id
                    );

                }

            }
        );


        /* ========================================
           APPROVE BOOKING
        ======================================== */

        async function approveBooking(
            id
        ) {

            if (
                !confirm(
                    "Approve this booking?"
                )
            ) {
                return;
            }


            try {

                await apiRequest(
                    `/api/bookings/${id}/approve`,
                    {

                        method:
                            "PATCH"

                    }
                );


                await loadBookings();

            }

            catch (error) {

                console.error(
                    "APPROVE BOOKING ERROR:",
                    error
                );


                alert(
                    error.message
                );

            }

        }


        /* ========================================
           DECLINE BOOKING
        ======================================== */

        async function declineBooking(
            id
        ) {

            if (
                !confirm(
                    "Decline this booking?"
                )
            ) {
                return;
            }


            try {

                await apiRequest(
                    `/api/bookings/${id}/decline`,
                    {

                        method:
                            "PATCH"

                    }
                );


                await loadBookings();

            }

            catch (error) {

                console.error(
                    "DECLINE BOOKING ERROR:",
                    error
                );


                alert(
                    error.message
                );

            }

        }


        /* ========================================
           BOOKING FILTERS
        ======================================== */

        function initializeBookingFilters(
            bookingPage
        ) {

            bookingPage
                .querySelectorAll(
                    ".booking-filter"
                )
                .forEach(
                    button => {

                        button.addEventListener(
                            "click",
                            () => {

                                bookingPage
                                    .querySelectorAll(
                                        ".booking-filter"
                                    )
                                    .forEach(
                                        item => {

                                            item.classList
                                                .remove(
                                                    "active"
                                                );

                                        }
                                    );


                                button.classList.add(
                                    "active"
                                );


                                currentBookingFilter =
                                    String(
                                        button.dataset
                                            .bookingStatus ||
                                        "all"
                                    ).toLowerCase();


                                renderBookings();

                            }
                        );

                    }
                );

        }


        /* ========================================
           ADD SHOW BUTTON
        ======================================== */

        if (
            addShowButton
        ) {

            addShowButton.addEventListener(
                "click",
                openAddModal
            );

        }


        /* ========================================
           CLOSE MODAL
        ======================================== */

        if (
            modalClose
        ) {

            modalClose.addEventListener(
                "click",
                closeModal
            );

        }


        if (
            cancelShow
        ) {

            cancelShow.addEventListener(
                "click",
                closeModal
            );

        }


        /* ========================================
           MODAL OVERLAY
        ======================================== */

        if (
            showModal
        ) {

            showModal.addEventListener(
                "click",
                event => {

                    if (
                        event.target.classList
                            .contains(
                                "admin-modal-overlay"
                            )
                    ) {

                        closeModal();

                    }

                }
            );

        }


        /* ========================================
           ESC KEY
        ======================================== */

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape" &&
                    showModal &&
                    showModal.classList.contains(
                        "show"
                    )
                ) {

                    closeModal();

                }

            }
        );


        /* ========================================
           SHOW FORM
        ======================================== */

        if (
            showForm
        ) {

            showForm.addEventListener(
                "submit",
                saveShow
            );

        }


        /* ========================================
           LOGOUT
        ======================================== */

        if (
            logoutButton
        ) {

            logoutButton.addEventListener(
                "click",
                () => {

                    localStorage.removeItem(
                        "adminToken"
                    );


                    localStorage.removeItem(
                        "admin"
                    );


                    window.location.href =
                        "../login/admin-login.html";

                }
            );

        }


        /* ========================================
           FORMAT DATE
        ======================================== */

        function formatDate(
            dateString
        ) {

            if (!dateString) {

                return "DATE TBA";

            }


            const date =
                new Date(
                    `${dateString}T00:00:00`
                );


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return escapeHtml(
                    dateString
                );

            }


            return date
                .toLocaleDateString(
                    "en-IN",
                    {

                        day:
                            "2-digit",

                        month:
                            "long",

                        year:
                            "numeric"

                    }
                )
                .toUpperCase();

        }


        /* ========================================
           ESCAPE HTML
        ======================================== */

        function escapeHtml(
            value
        ) {

            return String(
                value ?? ""
            )

                .replace(
                    /&/g,
                    "&amp;"
                )

                .replace(
                    /</g,
                    "&lt;"
                )

                .replace(
                    />/g,
                    "&gt;"
                )

                .replace(
                    /"/g,
                    "&quot;"
                )

                .replace(
                    /'/g,
                    "&#039;"
                );

        }


        /* ========================================
           INITIAL PAGE
        ======================================== */

        showShowsPage();

        loadShows();

    }
);