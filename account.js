const API_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", async () => {

    const token = localStorage.getItem("access_token");

    if (!token) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/api/me`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {

            // Token is invalid/expired
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");

            return;
        }

        const user = await response.json();

        showLoggedInAccount(user);

    } catch (error) {

        console.error(
            "Unable to check login:",
            error
        );

    }

});


function showLoggedInAccount(user) {

    const accountLinks =
        document.querySelector(".account-links");

    if (!accountLinks) {
        return;
    }


    accountLinks.innerHTML = `

        <div class="account-menu">

            <button
                class="account-button"
                id="accountButton"
                aria-label="Account"
            >
                <i class="fa-solid fa-user"></i>
            </button>


            <div
                class="account-dropdown"
                id="accountDropdown"
            >

                <div class="account-name">
                    ${escapeHtml(user.name)}
                </div>

                <div class="account-divider"></div>

                <a href="my-bookings.html">
                    My Bookings
                </a>

                <a href="#">
                    Profile
                </a>

                <button id="logoutButton">
                    Logout
                </button>

            </div>

        </div>

    `;


    const accountButton =
        document.getElementById("accountButton");

    const accountDropdown =
        document.getElementById("accountDropdown");


    accountButton.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            accountDropdown.classList.toggle(
                "show"
            );

        }
    );


    document.addEventListener(
        "click",
        () => {

            accountDropdown.classList.remove(
                "show"
            );

        }
    );


    document
        .getElementById("logoutButton")
        .addEventListener(
            "click",
            logout
        );
}


function logout() {

    localStorage.removeItem(
        "access_token"
    );

    localStorage.removeItem(
        "user"
    );

    window.location.reload();
}


function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent = value;

    return div.innerHTML;
}