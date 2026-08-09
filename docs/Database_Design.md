# Database Design

## 1. Overview

The Volunteer Disaster Relief Coordination System uses a relational database to store users, volunteers, victims, disasters, relief requests, and volunteer assignments.

The database is designed to maintain data consistency and support the main workflows of the system.

## 2. Database Tables

### 2.1 Users

Stores the common information of all users of the system.

| Column | Data Type | Key | Description |
|---|---|---|---|
| id | INT | PK | Unique user ID |
| name | VARCHAR(100) | | User's name |
| email | VARCHAR(150) | UNIQUE | User's email address |
| password_hash | VARCHAR(255) | | Hashed password |
| role | VARCHAR(20) | | User role |
| created_at | DATETIME | | Account creation time |

### 2.2 Volunteers

Stores additional information specific to volunteers.

| Column | Data Type | Key | Description |
|---|---|---|---|
| id | INT | PK | Unique volunteer ID |
| user_id | INT | FK | References users.id |
| skills | VARCHAR(255) | | Volunteer skills |
| availability | VARCHAR(100) | | Volunteer availability |
| status | VARCHAR(30) | | Current volunteer status |

### 2.3 Victims

Stores additional information specific to victims.

| Column | Data Type | Key | Description |
|---|---|---|---|
| id | INT | PK | Unique victim ID |
| user_id | INT | FK | References users.id |
| location | VARCHAR(255) | | Victim location |
| created_at | DATETIME | | Record creation time |

### 2.4 Disasters

Stores information about disaster events.

| Column | Data Type | Key | Description |
|---|---|---|---|
| id | INT | PK | Unique disaster ID |
| name | VARCHAR(150) | | Disaster name |
| type | VARCHAR(50) | | Type of disaster |
| location | VARCHAR(255) | | Disaster location |
| status | VARCHAR(30) | | Current disaster status |
| started_at | DATETIME | | Disaster start time |

### 2.5 Relief Requests

Stores requests for assistance submitted by victims.

| Column | Data Type | Key | Description |
|---|---|---|---|
| id | INT | PK | Unique request ID |
| victim_id | INT | FK | References victims.id |
| disaster_id | INT | FK | References disasters.id |
| title | VARCHAR(150) | | Request title |
| description | TEXT | | Details of required assistance |
| location | VARCHAR(255) | | Location where help is required |
| priority | VARCHAR(20) | | Request priority |
| status | VARCHAR(30) | | Current request status |
| created_at | DATETIME | | Request creation time |

### 2.6 Assignments

Stores volunteer assignments for relief requests.

| Column | Data Type | Key | Description |
|---|---|---|---|
| id | INT | PK | Unique assignment ID |
| request_id | INT | FK | References relief_requests.id |
| volunteer_id | INT | FK | References volunteers.id |
| status | VARCHAR(30) | | Assignment status |
| assigned_at | DATETIME | | Assignment time |
| completed_at | DATETIME | | Task completion time |

## 3. Relationships

### Users and Volunteers

One user can have one volunteer profile.

```text
Users 1 ───── 1 Volunteers