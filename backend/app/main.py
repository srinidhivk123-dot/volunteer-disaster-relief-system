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


cors_origins=os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
).split(",")


app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
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