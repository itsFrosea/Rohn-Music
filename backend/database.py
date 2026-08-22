import os

import bcrypt
import psycopg

from dotenv import load_dotenv
from psycopg.rows import dict_row


# ========================================
# ENVIRONMENT
# ========================================

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


# ========================================
# DATABASE CONNECTION
# ========================================

def get_connection():

    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL is missing"
        )

    return psycopg.connect(
        DATABASE_URL,
        sslmode="require",
        row_factory=dict_row
    )


# ========================================
# TEST CONNECTION
# ========================================

def test_connection():

    with get_connection() as connection:

        with connection.cursor() as cursor:

            cursor.execute("SELECT 1")

            result = cursor.fetchone()

    return (1,)


# ========================================
# INITIALIZE DATABASE
# ========================================

def init_database():

    with get_connection() as connection:

        with connection.cursor() as cursor:

            # ========================================
            # USERS
            # ========================================

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (

                    id BIGSERIAL PRIMARY KEY,

                    name VARCHAR(100) NOT NULL,

                    email VARCHAR(255) UNIQUE NOT NULL,

                    password_hash TEXT NOT NULL,

                    phone VARCHAR(30),

                    created_at
                    TIMESTAMPTZ
                    DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # ========================================
            # ADMINS
            # ========================================

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS admins (

                    id BIGSERIAL PRIMARY KEY,

                    email VARCHAR(255) UNIQUE NOT NULL,

                    password_hash TEXT NOT NULL,

                    created_at
                    TIMESTAMPTZ
                    DEFAULT CURRENT_TIMESTAMP
                )
            """)


            # ========================================
            # BOOKINGS
            # ========================================

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS bookings (

                    id BIGSERIAL PRIMARY KEY,

                    user_id BIGINT NOT NULL
                        REFERENCES users(id)
                        ON DELETE CASCADE,

                    event_type VARCHAR(100) NOT NULL,

                    event_date DATE NOT NULL,

                    venue VARCHAR(255),

                    city VARCHAR(100),

                    guest_count INTEGER,

                    message TEXT,

                    status VARCHAR(20)
                        NOT NULL
                        DEFAULT 'pending',

                    created_at
                    TIMESTAMPTZ
                    DEFAULT CURRENT_TIMESTAMP,

                    CONSTRAINT bookings_status_check

                    CHECK (
                        status IN (
                            'pending',
                            'approved',
                            'declined',
                            'cancelled'
                        )
                    )
                )
            """)


            # ========================================
            # AVAILABILITY
            # ========================================

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS availability (

                    id BIGSERIAL PRIMARY KEY,

                    date DATE UNIQUE NOT NULL,

                    status VARCHAR(20)
                        NOT NULL
                        DEFAULT 'available',

                    note TEXT,

                    updated_at
                    TIMESTAMPTZ
                    DEFAULT CURRENT_TIMESTAMP,

                    CONSTRAINT availability_status_check

                    CHECK (
                        status IN (
                            'available',
                            'unavailable',
                            'booked'
                        )
                    )
                )
            """)


            # ========================================
            # SHOWS
            # ========================================

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS shows (

                    id BIGSERIAL PRIMARY KEY,

                    title VARCHAR(255) NOT NULL,

                    date DATE NOT NULL,

                    start_time TIME,

                    end_time TIME,

                    venue VARCHAR(255),

                    city VARCHAR(100),

                    description TEXT,

                    image_url TEXT,

                    status VARCHAR(20)
                        NOT NULL
                        DEFAULT 'upcoming',

                    created_at
                    TIMESTAMPTZ
                    DEFAULT CURRENT_TIMESTAMP,

                    CONSTRAINT shows_status_check

                    CHECK (
                        status IN (
                            'upcoming',
                            'live',
                            'completed',
                            'cancelled'
                        )
                    )
                )
            """)

            # ========================================
            # SHOW APPROVAL STATUS
            # ========================================

            cursor.execute("""
                ALTER TABLE shows
                ADD COLUMN IF NOT EXISTS approval_status
                VARCHAR(20)
                NOT NULL
                DEFAULT 'pending'
            """)

            cursor.execute("""
                DO $$
                BEGIN

                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint
                        WHERE conname = 'shows_approval_status_check'
                    ) THEN

                        ALTER TABLE shows
                        ADD CONSTRAINT shows_approval_status_check

                        CHECK (
                            approval_status IN (
                                'pending',
                                'approved',
                                'rejected'
                            )
                        );

                    END IF;

                END
                $$;
            """)

        connection.commit()


# ========================================
# PASSWORD FUNCTIONS
# ========================================

def create_password_hash(password: str):

    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(
    plain_password: str,
    password_hash: str
):

    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        password_hash.encode("utf-8")
    )


# ========================================
# CREATE USER
# ========================================

def create_user(
    name: str,
    email: str,
    password: str,
    phone: str | None = None
):

    password_hash = create_password_hash(
        password
    )

    with get_connection() as connection:

        with connection.cursor() as cursor:

            cursor.execute("""
                INSERT INTO users (
                    name,
                    email,
                    password_hash,
                    phone
                )

                VALUES (
                    %s,
                    %s,
                    %s,
                    %s
                )

                RETURNING
                    id,
                    name,
                    email,
                    phone,
                    created_at
            """, (
                name,
                email.lower().strip(),
                password_hash,
                phone
            ))

            user = cursor.fetchone()

        connection.commit()

    return user


# ========================================
# GET USER BY EMAIL
# ========================================

def get_user_by_email(email: str):

    with get_connection() as connection:

        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT *
                FROM users
                WHERE email = %s
            """, (
                email.lower().strip(),
            ))

            return cursor.fetchone()


# ========================================
# GET USER BY ID
# ========================================

def get_user_by_id(user_id: int):

    with get_connection() as connection:

        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    id,
                    name,
                    email,
                    phone,
                    created_at
                FROM users
                WHERE id = %s
            """, (
                user_id,
            ))

            return cursor.fetchone()


# ========================================
# CREATE BOOKING
# ========================================

def create_booking(
    user_id: int,
    event_type: str,
    event_date: str,
    venue: str | None = None,
    city: str | None = None,
    guest_count: int | None = None,
    message: str | None = None
):

    with get_connection() as connection:

        with connection.cursor() as cursor:

            # ========================================
            # CHECK APPROVED BOOKINGS
            # ========================================

            cursor.execute("""
                SELECT id

                FROM bookings

                WHERE event_date = %s

                AND status = 'approved'

                LIMIT 1
            """, (
                event_date,
            ))

            if cursor.fetchone():

                raise ValueError(
                    "This date is already booked."
                )


            # ========================================
            # CHECK AVAILABILITY
            # ========================================

            cursor.execute("""
                SELECT status

                FROM availability

                WHERE date = %s
            """, (
                event_date,
            ))

            availability = cursor.fetchone()

            if (
                availability
                and availability["status"] != "available"
            ):

                raise ValueError(
                    "Rohn Music is not available on this date."
                )


            # ========================================
            # CREATE BOOKING
            # ========================================

            cursor.execute("""
                INSERT INTO bookings (

                    user_id,

                    event_type,

                    event_date,

                    venue,

                    city,

                    guest_count,

                    message

                )

                VALUES (

                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s

                )

                RETURNING
                    id,
                    user_id,
                    event_type,
                    event_date,
                    venue,
                    city,
                    guest_count,
                    message,
                    status,
                    created_at
            """, (
                user_id,
                event_type,
                event_date,
                venue,
                city,
                guest_count,
                message
            ))

            booking = cursor.fetchone()

        connection.commit()

    return booking


# ========================================
# GET USER BOOKINGS
# ========================================

def get_user_bookings(user_id: int):

    with get_connection() as connection:

        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT

                    id,

                    event_type,

                    event_date,

                    venue,

                    city,

                    guest_count,

                    message,

                    status,

                    created_at

                FROM bookings

                WHERE user_id = %s

                ORDER BY event_date ASC
            """, (
                user_id,
            ))

            return cursor.fetchall()

def update_booking(
    booking_id: int,
    user_id: int,
    event_type: str,
    event_date: str,
    venue: str | None = None,
    city: str | None = None,
    guest_count: int | None = None,
    message: str | None = None
):

    with get_connection() as connection:

        with connection.cursor() as cursor:

            # Only allow editing the user's own
            # pending booking.

            cursor.execute("""
                SELECT status
                FROM bookings
                WHERE id = %s
                AND user_id = %s
            """, (
                booking_id,
                user_id
            ))

            booking = cursor.fetchone()

            if not booking:

                raise ValueError(
                    "Booking not found."
                )

            if booking["status"] != "pending":

                raise ValueError(
                    "Only pending bookings can be edited."
                )


            # Check whether the new date is already
            # occupied by an approved booking.

            cursor.execute("""
                SELECT id
                FROM bookings
                WHERE event_date = %s
                AND status = 'approved'
                AND id != %s
                LIMIT 1
            """, (
                event_date,
                booking_id
            ))

            if cursor.fetchone():

                raise ValueError(
                    "This date is already booked."
                )


            # Update booking.

            cursor.execute("""
                UPDATE bookings

                SET
                    event_type = %s,
                    event_date = %s,
                    venue = %s,
                    city = %s,
                    guest_count = %s,
                    message = %s

                WHERE id = %s
                AND user_id = %s
                AND status = 'pending'

                RETURNING
                    id,
                    event_type,
                    event_date,
                    venue,
                    city,
                    guest_count,
                    message,
                    status,
                    created_at
            """, (
                event_type,
                event_date,
                venue,
                city,
                guest_count,
                message,
                booking_id,
                user_id
            ))

            updated = cursor.fetchone()

        connection.commit()

    return updated

# ========================================
# GET ALL BOOKINGS - ADMIN
# ========================================

def get_all_bookings():

    with get_connection() as connection:

        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT

                    b.id,

                    b.user_id,

                    u.name AS user_name,

                    u.email AS user_email,

                    u.phone AS user_phone,

                    b.event_type,

                    b.event_date,

                    b.venue,

                    b.city,

                    b.guest_count,

                    b.message,

                    b.status,

                    b.created_at

                FROM bookings b

                INNER JOIN users u
                    ON u.id = b.user_id

                ORDER BY
                    b.created_at DESC
            """)

            return cursor.fetchall()

# ========================================
# SHOWS
# ========================================

def create_show(
    title: str,
    date: str,
    start_time: str | None = None,
    end_time: str | None = None,
    venue: str | None = None,
    city: str | None = None,
    description: str | None = None,
    image_url: str | None = None,
    status: str = "upcoming"
):

    with get_connection() as connection:

        with connection.cursor() as cursor:

            cursor.execute("""
                INSERT INTO shows (

                    title,
                    date,
                    start_time,
                    end_time,
                    venue,
                    city,
                    description,
                    image_url,
                    status

                )

                VALUES (

                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s

                )

                RETURNING
                    id,
                    title,
                    date,
                    start_time,
                    end_time,
                    venue,
                    city,
                    description,
                    image_url,
                    status,
                    approval_status,
                    created_at

            """, (
                title,
                date,
                start_time,
                end_time,
                venue,
                city,
                description,
                image_url,
                status
            ))

            show = cursor.fetchone()

        connection.commit()

    return show


# ========================================
# GET ALL SHOWS
# ========================================

def get_all_shows():

    with get_connection() as connection:

        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    id,
                    title,
                    date,
                    start_time,
                    end_time,
                    venue,
                    city,
                    description,
                    image_url,
                    status,
                    approval_status,
                    created_at

                FROM shows

                ORDER BY date ASC, start_time ASC
            """)

            return cursor.fetchall()


# ========================================
# GET APPROVED SHOWS
# ========================================

def get_approved_shows():

    with get_connection() as connection:

        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    id,
                    title,
                    date,
                    start_time,
                    end_time,
                    venue,
                    city,
                    description,
                    image_url,
                    status,
                    approval_status,
                    created_at

                FROM shows

                WHERE approval_status = 'approved'

                ORDER BY date ASC, start_time ASC
            """)

            return cursor.fetchall()


# ========================================
# GET SHOW BY ID
# ========================================

def get_show_by_id(show_id: int):

    with get_connection() as connection:

        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    id,
                    title,
                    date,
                    start_time,
                    end_time,
                    venue,
                    city,
                    description,
                    image_url,
                    status,
                    approval_status,
                    created_at

                FROM shows

                WHERE id = %s
            """, (
                show_id,
            ))

            return cursor.fetchone()


# ========================================
# UPDATE SHOW
# ========================================

def update_show(
    show_id: int,
    title: str,
    date: str,
    start_time: str | None = None,
    end_time: str | None = None,
    venue: str | None = None,
    city: str | None = None,
    description: str | None = None,
    image_url: str | None = None,
    status: str = "upcoming"
):

    with get_connection() as connection:

        with connection.cursor() as cursor:

            cursor.execute("""
                UPDATE shows

                SET

                    title = %s,
                    date = %s,
                    start_time = %s,
                    end_time = %s,
                    venue = %s,
                    city = %s,
                    description = %s,
                    image_url = %s,
                    status = %s

                WHERE id = %s

                RETURNING
                    id,
                    title,
                    date,
                    start_time,
                    end_time,
                    venue,
                    city,
                    description,
                    image_url,
                    status,
                    approval_status,
                    created_at

            """, (
                title,
                date,
                start_time,
                end_time,
                venue,
                city,
                description,
                image_url,
                status,
                show_id
            ))

            show = cursor.fetchone()

        connection.commit()

    return show


# ========================================
# DELETE SHOW
# ========================================

def delete_show(show_id: int):

    with get_connection() as connection:

        with connection.cursor() as cursor:

            cursor.execute("""
                DELETE FROM shows

                WHERE id = %s

                RETURNING id
            """, (
                show_id,
            ))

            deleted = cursor.fetchone()

        connection.commit()

    return deleted


# ========================================
# APPROVE SHOW
# ========================================

def approve_show(show_id: int):

    with get_connection() as connection:

        with connection.cursor() as cursor:

            cursor.execute("""
                UPDATE shows

                SET approval_status = 'approved'

                WHERE id = %s

                RETURNING
                    id,
                    title,
                    date,
                    start_time,
                    end_time,
                    venue,
                    city,
                    description,
                    image_url,
                    status,
                    approval_status,
                    created_at

            """, (
                show_id,
            ))

            show = cursor.fetchone()

        connection.commit()

    return show


# ========================================
# REJECT SHOW
# ========================================

def reject_show(show_id: int):

    with get_connection() as connection:

        with connection.cursor() as cursor:

            cursor.execute("""
                UPDATE shows

                SET approval_status = 'rejected'

                WHERE id = %s

                RETURNING
                    id,
                    title,
                    date,
                    start_time,
                    end_time,
                    venue,
                    city,
                    description,
                    image_url,
                    status,
                    approval_status,
                    created_at

            """, (
                show_id,
            ))

            show = cursor.fetchone()

        connection.commit()

    return show


# ========================================
# ADMIN AUTHENTICATION
# ========================================

def create_admin(
    email: str,
    password: str
):

    password_hash = create_password_hash(
        password
    )

    with get_connection() as connection:

        with connection.cursor() as cursor:

            cursor.execute("""
                INSERT INTO admins (
                    email,
                    password_hash
                )

                VALUES (
                    %s,
                    %s
                )

                RETURNING
                    id,
                    email,
                    created_at
            """, (
                email.lower().strip(),
                password_hash
            ))

            admin = cursor.fetchone()

        connection.commit()

    return admin


def get_admin_by_email(
    email: str
):

    with get_connection() as connection:

        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    id,
                    email,
                    password_hash,
                    created_at

                FROM admins

                WHERE email = %s
            """, (
                email.lower().strip(),
            ))

            return cursor.fetchone()