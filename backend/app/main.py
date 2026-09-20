from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine
from app import models
from app.api.auth import router as auth_router
from app.api.relief_requests import router as relief_request_router


Base.metadata.create_all(bind=engine)


app = FastAPI()


# Allow the React frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Authentication routes
app.include_router(auth_router)

# Relief request routes
app.include_router(relief_request_router)


@app.get("/")
def root():
    return {
        "message": "Volunteer Disaster Relief System API"
    }