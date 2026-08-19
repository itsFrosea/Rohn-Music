const API_URL = "http://127.0.0.1:8000";


// ========================================
// REGISTER
// ========================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const message =
            document.getElementById("registerMessage");

        const data = {

            name:
                document.getElementById("name").value,

            email:
                document.getElementById("email").value,

            phone:
                document.getElementById("phone").value || null,

            password:
                document.getElementById("password").value

        };


        try {

            const response = await fetch(
                `${API_URL}/api/auth/register`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(data)
                }
            );


            const result = await response.json();


            if (!response.ok) {

                message.textContent =
                    result.detail || "Registration failed.";

                return;
            }


            message.textContent =
                "Account created! Redirecting...";


            setTimeout(() => {

                window.location.href =
                    "login/login.html";

            }, 1000);


        } catch (error) {

            console.error(error);

            message.textContent =
                "Unable to connect to the server.";

        }

    });

}


// ========================================
// LOGIN
// ========================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const message =
            document.getElementById("loginMessage");


        const data = {

            email:
                document.getElementById("email").value,

            password:
                document.getElementById("password").value

        };


        try {

            const response = await fetch(
                `${API_URL}/api/auth/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(data)
                }
            );


            const result = await response.json();


            if (!response.ok) {

                message.textContent =
                    result.detail || "Login failed.";

                return;
            }


            // Save JWT

            localStorage.setItem(
                "access_token",
                result.access_token
            );


            localStorage.setItem(
                "user",
                JSON.stringify(result.user)
            );


            message.textContent =
                "Login successful!";


            setTimeout(() => {

                window.location.href =
                    "../index.html";

            }, 500);


        } catch (error) {

            console.error(error);

            message.textContent =
                "Unable to connect to the server.";

        }

    });

}