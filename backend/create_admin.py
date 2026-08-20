from database import create_admin


# ========================================
# CREATE ADMIN
# ========================================

email = "admin@example.com"
password = "YourPassword123"


try:

    admin = create_admin(
        email=email,
        password=password
    )

    if admin:

        print()
        print("========================================")
        print("ADMIN CREATED SUCCESSFULLY")
        print("========================================")
        print()
        print("Success: True")
        print("ID:", admin["id"])
        print("Email:", admin["email"])
        print()
        print("You can now log in through:")
        print("POST /api/auth/admin-login")
        print("========================================")

    else:

        print()
        print("Success: False")
        print("Admin was not created.")


except Exception as e:

    print()
    print("========================================")
    print("ADMIN CREATION FAILED")
    print("========================================")
    print()
    print("Success: False")
    print("Error:", e)
    print()