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