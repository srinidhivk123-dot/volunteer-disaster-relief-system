# Problem Statement

## 1. Title
Volunteer Disaster Relief Coordination System

## 2. Domain
Disaster Management

## 3. Who is the user? (2-3 user types, with roles)

### Administrator
Manages disaster relief operations, monitors requests, manages volunteers, assigns volunteers to relief requests, and tracks the overall status of relief activities.

### Volunteer
Registers on the platform, provides relevant skills and availability information, views assigned relief tasks, and updates the status of completed tasks.

### Victim
Submits requests for assistance during a disaster, provides the required details and location, and tracks the status of submitted requests.

## 4. What problem are we solving?
During natural disasters such as floods, earthquakes, cyclones, and landslides, coordinating relief activities and volunteers can be difficult. Victims may struggle to request timely assistance, while volunteers may not receive appropriate tasks efficiently. Administrators may also lack a centralized system to monitor requests, assign volunteers, and track the progress of relief operations. This can lead to delays, duplication of work, and inefficient use of available volunteers and resources.

## 5. Proposed Solution
The Volunteer Disaster Relief Coordination System will provide a centralized web-based platform for coordinating disaster relief activities.
The application will:
- Allow victims to register and submit disaster relief requests.
- Allow volunteers to register and provide their skills and availability.
- Allow administrators to manage volunteers and relief requests.
- Allow administrators to assign volunteers to appropriate relief requests.
- Allow volunteers to view and update the status of assigned tasks.
- Allow victims to track the status of their relief requests.
- Provide role-based access so that administrators, volunteers, and victims can access only the functions relevant to their roles.
- Maintain records of disaster requests, volunteer assignments, and relief activities.

## 6. Core Entities / Database Tables
The initial database will contain at least the following entities:
1. User
2. Volunteer
3. Victim
4. Disaster
5. ReliefRequest
6. Assignment
These entities will have relationships between them to support user management, disaster requests, volunteer assignment, and relief operation tracking.

## 7. User Roles & Permissions

### Administrator
- Manage users and volunteers.
- Create and manage disaster information.
- View and manage relief requests.
- Assign volunteers to relief requests.
- Monitor the status of relief operations.

### Volunteer
- Register and maintain their profile.
- Provide skills and availability information.
- View assigned relief requests.
- Update the status of assigned tasks.

### Victim
- Register and maintain their profile.
- Submit relief requests.
- View their submitted requests.
- Track the status of their requests.

## 8. Success Criteria
The system will be considered successful when:
- A user can register and securely log in according to their role.
- A victim can submit a relief request successfully.
- An administrator can view relief requests and assign available volunteers.
- A volunteer can view assigned tasks and update their task status.
- Users can view the current status of their requests or assignments.
- Data is stored and retrieved correctly from the database.
- The main workflows operate successfully from the frontend through the backend to the database and back to the frontend.

## 9. Out of Scope
The following features are outside the scope of the initial version:

- Physical delivery or transportation of relief materials.
- Direct emergency rescue operations.
- Real-time GPS tracking of volunteers.
- Processing financial donations or payments.
- Direct integration with government emergency response systems.
- A dedicated native Android or iOS application.
- Advanced AI-based volunteer allocation in the initial version.

These features may be considered as future enhancements if time and project requirements permit.

## 10. Chosen Track
Python — FastAPI
Frontend: React.js
Database: MySQL