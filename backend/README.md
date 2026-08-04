# Backend

This directory contains the FastAPI backend for the Volunteer Disaster Relief Coordination System.

## Tech Stack

- Python 3
- FastAPI
- Uvicorn

## Run the Backend

1. Create and activate a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Start the server:

```bash
uvicorn app.main:app --reload
```

4. Open the API documentation:

http://127.0.0.1:8000/docs