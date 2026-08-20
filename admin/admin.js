/* ========================================
   ROHN MUSIC
   ADMIN SHOW MANAGEMENT
======================================== */

const adminToken =
    localStorage.getItem(
        "adminToken"
    );

if (!adminToken) {

    window.location.href =
        "../login/admin-login.html";

    return;

}

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================
       CONFIG
    ======================================== */

    const API_BASE = "http://127.0.0.1:8000";

    /*
     * Change this to your actual FastAPI URL.
     *
     * Example:
     *
     * const API_BASE =
     *     "https://your-api.onrender.com";
     */


    /* ========================================
       ELEMENTS
    ======================================== */

    const showList =
        document.getElementById("showList");

    const showModal =
        document.getElementById("showModal");

    const showForm =
        document.getElementById("showForm");

    const addShowButton =
        document.getElementById("addShowButton");

    const modalClose =
        document.getElementById("modalClose");

    const cancelShow =
        document.getElementById("cancelShow");

    const modalTitle =
        document.getElementById("modalTitle");

    const formMessage =
        document.getElementById("formMessage");

    const logoutButton =
        document.getElementById("logoutButton");


    /* ========================================
       FORM ELEMENTS
    ======================================== */

    const showId =
        document.getElementById("showId");

    const showTitle =
        document.getElementById("showTitle");

    const showDate =
        document.getElementById("showDate");

    const showTime =
        document.getElementById("showTime");

    const showVenue =
        document.getElementById("showVenue");

    const showCity =
        document.getElementById("showCity");


    const showDescription =
        document.getElementById("showDescription");

    const showStatus =
        document.getElementById("showStatus");

    const showImage =
        document.getElementById("showImage");


    /* ========================================
       STATE
    ======================================== */

    let shows = [];

    let currentFilter = "all";


    /* ========================================
       AUTH HEADERS
    ======================================== */

    function getAuthHeaders() {

        /*
         * If your website already stores
         * an authentication token, use it here.
         *
         * Change the key if your auth system
         * uses a different localStorage key.
         */

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

        } catch {

            data = null;

        }


        if (!response.ok) {

            const message =
                data?.detail ||
                data?.message ||
                "Something went wrong.";

            throw new Error(message);

        }


        return data;

    }


    /* ========================================
       LOAD SHOWS
    ======================================== */

    async function loadShows() {

        showList.innerHTML = `

            <div class="admin-loading">
                <span>
                    Loading shows...
                </span>
            </div>

        `;


        try {

            /*
             * Admin endpoint should return
             * ALL shows.
             */

            shows =
                await apiRequest(
                    "/api/shows/admin"
                );


            /*
             * Some APIs return:
             *
             * { "shows": [...] }
             *
             * instead of the array directly.
             */

            if (
                !Array.isArray(shows)
            ) {

                shows =
                    shows?.shows || [];

            }


            renderShows();

        } catch (error) {

            console.error(
                "LOAD SHOWS ERROR:",
                error
            );


            showList.innerHTML = `

                <div class="admin-loading">

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
    ======================================== */

    function renderShows() {

        let filteredShows =
            [...shows];


        if (
            currentFilter !== "all"
        ) {

            filteredShows =
                filteredShows.filter(
                    show =>
                        show.status ===
                        currentFilter
                );

        }


        /*
         * Sort newest event date first.
         */

        filteredShows.sort(
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
            filteredShows.length === 0
        ) {

            showList.innerHTML = `

                <div class="admin-loading">

                    <span>
                        No shows found.
                    </span>

                </div>

            `;

            return;

        }


        showList.innerHTML =
            filteredShows
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

    function createShowCard(show) {

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


        const status =
            show.status ||
            "pending";


        const statusLabel =
            status.toUpperCase();


        return `

            <article
                class="admin-show-card"
                data-show-id="${id}"
            >

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
                                show-status-${status}
                            "
                        >
                            ${statusLabel}
                        </span>

                    </div>

                </div>


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
                                ? " · " + city
                                : ""
                        }
                    </span>

                </div>


                <div
                    class="admin-show-actions"
                >

                    ${
                        status === "pending"
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
                            `
                            : ""
                    }


                    ${
                        status === "approved"
                            ? `
                                <button
                                    class="show-action"
                                    data-action="hide"
                                    data-id="${id}"
                                    title="Hide"
                                >
                                    <i
                                        class="
                                            fa-solid
                                            fa-eye-slash
                                        "
                                    ></i>
                                </button>
                            `
                            : ""
                    }


                    ${
                        status === "hidden"
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
                                            fa-eye
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
       FORMAT DATE
    ======================================== */

    function formatDate(dateString) {

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
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                }
            )
            .toUpperCase();

    }


    /* ========================================
       OPEN ADD MODAL
    ======================================== */

    function openAddModal() {

        modalTitle.textContent =
            "ADD SHOW";


        showForm.reset();


        showId.value = "";


        showStatus.value =
            "pending";


        formMessage.textContent =
            "";


        showModal.classList.add(
            "show"
        );


        document.body.style.overflow =
            "hidden";

    }


    /* ========================================
       OPEN EDIT MODAL
    ======================================== */

    function openEditModal(id) {

        const show =
            shows.find(
                item =>
                    String(item.id) ===
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
            show.status || "pending";


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

        showModal.classList.remove(
            "show"
        );


        document.body.style.overflow =
            "";

    }


    /* ========================================
       SAVE SHOW
    ======================================== */

    async function saveShow(event) {

        event.preventDefault();


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
                showTime.value,

            venue:
                showVenue.value.trim(),

            city:
                showCity.value.trim(),

            description:
                showDescription.value.trim(),

            status:
                showStatus.value,

            image_url:
                showImage.value.trim()

        };


        try {

            if (id) {

                /*
                 * EDIT
                 */

                await apiRequest(
                    `/api/shows/${id}`,
                    {
                        method: "PUT",

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );

            } else {

                /*
                 * CREATE
                 */

                await apiRequest(
                    "/api/shows",
                    {
                        method: "POST",

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


            setTimeout(() => {

                closeModal();

            }, 500);


        } catch (error) {

            console.error(
                "SAVE SHOW ERROR:",
                error
            );


            formMessage.textContent =
                error.message;

        }

    }


    /* ========================================
       APPROVE SHOW
    ======================================== */

    async function approveShow(id) {

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
                    method: "PATCH"
                }
            );


            await loadShows();

        } catch (error) {

            console.error(
                "APPROVE ERROR:",
                error
            );


            alert(
                error.message
            );

        }

    }


    /* ========================================
       HIDE SHOW
    ======================================== */

    async function hideShow(id) {

        if (
            !confirm(
                "Hide this show from the public website?"
            )
        ) {

            return;

        }


        try {

            await apiRequest(
                `/api/shows/${id}/hide`,
                {
                    method: "PATCH"
                }
            );


            await loadShows();

        } catch (error) {

            console.error(
                "HIDE ERROR:",
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

    async function deleteShow(id) {

        const show =
            shows.find(
                item =>
                    String(item.id) ===
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
                    method: "DELETE"
                }
            );


            await loadShows();

        } catch (error) {

            console.error(
                "DELETE ERROR:",
                error
            );


            alert(
                error.message
            );

        }

    }


    /* ========================================
       SHOW ACTION HANDLER
    ======================================== */

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

                openEditModal(id);

            }


            else if (
                action === "approve"
            ) {

                approveShow(id);

            }


            else if (
                action === "hide"
            ) {

                hideShow(id);

            }


            else if (
                action === "delete"
            ) {

                deleteShow(id);

            }

        }
    );


    /* ========================================
       FILTERS
    ======================================== */

    document
        .querySelectorAll(
            ".filter-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".filter-button"
                        )
                        .forEach(
                            item =>
                                item.classList
                                    .remove(
                                        "active"
                                    )
                        );


                    button.classList.add(
                        "active"
                    );


                    currentFilter =
                        button.dataset.status;


                    renderShows();

                }
            );

        });


    /* ========================================
       ADD SHOW
    ======================================== */

    addShowButton.addEventListener(
        "click",
        openAddModal
    );


    /* ========================================
       CLOSE MODAL
    ======================================== */

    modalClose.addEventListener(
        "click",
        closeModal
    );


    cancelShow.addEventListener(
        "click",
        closeModal
    );


    /*
     * Click outside modal.
     */

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


    /*
     * ESC key.
     */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                showModal.classList
                    .contains("show")
            ) {

                closeModal();

            }

        }
    );


    /* ========================================
       FORM SUBMIT
    ======================================== */

    showForm.addEventListener(
        "submit",
        saveShow
    );


    /* ========================================
    LOGOUT
    ======================================== */

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


    /* ========================================
       ESCAPE HTML
    ======================================== */

    function escapeHtml(value) {

        return String(value ?? "")
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
       INITIAL LOAD
    ======================================== */

    loadShows();

});