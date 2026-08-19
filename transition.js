/* ========================================
   ROHN MUSIC
   SINGLE PAGE NAVIGATION
   SMOOTH PAGE TRANSITIONS
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    const container =
        document.getElementById("page-container");


    /*
     * Make sure the persistent page
     * container exists.
     */

    if (!container) {
        return;
    }


    /* ========================================
       PAGE ORDER
    ======================================== */

    const pageOrder = [
        "index.html",
        "about.html",
        "shows.html",
        "booking.html"
    ];

    


    /* ========================================
       TRANSITION SETTINGS
    ======================================== */

    const TRANSITION_TIME = 500;


    /* ========================================
       GET PAGE NAME
    ======================================== */

    function getPageName(url) {

        const parsed =
            new URL(
                url,
                window.location.href
            );

        return (
            parsed.pathname
                .split("/")
                .pop()
            || "index.html"
        );
    }

    /* ========================================
    UPDATE ACTIVE NAVIGATION
    ======================================== */

    function updateActiveNavigation(page) {

        const navigationLinks =
            document.querySelectorAll(
                ".navigation a"
            );


        navigationLinks.forEach(link => {

            const href =
                link.getAttribute("href");


            if (!href) {
                return;
            }


            const linkPage =
                getPageName(href);


            link.classList.toggle(
                "active",
                linkPage === page
            );

        });

}


updateActiveNavigation(
        getPageName(
            window.location.href
        )
    );

    /* ========================================
       GET DIRECTION
    ======================================== */

    function getDirection(
        currentPage,
        nextPage
    ) {

        const currentIndex =
            pageOrder.indexOf(
                currentPage
            );


        const nextIndex =
            pageOrder.indexOf(
                nextPage
            );


        /*
         * Moving forward through
         * the navigation:
         *
         * Home → About → Shows → Booking
         *
         * Current page leaves LEFT.
         */

        if (
            nextIndex > currentIndex
        ) {

            return "left";

        }


        /*
         * Moving backward:
         *
         * Booking → Shows → About → Home
         *
         * Current page leaves RIGHT.
         */

        return "right";
    }


    /* ========================================
       WAIT
    ======================================== */

    function wait(milliseconds) {

        return new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    milliseconds
                )
        );

    }


    /* ========================================
       FETCH PAGE
    ======================================== */

    async function fetchPage(url) {

        const response =
            await fetch(url, {
                cache: "no-cache"
            });


        if (!response.ok) {

            throw new Error(
                `Unable to load ${url}`
            );

        }


        return await response.text();

    }


    /* ========================================
       EXTRACT MAIN CONTENT
    ======================================== */

    function extractMain(html) {

        const parser =
            new DOMParser();


        const page =
            parser.parseFromString(
                html,
                "text/html"
            );


        const main =
            page.querySelector(
                "main"
            );


        if (!main) {

            throw new Error(
                "The requested page does not contain a <main> element."
            );

        }


        return {
            html: main.innerHTML,
            className: main.className
        };

    }


    /* ========================================
       LOAD PAGE
    ======================================== */

    async function loadPage(
        url,
        pushHistory = true
    ) {

        const currentPage =
            getPageName(
                window.location.href
            );


        const nextPage =
            getPageName(url);


        /*
         * Don't transition to the
         * page we're already on.
         */

        if (
            currentPage === nextPage
        ) {
            return;
        }


        const direction =
            getDirection(
                currentPage,
                nextPage
            );


        /* ====================================
           START EXIT ANIMATION
        ==================================== */

        container.classList.remove(
            "page-enter-left",
            "page-enter-right",
            "page-enter-active",
            "page-leave-left",
            "page-leave-right"
        );


        /*
         * Force the browser to recognize
         * the clean starting state.
         */

        void container.offsetWidth;


        container.classList.add(
            direction === "left"
                ? "page-leave-left"
                : "page-leave-right"
        );


        /* ====================================
           FETCH NEXT PAGE IMMEDIATELY
           
           IMPORTANT:
           This happens while the current
           page is still animating out.
        ==================================== */

        let html;


        try {

            html =
                await fetchPage(url);

        } catch (error) {

            console.error(
                "PAGE LOAD ERROR:",
                error
            );


            /*
             * Restore current page if
             * fetching failed.
             */

            container.classList.remove(
                "page-leave-left",
                "page-leave-right"
            );


            return;
        }


        /* ====================================
           WAIT ONLY IF NECESSARY
           
           If the network request took longer
           than the animation, this keeps the
           old page transition timing clean.
        ==================================== */

        await wait(
            Math.max(
                0,
                TRANSITION_TIME - 50
            )
        );


        /* ====================================
           EXTRACT NEW PAGE
        ==================================== */

        let newPage;


        try {

            newPage =
                extractMain(html);

        } catch (error) {

            console.error(
                "PAGE CONTENT ERROR:",
                error
            );


            container.classList.remove(
                "page-leave-left",
                "page-leave-right"
            );


            return;
        }


        /* ====================================
           REPLACE CONTENT
        ==================================== */

        container.innerHTML =
            newPage.html;


        /*
         * Keep the persistent container ID.
         *
         * Apply the class belonging to
         * the new page.
         */

        container.id =
            "page-container";


        container.className =
            newPage.className || "";


        /*
         * The transition classes must be
         * added again after className changes.
         */


        /* ====================================
           UPDATE URL
        ==================================== */

        if (pushHistory) {

            history.pushState(
                {
                    page: nextPage
                },
                "",
                url
            );

        }
        updateActiveNavigation(
            nextPage
        );


        /* ====================================
           POSITION NEW PAGE
        ==================================== */

        /*
         * Old page leaves LEFT
         * → new page enters RIGHT
         *
         * Old page leaves RIGHT
         * → new page enters LEFT
         */

        const enterClass =
            direction === "left"
                ? "page-enter-right"
                : "page-enter-left";


        container.classList.add(
            enterClass
        );


        /*
         * Force initial position.
         */

        void container.offsetWidth;


        /* ====================================
           ENTER NEW PAGE
        ==================================== */

        requestAnimationFrame(() => {

            container.classList.add(
                "page-enter-active"
            );

        });


        /* ====================================
           CLEANUP
        ==================================== */

        setTimeout(() => {

            container.classList.remove(
                "page-enter-left",
                "page-enter-right",
                "page-enter-active",
                "page-leave-left",
                "page-leave-right"
            );

        }, TRANSITION_TIME + 100);


        /* ====================================
           REINITIALIZE PAGE SCRIPTS
        ==================================== */

        initializePage();

    }


    /* ========================================
       CLICK HANDLER
    ======================================== */

    document.addEventListener(
        "click",
        event => {

            const link =
                event.target.closest(
                    "a"
                );


            if (!link) {
                return;
            }


            /*
             * Ignore modified clicks.
             */

            if (
                event.ctrlKey ||
                event.metaKey ||
                event.shiftKey ||
                event.altKey
            ) {
                return;
            }


            const href =
                link.getAttribute(
                    "href"
                );


            if (!href) {
                return;
            }


            /*
             * Ignore anchors.
             */

            if (
                href.startsWith("#")
            ) {
                return;
            }


            /*
             * Ignore external links.
             */

            if (
                href.startsWith(
                    "http://"
                ) ||
                href.startsWith(
                    "https://"
                ) ||
                href.startsWith(
                    "mailto:"
                ) ||
                href.startsWith(
                    "tel:"
                )
            ) {
                return;
            }


            const target =
                new URL(
                    href,
                    window.location.href
                );


            const targetPage =
                getPageName(
                    target.href
                );


            /*
             * Only handle our website
             * pages.
             */

            if (
                !pageOrder.includes(
                    targetPage
                )
            ) {
                return;
            }


            event.preventDefault();


            loadPage(
                target.href
            );

        }
    );


    /* ========================================
       BACK / FORWARD
    ======================================== */

    window.addEventListener(
        "popstate",
        () => {

            loadPage(
                window.location.href,
                false
            );

        }
    );


    /* ========================================
       PAGE-SPECIFIC INITIALIZATION
    ======================================== */

    function initializePage() {

        /*
         * BOOKING FORM
         *
         * Your booking.js can expose:
         *
         * window.initializeBooking
         *
         * when we need it.
         */

        const bookingForm =
            document.getElementById(
                "bookingForm"
            );


        if (
            bookingForm &&
            typeof window.initializeBooking ===
                "function"
        ) {

            window.initializeBooking();

        }


        /*
         * ACCOUNT MENU
         *
         * If account.js exposes an
         * initialization function, run it.
         */

        if (
            typeof window.initializeAccount ===
                "function"
        ) {

            window.initializeAccount();

        }

    }


});