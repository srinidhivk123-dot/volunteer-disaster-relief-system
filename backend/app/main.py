import logging
import os

from dotenv import load_dotenv
from app.core.logging_config import setup_logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine
from app import models

from app.api.auth import router as auth_router
from app.api.relief_requests import router as relief_request_router
from app.api.assignments import router as assignment_router
from app.api.volunteers import router as volunteer_router
from app.api.disasters import router as disaster_router


load_dotenv()

Base.metadata.create_all(bind=engine)


app=FastAPI()
setup_logging()

logger=logging.getLogger(__name__)
logger.info("Application started")


def seed_default_roles():
    try:
        from app.core.database import SessionLocal
        from app.core.security import hash_password
        from app.models.user import User
        from app.models.volunteer import Volunteer
        with SessionLocal() as db:
            admin = db.query(User).filter(User.email == "admin@example.com").first()
            if admin:
                if admin.role != "admin":
                    admin.role = "admin"
                    db.commit()
            else:
                new_admin = User(
                    name="System Administrator",
                    email="admin@example.com",
                    password_hash=hash_password("TestPassword@123"),
                    role="admin"
                )
                db.add(new_admin)
                db.commit()

            vol = db.query(User).filter(User.email == "volunteer@example.com").first()
            if vol:
                if vol.role != "volunteer":
                    vol.role = "volunteer"
                    db.commit()
            else:
                new_vol_user = User(
                    name="Field Relief Volunteer",
                    email="volunteer@example.com",
                    password_hash=hash_password("TestPassword@123"),
                    role="volunteer"
                )
                db.add(new_vol_user)
                db.commit()
                db.refresh(new_vol_user)
                vol = new_vol_user

            vol_profile = db.query(Volunteer).filter(Volunteer.user_id == vol.id).first()
            if not vol_profile:
                db.add(Volunteer(
                    user_id=vol.id,
                    skills="Emergency Medical & Rescue",
                    availability="Available",
                    latitude=11.2588,
                    longitude=75.7804
                ))
                db.commit()
    except Exception as e:
        logger.warning("Seed roles notice: %s", e)


def ensure_schema_compatibility():
    try:
        from sqlalchemy import inspect as sa_inspect, text
        inspector = sa_inspect(engine)
        tables = inspector.get_table_names()
        if "relief_requests" in tables:
            cols = [c["name"].lower() for c in inspector.get_columns("relief_requests")]
            with engine.connect() as conn:
                if "latitude" not in cols:
                    conn.execute(text("ALTER TABLE relief_requests ADD COLUMN latitude FLOAT NULL"))
                    conn.commit()
                if "longitude" not in cols:
                    conn.execute(text("ALTER TABLE relief_requests ADD COLUMN longitude FLOAT NULL"))
                    conn.commit()
                if "phone" not in cols:
                    conn.execute(text("ALTER TABLE relief_requests ADD COLUMN phone VARCHAR(15) NULL"))
                    conn.commit()
                if "request_source" not in cols:
                    conn.execute(text("ALTER TABLE relief_requests ADD COLUMN request_source VARCHAR(30) NOT NULL DEFAULT 'victim'"))
                    conn.commit()
    except Exception as e:
        logger.warning("Schema compatibility notice: %s", e)


def seed_default_disaster():
    try:
        from app.core.database import SessionLocal
        from app.models.disaster import Disaster
        with SessionLocal() as db:
            active = db.query(Disaster).filter(Disaster.status == "active").first()
            if not active:
                existing = db.query(Disaster).first()
                if existing:
                    existing.status = "active"
                    db.commit()
                else:
                    initial = Disaster(
                        name="Monsoon Flood Relief Operation 2026",
                        disaster_type="Flood",
                        description="Active regional flood emergency relief and volunteer dispatch operation.",
                        location="Trichy Central District",
                        status="active"
                    )
                    db.add(initial)
                    db.commit()
    except Exception as e:
        logger.warning("Seed disaster notice: %s", e)


ensure_schema_compatibility()
seed_default_roles()
seed_default_disaster()


cors_origins=[o.strip().rstrip("/") for o in os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
).split(",") if o.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(relief_request_router)
app.include_router(assignment_router)
app.include_router(volunteer_router)
app.include_router(disaster_router)


@app.get("/")
def root():
    return {
        "message":"Volunteer Disaster Relief System API"
    }


@app.get("/health")
def health():
    return {"status":"OK"}