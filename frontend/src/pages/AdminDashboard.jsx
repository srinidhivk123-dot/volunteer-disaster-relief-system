import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import ReliefRequestMap from "../components/ReliefRequestMap";

function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [disasters, setDisasters] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState({});
  const [nearbyVolunteers, setNearbyVolunteers] = useState({});
  const [loadingNearby, setLoadingNearby] = useState({});
  const [message, setMessage] = useState("Loading admin data...");
  const [filterStatus, setFilterStatus] = useState("all");

  const navigate = useNavigate();

  const loadAdminData = useCallback(async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [
        requestResponse,
        assignmentResponse,
        disasterResponse,
        volunteerResponse,
      ] = await Promise.all([
        fetch("http://127.0.0.1:8000/relief-requests/", { headers }),
        fetch("http://127.0.0.1:8000/assignments/", { headers }),
        fetch("http://127.0.0.1:8000/disasters/", { headers }),
        fetch("http://127.0.0.1:8000/volunteers/", { headers }),
      ]);

      const responses = [
        requestResponse,
        assignmentResponse,
        disasterResponse,
        volunteerResponse,
      ];

      const data = await Promise.all(
        responses.map((response) => response.json())
      );

      const failedIndex = responses.findIndex((response) => !response.ok);

      if (failedIndex !== -1) {
        const response = responses[failedIndex];
        const resource = [
          "relief requests",
          "assignments",
          "disasters",
          "volunteers",
        ][failedIndex];

        setMessage(
          data[failedIndex]?.detail ||
            `Failed to load ${resource}.`
        );

        if (response.status === 401) {
          localStorage.removeItem("access_token");
          navigate("/login");
        }

        return;
      }

      setRequests(Array.isArray(data[0]) ? data[0] : []);
      setAssignments(Array.isArray(data[1]) ? data[1] : []);
      setDisasters(Array.isArray(data[2]) ? data[2] : []);
      setVolunteers(Array.isArray(data[3]) ? data[3] : []);
      setMessage("");
    } catch (error) {
      console.error("Failed to load admin data:", error);
      setMessage("Cannot connect to the backend. Check that it is running.");
    }
  }, [navigate]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleVolunteerChange = (requestId, volunteerId) => {
    setSelectedVolunteers((current) => ({
      ...current,
      [requestId]: volunteerId,
    }));
  };

  const findNearbyVolunteers = async (requestId) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    setLoadingNearby((current) => ({
      ...current,
      [requestId]: true,
    }));

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/volunteers/nearby/${requestId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail || "Failed to find nearby volunteers."
        );
        return;
      }

      if (!Array.isArray(data)) {
        setMessage("Unexpected response from nearby-volunteers API.");
        return;
      }

      setNearbyVolunteers((current) => ({
        ...current,
        [requestId]: data,
      }));

      setMessage("");
    } catch (error) {
      console.error("Nearby-volunteer request failed:", error);
      setMessage("Cannot connect to the backend.");
    } finally {
      setLoadingNearby((current) => ({
        ...current,
        [requestId]: false,
      }));
    }
  };

  const assignVolunteer = async (requestId) => {
    const token = localStorage.getItem("access_token");
    const volunteerId = selectedVolunteers[requestId];

    if (!token) {
      navigate("/login");
      return;
    }

    if (!volunteerId) {
      setMessage("Please select a volunteer before assigning.");
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
            relief_request_id: Number(requestId),
            volunteer_id: Number(volunteerId),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail || "Failed to assign volunteer."
        );
        return;
      }

      setSelectedVolunteers((current) => ({
        ...current,
        [requestId]: "",
      }));

      setMessage("Volunteer assigned successfully.");
      await loadAdminData();
    } catch (error) {
      console.error("Assignment failed:", error);
      setMessage("Cannot connect to the backend.");
    }
  };

  const getAssignment = (requestId) =>
    assignments.find(
      (assignment) =>
        Number(assignment.relief_request_id) === Number(requestId) &&
        assignment.status?.toLowerCase() !== "declined"
    );

  const isRequestAssigned = (requestId) =>
    Boolean(getAssignment(requestId));

  const logout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  const availableVolunteerCount = volunteers.filter(
    (volunteer) => volunteer.availability === "Available"
  ).length;

  const pendingRequestCount = requests.filter(
    (request) => request.status?.toLowerCase() === "pending"
  ).length;

  const activeAssignmentCount = assignments.filter(
    (assignment) =>
      ["assigned", "accepted", "in_progress"].includes(
        assignment.status?.toLowerCase()
      )
  ).length;

  const filteredRequests =
    filterStatus === "all"
      ? requests
      : requests.filter(
          (request) =>
            request.status?.toLowerCase() === filterStatus
        );

  const statusClass = (status) => {
    const normalized = status?.toLowerCase().replace(/\s+/g, "-");
    return `status-badge status-${normalized || "unknown"}`;
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Disaster Relief Coordination System</p>
          </div>

          <button onClick={logout}>Logout</button>
        </div>

        {message && (
          <div className="admin-message" role="status">
            <p>{message}</p>
            <button onClick={loadAdminData}>Refresh</button>
          </div>
        )}

        <div className="admin-summary-grid">
          <div className="admin-summary-card">
            <h3>Total Requests</h3>
            <p>{requests.length}</p>
          </div>

          <div className="admin-summary-card">
            <h3>Pending Requests</h3>
            <p>{pendingRequestCount}</p>
          </div>

          <div className="admin-summary-card">
            <h3>Available Volunteers</h3>
            <p>{availableVolunteerCount}</p>
          </div>

          <div className="admin-summary-card">
            <h3>Active Assignments</h3>
            <p>{activeAssignmentCount}</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="admin-section-header">
            <h2>Relief Requests</h2>

            <label>
              Filter by status:{" "}
              <select
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value)}
              >
                <option value="all">All Requests</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="accepted">Accepted</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
          </div>

          {filteredRequests.length === 0 ? (
            <p>No relief requests match this filter.</p>
          ) : (
            filteredRequests.map((request) => {
              const assignment = getAssignment(request.id);
              const assigned = Boolean(assignment);
              const nearbyList = nearbyVolunteers[request.id];

              return (
                <div className="admin-request-item" key={request.id}>
                  <h3>Request #{request.id}</h3>

                  <p>
                    <strong>Victim ID:</strong>{" "}
                    {request.victim_id ?? "Guest"}
                  </p>

                  <p>
                    <strong>Type:</strong> {request.request_type}
                  </p>

                  <p>
                    <strong>Location:</strong> {request.location}
                  </p>

                  <p>
                    <strong>Priority:</strong> {request.priority}
                  </p>

                  <p>
                    <strong>Source:</strong>{" "}
                    {request.request_source || "Not specified"}
                  </p>

                  <p>
                    <strong>Status:</strong>{" "}
                    <span className={statusClass(request.status)}>
                      {request.status || "Unknown"}
                    </span>
                  </p>

                  <ReliefRequestMap
                    latitude={request.latitude}
                    longitude={request.longitude}
                    requestId={request.id}
                    location={request.location}
                  />

                  <div className="nearby-volunteers-section">
                    <h4>Nearby Volunteers</h4>

                    <button
                      onClick={() => findNearbyVolunteers(request.id)}
                      disabled={Boolean(loadingNearby[request.id])}
                    >
                      {loadingNearby[request.id]
                        ? "Finding Volunteers..."
                        : "Find Nearby Volunteers"}
                    </button>

                    {nearbyList && nearbyList.length === 0 && (
                      <p>
                        No available volunteers with GPS coordinates were
                        found for this request.
                      </p>
                    )}

                    {nearbyList?.map((volunteer) => (
                      <div
                        className="nearby-volunteer-item"
                        key={volunteer.volunteer_id}
                      >
                        <p>
                          <strong>
                            Volunteer #{volunteer.volunteer_id}
                          </strong>
                        </p>

                        <p>
                          <strong>Skills:</strong>{" "}
                          {volunteer.skills || "Not specified"}
                        </p>

                        <p>
                          <strong>Availability:</strong>{" "}
                          {volunteer.availability || "Not specified"}
                        </p>

                        <p>
                          <strong>Distance:</strong>{" "}
                          {Number.isFinite(volunteer.distance_km)
                            ? `${volunteer.distance_km.toFixed(2)} km`
                            : "Unavailable"}
                        </p>
                      </div>
                    ))}
                  </div>

                  {assigned ? (
                    <p>
                      <strong>Assignment:</strong> Already assigned to
                      Volunteer #{assignment.volunteer_id}
                    </p>
                  ) : (
                    <div className="assign-volunteer-section">
                      <label htmlFor={`volunteer-${request.id}`}>
                        <strong>Assign Volunteer:</strong>
                      </label>

                      <select
                        id={`volunteer-${request.id}`}
                        value={selectedVolunteers[request.id] || ""}
                        onChange={(event) =>
                          handleVolunteerChange(
                            request.id,
                            event.target.value
                          )
                        }
                      >
                        <option value="">Select Volunteer</option>

                        {volunteers
                          .filter(
                            (volunteer) =>
                              volunteer.availability === "Available"
                          )
                          .map((volunteer) => (
                            <option
                              key={volunteer.id}
                              value={volunteer.id}
                            >
                              Volunteer #{volunteer.id} -{" "}
                              {volunteer.skills || "Skills not specified"}
                            </option>
                          ))}
                      </select>

                      <button onClick={() => assignVolunteer(request.id)}>
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
              <div className="admin-list-item" key={assignment.id}>
                <h3>Assignment #{assignment.id}</h3>

                <p>
                  <strong>Relief Request:</strong>{" "}
                  #{assignment.relief_request_id}
                </p>

                <p>
                  <strong>Volunteer:</strong> {assignment.volunteer_id}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  <span className={statusClass(assignment.status)}>
                    {assignment.status || "Unknown"}
                  </span>
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
              <div className="admin-list-item" key={disaster.id}>
                <h3>{disaster.name}</h3>

                <p>
                  <strong>Type:</strong> {disaster.disaster_type}
                </p>

                <p>
                  <strong>Location:</strong> {disaster.location}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  <span className={statusClass(disaster.status)}>
                    {disaster.status || "Unknown"}
                  </span>
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