import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [disasters, setDisasters] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState({});
  const [message, setMessage] = useState("Loading admin data...");

  const navigate = useNavigate();

  const loadAdminData = async () => {
    const token = localStorage.getItem("access_token");

    try {
      const requestResponse = await fetch(
        "http://127.0.0.1:8000/relief-requests/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const assignmentResponse = await fetch(
        "http://127.0.0.1:8000/assignments/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const disasterResponse = await fetch(
        "http://127.0.0.1:8000/disasters/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const volunteerResponse = await fetch(
        "http://127.0.0.1:8000/volunteers/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const requestData = await requestResponse.json();
      const assignmentData = await assignmentResponse.json();
      const disasterData = await disasterResponse.json();
      const volunteerData = await volunteerResponse.json();

      if (!requestResponse.ok) {
        setMessage(
          requestData.detail || "Failed to load relief requests."
        );
        return;
      }

      if (!assignmentResponse.ok) {
        setMessage(
          assignmentData.detail || "Failed to load assignments."
        );
        return;
      }

      if (!disasterResponse.ok) {
        setMessage(
          disasterData.detail || "Failed to load disasters."
        );
        return;
      }

      if (!volunteerResponse.ok) {
        setMessage(
          volunteerData.detail || "Failed to load volunteers."
        );
        return;
      }

      setRequests(requestData);
      setAssignments(assignmentData);
      setDisasters(disasterData);
      setVolunteers(volunteerData);
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to the backend.");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    loadAdminData();
  }, [navigate]);

  const handleVolunteerChange = (requestId,volunteerId) => {
    setSelectedVolunteers({
      ...selectedVolunteers,
      [requestId]: volunteerId,
    });
  };

  const assignVolunteer = async (requestId) => {
    const token = localStorage.getItem("access_token");
    const volunteerId = selectedVolunteers[requestId];

    if (!volunteerId) {
      alert("Please select a volunteer.");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/assignments/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            relief_request_id: requestId,
            volunteer_id: Number(volunteerId),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Failed to assign volunteer.");
        return;
      }

      alert("Volunteer assigned successfully.");

      setSelectedVolunteers({
        ...selectedVolunteers,
        [requestId]: "",
      });

      await loadAdminData();
    } catch (error) {
      console.error(error);
      alert("Cannot connect to the backend.");
    }
  };

  const isRequestAssigned = (requestId) => {
    return assignments.some(
      (assignment) =>
        assignment.relief_request_id === requestId
    );
  };

  const getAssignment = (requestId) => {
    return assignments.find(
      (assignment) =>
        assignment.relief_request_id === requestId
    );
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">

        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>

          <button onClick={logout}>
            Logout
          </button>
        </div>

        {message && <p>{message}</p>}

        <div className="dashboard-card">
          <h2>Relief Requests</h2>

          {requests.length === 0 ? (
            <p>No relief requests found.</p>
          ) : (
            requests.map((request) => {
              const assigned = isRequestAssigned(request.id);
              const assignment = getAssignment(request.id);

              return (
                <div key={request.id}>
                  <h3>Request #{request.id}</h3>

                  <p>
                    <strong>Victim ID:</strong>{" "}
                    {request.victim_id}
                  </p>

                  <p>
                    <strong>Type:</strong>{" "}
                    {request.request_type}
                  </p>

                  <p>
                    <strong>Location:</strong>{" "}
                    {request.location}
                  </p>

                  <p>
                    <strong>Priority:</strong>{" "}
                    {request.priority}
                  </p>

                  <p>
                    <strong>Source:</strong>{" "}
                    {request.request_source}
                  </p>

                  <p>
                    <strong>Status:</strong>{" "}
                    {request.status}
                  </p>

                  {assigned ? (
                    <p>
                      <strong>Assignment:</strong>{" "}
                      Already Assigned to Volunteer #
                      {assignment.volunteer_id}
                    </p>
                  ) : (
                    <div>
                      <label>
                        <strong>Assign Volunteer:</strong>
                      </label>

                      <select
                        value={
                          selectedVolunteers[request.id] || ""
                        }
                        onChange={(event) =>
                          handleVolunteerChange(
                            request.id,
                            event.target.value
                          )
                        }
                      >
                        <option value="">
                          Select Volunteer
                        </option>

                        {volunteers
                          .filter(
                            (volunteer) =>
                              volunteer.availability ===
                              "Available"
                          )
                          .map((volunteer) => (
                            <option
                              key={volunteer.id}
                              value={volunteer.id}
                            >
                              Volunteer #{volunteer.id} -{" "}
                              {volunteer.skills}
                            </option>
                          ))}
                      </select>

                      <button
                        onClick={() =>
                          assignVolunteer(request.id)
                        }
                      >
                        Assign
                      </button>
                    </div>
                  )}

                  <hr />
                </div>
              );
            })
          )}
        </div>

        <div className="dashboard-card">
          <h2>Assignments</h2>

          {assignments.length === 0 ? (
            <p>No assignments found.</p>
          ) : (
            assignments.map((assignment) => (
              <div key={assignment.id}>
                <h3>
                  Assignment #{assignment.id}
                </h3>

                <p>
                  <strong>Relief Request:</strong>{" "}
                  #{assignment.relief_request_id}
                </p>

                <p>
                  <strong>Volunteer:</strong>{" "}
                  {assignment.volunteer_id}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  {assignment.status}
                </p>

                <hr />
              </div>
            ))
          )}
        </div>

        <div className="dashboard-card">
          <h2>Disasters</h2>

          {disasters.length === 0 ? (
            <p>No disasters found.</p>
          ) : (
            disasters.map((disaster) => (
              <div key={disaster.id}>
                <h3>{disaster.name}</h3>

                <p>
                  <strong>Type:</strong>{" "}
                  {disaster.disaster_type}
                </p>

                <p>
                  <strong>Location:</strong>{" "}
                  {disaster.location}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  {disaster.status}
                </p>

                <hr />
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;