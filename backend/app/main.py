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


# Robust CORS configuration
cors_env = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,https://volunteer-disaster-relief-system-fr-xi.vercel.app,https://volunteer-disaster-relief-system.vercel.app"
)
cors_origins = [o.strip().rstrip("/") for o in cors_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


import re


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error("Unhandled server exception at %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    from fastapi.responses import JSONResponse
    origin = request.headers.get("origin")
    headers = {}
    if origin and (origin in cors_origins or re.match(r"^https:\/\/.*\.vercel\.app$", origin)):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later or contact the administrator."},
        headers=headers
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