document.addEventListener(
    "DOMContentLoaded",
    () => {

        const form =
            document.getElementById(
                "adminLoginForm"
            );


        const message =
            document.getElementById(
                "adminLoginMessage"
            );


        form.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                message.textContent =
                    "Signing in...";


                const email =
                    document
                        .getElementById(
                            "adminEmail"
                        )
                        .value
                        .trim();


                const password =
                    document
                        .getElementById(
                            "adminPassword"
                        )
                        .value;


                try {

                    const response =
                        await fetch(
                            "http://127.0.0.1:8000/api/admin/login",
                            {

                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({
                                        email,
                                        password
                                    })

                            }
                        );


                    const data =
                        await response.json();


                    if (!response.ok) {

                        throw new Error(
                            data.detail ||
                            "Admin login failed."
                        );

                    }


                    localStorage.setItem(
                        "adminToken",
                        data.access_token
                    );


                    localStorage.setItem(
                        "admin",
                        JSON.stringify(
                            data.admin
                        )
                    );


                    window.location.href =
                        "../admin/index.html";

                }

                catch (error) {

                    console.error(
                        "ADMIN LOGIN ERROR:",
                        error
                    );


                    message.textContent =
                        error.message;

                }

            }
        );

    }
);