import os

from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from jose import jwt

from pydantic import BaseModel, EmailStr

from database import (
    test_connection,
    init_database,
    create_booking,
    create_user,
    get_user_by_email,
    get_user_by_id,
    get_user_bookings,
    verify_password,

    create_show,
    get_all_shows,
    get_approved_shows,
    get_show_by_id,
    update_show,
    delete_show,
    approve_show,
    reject_show,

    create_admin,
    get_admin_by_email
)


# ========================================
# APP
# ========================================

app = FastAPI(
    title="Rohn Music API",
    description="Booking and event management API for Rohn Music",
    version="1.0.0"
)


# ========================================
# JWT CONFIGURATION
# ========================================

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

JWT_ALGORITHM = "HS256"

JWT_EXPIRE_MINUTES = 60 * 24 * 7

security = HTTPBearer()


# ========================================
# DATABASE INITIALIZATION
# ========================================

init_database()


# ========================================
# AUTHENTICATION
# ========================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    if not JWT_SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="JWT secret is not configured."
        )

    try:

        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM]
        )

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token."
            )

        return int(user_id)

    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token."
        )

# ========================================
# ADMIN AUTHENTICATION
# ========================================

async def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    )
):

    token = credentials.credentials

    if not JWT_SECRET_KEY:

        raise HTTPException(
            status_code=500,
            detail="JWT secret is not configured."
        )

    try:

        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM]
        )

        admin_id = payload.get("admin_id")

        token_type = payload.get(
            "type"
        )

        if not admin_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid admin token."
            )

        if token_type != "admin":
            raise HTTPException(
                status_code=403,
                detail="Admin access required."
            )

        return int(admin_id)

    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired admin token."
        )

# ========================================
# REQUEST MODELS
# ========================================

class RegisterRequest(BaseModel):

    name: str

    email: EmailStr

    password: str

    phone: str | None = None


class LoginRequest(BaseModel):

    email: EmailStr

    password: str

class AdminLoginRequest(BaseModel):

    email: EmailStr

    password: str


class BookingRequest(BaseModel):

    event_type: str

    event_date: str

    venue: str | None = None

    city: str | None = None

    guest_count: int | None = None

    message: str | None = None

class ShowRequest(BaseModel):

    title: str

    date: str

    start_time: str | None = None

    end_time: str | None = None

    venue: str | None = None

    city: str | None = None

    description: str | None = None

    image_url: str | None = None

    status: str = "upcoming"

# ========================================
# BASIC
# ========================================

@app.get("/")
async def root():

    return {
        "status": "online",
        "message": "Rohn Music API is running"
    }


@app.get("/api/health")
async def health():

    return {
        "status": "healthy"
    }


# ========================================
# DATABASE TEST
# ========================================

@app.get("/api/test-db")
async def test_db():

    try:

        result = test_connection()

        return {
            "database": "connected",
            "test": result[0]
        }

    except Exception as e:

        return {
            "database": "connection failed",
            "error": str(e)
        }


# ========================================
# REGISTER
# ========================================

@app.post("/api/auth/register")
async def register(data: RegisterRequest):

    existing_user = get_user_by_email(
        data.email
    )

    if existing_user:

        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists."
        )

    if len(data.password) < 8:

        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters."
        )

    try:

        user = create_user(
            name=data.name,
            email=data.email,
            password=data.password,
            phone=data.phone
        )

        return {
            "success": True,
            "message": "Account created successfully.",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "phone": user["phone"]
            }
        }

    except Exception as e:

        print("REGISTER ERROR:", e)

        raise HTTPException(
            status_code=500,
            detail="Unable to create account."
        )


# ========================================
# LOGIN
# ========================================

@app.post("/api/auth/login")
async def login(data: LoginRequest):

    user = get_user_by_email(
        data.email
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    if not verify_password(
        data.password,
        user["password_hash"]
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    if not JWT_SECRET_KEY:

        raise HTTPException(
            status_code=500,
            detail="JWT secret is not configured."
        )

    expires = (
        datetime.now(timezone.utc)
        + timedelta(minutes=JWT_EXPIRE_MINUTES)
    )

    token = jwt.encode(
        {
            "sub": str(user["id"]),
            "email": user["email"],
            "exp": expires
        },
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM
    )

    return {

        "success": True,

        "access_token": token,

        "token_type": "bearer",

        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"]
        }
    }

# ========================================
# ADMIN LOGIN
# ========================================

@app.post("/api/auth/admin-login")
async def admin_login(
    data: AdminLoginRequest
):

    admin = get_admin_by_email(
        data.email
    )

    if not admin:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    if not verify_password(
        data.password,
        admin["password_hash"]
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    if not JWT_SECRET_KEY:

        raise HTTPException(
            status_code=500,
            detail="JWT secret is not configured."
        )

    expires = (
        datetime.now(timezone.utc)
        + timedelta(minutes=JWT_EXPIRE_MINUTES)
    )

    token = jwt.encode(
        {
            "admin_id": str(admin["id"]),
            "email": admin["email"],
            "type": "admin",
            "exp": expires
        },
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM
    )

    return {

        "success": True,

        "access_token": token,

        "token_type": "bearer",

        "admin": {
            "id": admin["id"],
            "email": admin["email"]
        }

    }


# ========================================
# CURRENT USER
# ========================================

@app.get("/api/me")
async def get_me(
    user_id: int = Depends(get_current_user)
):

    user = get_user_by_id(
        user_id
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    return {

        "id": user["id"],

        "name": user["name"],

        "email": user["email"],

        "phone": user["phone"]
    }


# ========================================
# CREATE BOOKING
# ========================================

@app.post("/api/bookings")
async def submit_booking(
    data: BookingRequest,

    user_id: int = Depends(
        get_current_user
    )
):

    try:

        booking = create_booking(

            user_id=user_id,

            event_type=data.event_type,

            event_date=data.event_date,

            venue=data.venue,

            city=data.city,

            guest_count=data.guest_count,

            message=data.message
        )

        return {

            "success": True,

            "message": "Booking request submitted.",

            "booking": booking
        }

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:

        print("BOOKING ERROR:", e)

        raise HTTPException(
            status_code=500,
            detail="Unable to create booking."
        )


# ========================================
# MY BOOKINGS
# ========================================

@app.get("/api/my-bookings")
async def my_bookings(
    user_id: int = Depends(
        get_current_user
    )
):

    bookings = get_user_bookings(
        user_id
    )

    return {

        "bookings": bookings
    }


# ========================================
# BOOKINGS
# ========================================

@app.get("/api/bookings")
async def get_bookings(
    user_id: int = Depends(
        get_current_user
    )
):

    bookings = get_user_bookings(
        user_id
    )

    return {

        "bookings": bookings
    }


# ========================================
# AVAILABILITY
# ========================================

@app.get("/api/availability")
async def get_availability():

    return {

        "availability": []
    }


# ========================================
# PUBLIC SHOWS
# ========================================

@app.get("/api/shows")
async def get_shows():

    shows = get_approved_shows()

    return {
        "shows": shows
    }

# ========================================
# ADMIN - ALL SHOWS
# ========================================

@app.get("/api/shows/admin")
async def get_admin_shows(
    admin_id: int = Depends(
        get_current_admin
    )
):

    shows = get_all_shows()

    return {
        "shows": shows
    }

# ========================================
# ADMIN - CREATE SHOW
# ========================================

@app.post("/api/shows")
async def create_new_show(
    data: ShowRequest,

    admin_id: int = Depends(
        get_current_admin
    )
):

    try:

        show = create_show(

            title=data.title,

            date=data.date,

            start_time=data.start_time,

            end_time=data.end_time,

            venue=data.venue,

            city=data.city,

            description=data.description,

            image_url=data.image_url,

            status=data.status
        )

        return {

            "success": True,

            "show": show
        }

    except Exception as e:

        print(
            "CREATE SHOW ERROR:",
            e
        )

        raise HTTPException(

            status_code=500,

            detail="Unable to create show."
        )

# ========================================
# ADMIN - UPDATE SHOW
# ========================================

@app.put("/api/shows/{show_id}")
async def edit_show(
    show_id: int,

    data: ShowRequest,

    admin_id: int = Depends(
        get_current_admin   
    )
):

    existing = get_show_by_id(show_id)

    if not existing:

        raise HTTPException(
            status_code=404,
            detail="Show not found."
        )


    try:

        show = update_show(

            show_id=show_id,

            title=data.title,

            date=data.date,

            start_time=data.start_time,

            end_time=data.end_time,

            venue=data.venue,

            city=data.city,

            description=data.description,

            image_url=data.image_url,

            status=data.status
        )

        return {

            "success": True,

            "show": show
        }

    except Exception as e:

        print(
            "UPDATE SHOW ERROR:",
            e
        )

        raise HTTPException(

            status_code=500,

            detail="Unable to update show."
        )

# ========================================
# ADMIN - APPROVE SHOW
# ========================================

@app.patch("/api/shows/{show_id}/approve")
async def approve_show_route(
    show_id: int,

    admin_id: int = Depends(
        get_current_admin   
    )
):

    existing = get_show_by_id(show_id)

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Show not found."
        )

    show = approve_show(show_id)

    return {
        "success": True,
        "show": show
    }

# ========================================
# ADMIN - REJECT SHOW
# ========================================

@app.patch("/api/shows/{show_id}/reject")
async def reject_show_route(
    show_id: int,

    admin_id: int = Depends(
        get_current_admin   
    )
):

    existing = get_show_by_id(show_id)

    if not existing:

        raise HTTPException(
            status_code=404,
            detail="Show not found."
        )

    show = reject_show(show_id)

    return {
        "success": True,
        "show": show
    }


# ========================================
# ADMIN - DELETE SHOW
# ========================================

@app.delete("/api/shows/{show_id}")
async def remove_show(
    show_id: int,

    admin_id: int = Depends(
        get_current_admin   
    )
):

    deleted = delete_show(show_id)

    if not deleted:

        raise HTTPException(
            status_code=404,
            detail="Show not found."
        )

    return {
        "success": True,
        "message": "Show deleted."
    }