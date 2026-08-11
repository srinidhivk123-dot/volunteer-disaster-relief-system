from fastapi import FastAPI

from app.core.database import Base, engine
from app import models
from app.api.auth import router as auth_router

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth_router)


@app.get("/")
def root():
    return {"message": "Volunteer Disaster Relief System API"}