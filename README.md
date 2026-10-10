# ReliefConnect — Volunteer Disaster Relief Coordination System

ReliefConnect is a production-ready, full-stack disaster response and volunteer dispatch platform. It coordinates immediate emergency assistance by connecting victims, on-the-ground volunteers, and incident commanders in real-time with geographic mapping, GPS capture, proximity-based volunteer dispatch, and role-based workflows.

---

## 1. System Architecture & Tech Stack

- **Frontend**: React 18, Vite, React Router v6, Leaflet / OpenStreetMap (GIS mapping)
- **Backend**: Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy 2.0
- **Database**: MySQL 8.0+ (Hosted on Aiven / Local MySQL)
- **Authentication**: JWT (JSON Web Tokens) with passlib / bcrypt password hashing
- **Deployment**:
  - Frontend: Vercel (`https://volunteer-disaster-relief-system-fr-xi.vercel.app`)
  - Backend: Render (`https://volunteer-disaster-relief-system-awao.onrender.com`)
  - Database: Aiven Cloud MySQL

---

## 2. Roles & Permissions

| Role | Access Level | Description & Available Portals |
|---|---|---|
| **Guest / Public** | Public | Can submit emergency relief requests (`/guest-request`) without logging in. View active disasters (`/disaster-information`). |
| **Victim** | Authenticated (`role="victim"`) | Can sign in (`/login/victim`), submit relief requests associated with active disasters (`/request-help`), capture GPS coordinates, monitor live status (`/my-requests`), and view personal dashboard (`/dashboard`). |
| **Volunteer** | Authenticated (`role="volunteer"`) | Can sign in (`/login/volunteer`), register field skills and availability (`/volunteer-dashboard`), share live GPS location, accept/decline/complete assignments, and file assisted requests for victims (`/assisted-request`). |
| **Administrator** | Authenticated (`role="admin"`) | Incident command console (`/login/admin` -> `/admin-dashboard`). Declare, activate, and resolve disasters; monitor live GIS request map; match nearby volunteers by distance; dispatch and manage assignments. |

> **Note on Security**: Public registration is restricted to **Victim** and **Volunteer** roles. Public administrator registration is strictly rejected by the backend (`HTTP 400`). Administrator accounts are provisioned securely via system administration scripts.

---

## 3. Getting Started & Local Setup

### 3.1 Backend Setup

```bash
cd backend

# 1. Create and activate a Python virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment variables
# Copy .env.example to .env and configure DATABASE_URL, SECRET_KEY, etc.
cp ../.env.example .env

# 4. Run database migrations safely
python -m scripts.migrate

# 5. Start the FastAPI development server
uvicorn app.main:app --reload --port 8000
```

The API documentation is available at `http://127.0.0.1:8000/docs`.

### 3.2 Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Configure environment variables
# In frontend/.env:
# VITE_API_URL=http://127.0.0.1:8000 (for local development)
# VITE_API_URL=https://volunteer-disaster-relief-system-awao.onrender.com (for production)

# 3. Start development server
npm run dev
```

---

## 4. Database Setup & Safe Migration

### 4.1 Missing Column Prevention & Cloud Schema Compatibility

When running against an existing cloud database (such as Aiven MySQL), SQLAlchemy's `Base.metadata.create_all()` only creates missing tables; it **does not** perform general schema migrations on existing tables.

To ensure all required columns exist in production safely without dropping tables or losing data, apply the versioned migration:

#### Option A: Run the safe Python migration tool

```bash
cd backend
python -m scripts.migrate --dry-run   # Preview changes without modifying
python -m scripts.migrate             # Apply safely
```

#### Option B: Execute the idempotent SQL migration in your MySQL console / Aiven console

See [`backend/migrations/001_add_missing_columns.sql`](file:///c:/Users/Harikrishnan/OneDrive/Desktop/volunteer-disaster-relief-system/backend/migrations/001_add_missing_columns.sql):

```sql
ALTER TABLE relief_requests 
    ADD COLUMN IF NOT EXISTS latitude FLOAT NULL,
    ADD COLUMN IF NOT EXISTS longitude FLOAT NULL,
    ADD COLUMN IF NOT EXISTS phone VARCHAR(15) NULL,
    ADD COLUMN IF NOT EXISTS request_source VARCHAR(30) NOT NULL DEFAULT 'victim';

ALTER TABLE volunteers 
    ADD COLUMN IF NOT EXISTS latitude FLOAT NULL,
    ADD COLUMN IF NOT EXISTS longitude FLOAT NULL;
```

---

## 5. Administrator Account Provisioning

To securely create or promote an administrator without committing credentials to source code:

```bash
cd backend
python -m scripts.create_admin --email admin@domain.com --name "Command Officer"
```

The script will prompt for a secure password with validation (8+ characters, uppercase, lowercase, digit) and provision the administrator in the database.

---

## 6. How to Create and Activate Disasters

All relief requests (Guest, Victim, and Assisted) require an associated **Active** disaster record.

1. Sign in as Administrator through `/login/admin`.
2. On the **Command Center** (`/admin-dashboard`), navigate to the **Disasters** tab.
3. Click **"+ Catalog Disaster Incident"**.
4. Fill in:
   - **Incident Name**: (e.g. *Chennai Monsoon Flood Response*)
   - **Disaster Type**: (*flood*, *cyclone*, *earthquake*, etc.)
   - **Impact Area**: (*Central Ward & Coastal Basin*)
   - **Initial Status**: Set to **Active**.
5. Once submitted, the incident will appear on the public **Active Disasters** page (`/disaster-information`), and victims/guests can immediately select it from request forms.
6. When the event concludes, click **Resolve Incident** in the Admin Console to deactivate it. Inactive disasters are rejected by the backend for new relief requests.

---

## 7. Automated Testing & Verification

### Run Backend Tests

```bash
cd backend
python -m pytest -q
python -m compileall -q app
python -m pip check
```

- **Current Suite**: 100 passing tests covering authentication, role-based login routing, active disaster listing and filtering, request creation and status transitions, guest requests, nearby volunteer matching, assignment permissions, and regression checks.

### Run Frontend Production Build

```bash
cd frontend
npm run build
```

---

## 8. Deployment Configuration

### Render (Backend)
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Required Environment Variables**:
  - `DATABASE_URL`: Full MySQL connection string (`mysql+pymysql://<user>:<password>@<host>:<port>/<db>`)
  - `SECRET_KEY`: High-entropy random string
  - `ALGORITHM`: `HS256`
  - `ACCESS_TOKEN_EXPIRE_MINUTES`: `60`
  - `CORS_ORIGINS`: `https://volunteer-disaster-relief-system-fr-xi.vercel.app,https://volunteer-disaster-relief-system.vercel.app`
  - `SSL_CA_PATH`: (Optional) `/etc/secrets/ca.pem` if using Aiven custom project CA certificate.

### Vercel (Frontend)
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variable**: `VITE_API_URL=https://volunteer-disaster-relief-system-awao.onrender.com`
- **Single Page App Routing**: Handled via `vercel.json` rewrites.