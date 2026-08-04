from fastapi import FastAPI

app = FastAPI(
    title="Volunteer Disaster Relief Coordination System",
    version="1.0.0"
)

@app.get("/")
def home():
    return {
        "message": "Volunteer Disaster Relief Coordination System API is running successfully!"
    }