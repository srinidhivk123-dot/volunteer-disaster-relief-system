import { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import Alert from "../components/Alert";
import ReliefRequestMap from "../components/ReliefRequestMap";
import { api, getStoredUser } from "../utils/api";

function AdminDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [requests, setRequests] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [disasters, setDisasters] = useState([]);
  const [volunteers, setVolunteers] = useState([]);

  const [selectedVolunteers, setSelectedVolunteers] = useState({});
  const [nearbyVolunteers, setNearbyVolunteers] = useState({});
  const [loadingNearby, setLoadingNearby] = useState({});
  const [assigningRequest, setAssigningRequest] = useState(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Filters & search
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("requests"); // "requests" | "assignments" | "volunteers" | "disasters"

  const loadAdminData = useCallback(async () => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (user.role !== "admin") {
      navigate("/dashboard", { replace: true });
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const [reqData, assignData, disasterData, volData] = await Promise.all([
        api.getAllRequests(),
        api.getAllAssignments(),
        api.getAllDisasters(),
        api.getAllVolunteers(),
      ]);

      setRequests(Array.isArray(reqData) ? reqData : []);
      setAssignments(Array.isArray(assignData) ? assignData : []);
      setDisasters(Array.isArray(disasterData) ? disasterData : []);
      setVolunteers(Array.isArray(volData) ? volData : []);
    } catch (err) {
      console.error("Admin data loading error:", err);
      if (err.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setErrorMessage(err.message || "Unable to retrieve administration records.");
    } finally {
      setLoading(false);
    }
  }, [navigate, user]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.getAllRequests(),
      api.getAllAssignments(),
      api.getAllDisasters(),
      api.getAllVolunteers(),
    ])
      .then(([reqData, assignData, disasterData, volData]) => {
        if (isMounted) {
          setRequests(Array.isArray(reqData) ? reqData : []);
          setAssignments(Array.isArray(assignData) ? assignData : []);
          setDisasters(Array.isArray(disasterData) ? disasterData : []);
          setVolunteers(Array.isArray(volData) ? volData : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Admin data loading error:", err);
          if (err.status === 401) {
            navigate("/login", { replace: true });
            return;
          }
          setErrorMessage(err.message || "Unable to retrieve administration records.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleVolunteerChange = (requestId, volunteerId) => {
    setSelectedVolunteers((current) => ({
      ...current,
      [requestId]: volunteerId,
    }));
  };

  const findNearby = async (requestId) => {
    setLoadingNearby((current) => ({ ...current, [requestId]: true }));
    setErrorMessage("");

    try {
      const data = await api.getNearbyVolunteers(requestId);
      setNearbyVolunteers((current) => ({
        ...current,
        [requestId]: Array.isArray(data) ? data : [],
      }));
    } catch (err) {
      console.error("Failed to find nearby volunteers:", err);
      setErrorMessage(err.message || "Failed to query nearby volunteers.");
    } finally {
      setLoadingNearby((current) => ({ ...current, [requestId]: false }));
    }
  };

  const assignVolunteer = async (requestId) => {
    const volunteerId = selectedVolunteers[requestId];
    if (!volunteerId) {
      setErrorMessage("Please select an available volunteer before assigning.");
      return;
    }

    setAssigningRequest(requestId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await api.createAssignment(requestId, volunteerId);
      setSuccessMessage(`Volunteer #${volunteerId} assigned to Relief Request #${requestId} successfully.`);
      setSelectedVolunteers((curr) => ({ ...curr, [requestId]: "" }));
      await loadAdminData();
    } catch (err) {
      console.error("Assignment failure:", err);
      setErrorMessage(err.message || "Failed to assign volunteer.");
    } finally {
      setAssigningRequest(null);
    }
  };

  // Metric Computations from real data
  const totalRequests = requests.length;
  const pendingRequests = requests.filter((r) => r.status?.toLowerCase() === "pending").length;
  const criticalRequests = requests.filter((r) => r.priority?.toUpperCase() === "HIGH").length;
  const availableVolunteers = volunteers.filter((v) => v.availability === "Available").length;
  const activeAssignments = assignments.filter((a) =>
    ["assigned", "accepted", "in_progress"].includes(a.status?.toLowerCase())
  ).length;
  const completedAssignments = assignments.filter((a) => a.status?.toLowerCase() === "completed").length;

  const getAssignmentForRequest = (requestId) =>
    assignments.find(
      (a) => Number(a.relief_request_id) === Number(requestId) && a.status?.toLowerCase() !== "declined"
    );

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchStatus = filterStatus === "all" || req.status?.toLowerCase() === filterStatus.toLowerCase();
      const matchPriority = filterPriority === "all" || req.priority?.toUpperCase() === filterPriority.toUpperCase();
      const matchSearch =
        !searchQuery ||
        req.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.request_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(req.id).includes(searchQuery);

      return matchStatus && matchPriority && matchSearch;
    });
  }, [requests, filterStatus, filterPriority, searchQuery]);

  return (
    <div className="admin-console-page">
      <Navbar />

      <main className="dashboard-page">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div>
              <span className="rc-status-badge badge-navy" style={{ marginBottom: "8px" }}>
                Incident Command System
              </span>
              <h1>Administrator Operations Console</h1>
              <p>Monitor real-time disaster relief requests, match field volunteers, and oversee mission fulfillment.</p>
            </div>
            <button
              type="button"
              className="rc-btn rc-btn-outline"
              onClick={loadAdminData}
              disabled={loading}
            >
              🔄 Refresh Data
            </button>
          </div>

          {errorMessage && <Alert type="error" message={errorMessage} onClose={() => setErrorMessage("")} />}
          {successMessage && <Alert type="success" message={successMessage} onClose={() => setSuccessMessage("")} />}

          {/* Operational Metrics (Real Data) */}
          <div className="admin-summary-grid">
            <div className="admin-summary-card stat-teal">
              <h3>Total Requests</h3>
              <p className="stat-number">{loading ? "..." : totalRequests}</p>
            </div>
            <div className="admin-summary-card stat-amber">
              <h3>Pending Verification</h3>
              <p className="stat-number">{loading ? "..." : pendingRequests}</p>
            </div>
            <div className="admin-summary-card stat-critical">
              <h3>High Priority / Urgent</h3>
              <p className="stat-number">{loading ? "..." : criticalRequests}</p>
            </div>
            <div className="admin-summary-card stat-green">
              <h3>Available Volunteers</h3>
              <p className="stat-number">{loading ? "..." : availableVolunteers}</p>
            </div>
          </div>

          <div className="admin-summary-grid" style={{ marginTop: "-12px", marginBottom: "32px" }}>
            <div className="admin-summary-card stat-teal">
              <h3>Active Task Dispatches</h3>
              <p className="stat-number">{loading ? "..." : activeAssignments}</p>
            </div>
            <div className="admin-summary-card stat-green">
              <h3>Completed Relief Tasks</h3>
              <p className="stat-number">{loading ? "..." : completedAssignments}</p>
            </div>
            <div className="admin-summary-card stat-teal">
              <h3>Active Disasters</h3>
              <p className="stat-number">
                {loading ? "..." : disasters.filter((d) => d.status === "active").length}
              </p>
            </div>
            <div className="admin-summary-card stat-teal">
              <h3>Total Registered Volunteers</h3>
              <p className="stat-number">{loading ? "..." : volunteers.length}</p>
            </div>
          </div>

          {/* Unified Incident Coordination Map */}
          <section className="dashboard-card" style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h2>Live Incident Operational Map</h2>
                <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#64748B" }}>
                  Interactive OpenStreetMap visualizing all geolocated relief requests. Click on any pin to view victim details.
                </p>
              </div>
            </div>

            <ReliefRequestMap requests={requests} height="400px" />
          </section>

          {/* Navigation Sub-Tabs */}
          <div className="auth-tabs" style={{ maxWidth: "600px", marginBottom: "24px" }}>
            <button
              type="button"
              className={`auth-tab-btn ${activeTab === "requests" ? "active" : ""}`}
              onClick={() => setActiveTab("requests")}
            >
              Relief Requests ({requests.length})
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${activeTab === "assignments" ? "active" : ""}`}
              onClick={() => setActiveTab("assignments")}
            >
              Assignments ({assignments.length})
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${activeTab === "volunteers" ? "active" : ""}`}
              onClick={() => setActiveTab("volunteers")}
            >
              Volunteers ({volunteers.length})
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${activeTab === "disasters" ? "active" : ""}`}
              onClick={() => setActiveTab("disasters")}
            >
              Disasters ({disasters.length})
            </button>
          </div>

          {/* TAB 1: Relief Requests & Volunteer Matching */}
          {activeTab === "requests" && (
            <section className="dashboard-card">
              <div className="admin-toolbar">
                <div className="toolbar-search">
                  <input
                    type="text"
                    placeholder="Search by category, location, ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: "8px 14px", width: "100%", borderRadius: "6px", border: "1px solid #E2E8F0" }}
                  />
                </div>

                <div className="toolbar-filters">
                  <label htmlFor="filter-status" style={{ fontSize: "13px", fontWeight: "600", color: "#17324D" }}>
                    Status:
                  </label>
                  <select
                    id="filter-status"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #E2E8F0" }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <label htmlFor="filter-priority" style={{ fontSize: "13px", fontWeight: "600", color: "#17324D", marginLeft: "8px" }}>
                    Priority:
                  </label>
                  <select
                    id="filter-priority"
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #E2E8F0" }}
                  >
                    <option value="all">All Priorities</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              {filteredRequests.length === 0 ? (
                <div className="empty-state">
                  <p>No relief requests match the specified criteria.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {filteredRequests.map((req) => {
                    const assignment = getAssignmentForRequest(req.id);
                    const isAssigned = Boolean(assignment);
                    const nearbyList = nearbyVolunteers[req.id];
                    const isNearbyLoading = Boolean(loadingNearby[req.id]);

                    return (
                      <div
                        key={req.id}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #E2E8F0",
                          borderRadius: "8px",
                          padding: "20px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid #E2E8F0", paddingBottom: "12px", marginBottom: "12px" }}>
                          <div>
                            <h3 style={{ margin: "0 0 4px 0", fontSize: "17px" }}>
                              Request #{req.id} &bull; <span style={{ textTransform: "capitalize" }}>{req.request_type}</span>
                            </h3>
                            <span className="text-muted" style={{ fontSize: "13px" }}>
                              Victim: {req.victim_id ? `User #${req.victim_id}` : "Guest Submission"} &bull; Source: {req.request_source}
                              {req.phone && ` • Phone: ${req.phone}`}
                            </span>
                          </div>

                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <StatusBadge status={req.priority} type="priority" />
                            <StatusBadge status={req.status} />
                          </div>
                        </div>

                        <p style={{ margin: "0 0 12px 0", color: "#1F2937", lineHeight: "1.5" }}>
                          {req.description}
                        </p>

                        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "13px", color: "#475569", background: "#F8FAFC", padding: "10px 14px", borderRadius: "6px", marginBottom: "16px" }}>
                          <div><strong>Location:</strong> {req.location}</div>
                          <div>
                            <strong>GPS Coordinates:</strong>{" "}
                            {req.latitude != null && req.longitude != null
                              ? `📍 ${Number(req.latitude).toFixed(5)}, ${Number(req.longitude).toFixed(5)}`
                              : "Not recorded"}
                          </div>
                        </div>

                        {/* Assignment Status and Actions */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderTop: "1px solid #E2E8F0", paddingTop: "14px" }}>
                          <div>
                            {isAssigned ? (
                              <span style={{ fontSize: "13px", color: "#065F46", fontWeight: "600" }}>
                                🤝 Assigned to Volunteer #{assignment.volunteer_id} (Status: {assignment.status})
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="rc-btn rc-btn-outline-teal rc-btn-sm"
                                onClick={() => findNearby(req.id)}
                                disabled={isNearbyLoading || req.latitude == null}
                              >
                                {isNearbyLoading
                                  ? "Calculating Distances..."
                                  : "📍 Find Nearby Available Volunteers"}
                              </button>
                            )}
                          </div>

                          {!isAssigned && (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <select
                                value={selectedVolunteers[req.id] || ""}
                                onChange={(e) => handleVolunteerChange(req.id, e.target.value)}
                                style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px" }}
                              >
                                <option value="">Select Available Volunteer</option>
                                {volunteers
                                  .filter((v) => v.availability === "Available")
                                  .map((v) => (
                                    <option key={v.id} value={v.id}>
                                      Volunteer #{v.id} ({v.skills || "General"})
                                    </option>
                                  ))}
                              </select>

                              <button
                                type="button"
                                className="rc-btn rc-btn-primary rc-btn-sm"
                                onClick={() => assignVolunteer(req.id)}
                                disabled={assigningRequest === req.id || !selectedVolunteers[req.id]}
                              >
                                {assigningRequest === req.id ? "Assigning..." : "Assign Dispatch"}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Nearby Volunteers Matching Result */}
                        {nearbyList && !isAssigned && (
                          <div className="nearby-volunteers-box" style={{ marginTop: "14px" }}>
                            <h4 style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
                              Proximity Matching (Nearest Available Volunteers):
                            </h4>
                            {nearbyList.length === 0 ? (
                              <p className="text-muted" style={{ fontSize: "13px" }}>
                                No available volunteers with GPS coordinates found within matching range.
                              </p>
                            ) : (
                              <div className="nearby-volunteers-list">
                                {nearbyList.map((vol) => (
                                  <div key={vol.volunteer_id} className="nearby-volunteer-item">
                                    <div>
                                      <strong>Volunteer #{vol.volunteer_id}</strong> &bull; {vol.skills || "General Relief"}
                                      <span style={{ display: "block", fontSize: "12px", color: "#64748B" }}>
                                        Availability: {vol.availability}
                                      </span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#087F8C" }}>
                                        📍 {vol.distance_km} km away
                                      </span>
                                      <button
                                        type="button"
                                        className="rc-btn rc-btn-primary rc-btn-sm"
                                        onClick={() => {
                                          handleVolunteerChange(req.id, vol.volunteer_id);
                                          assignVolunteer(req.id);
                                        }}
                                      >
                                        Assign Now
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* TAB 2: Task Assignments */}
          {activeTab === "assignments" && (
            <section className="dashboard-card">
              <h2>All Volunteer Dispatches & Assignments</h2>
              <p className="text-muted" style={{ marginBottom: "16px" }}>
                Active and historic dispatches connecting relief requests with volunteers.
              </p>

              {assignments.length === 0 ? (
                <div className="empty-state">
                  <p>No volunteer assignments recorded yet.</p>
                </div>
              ) : (
                <div className="rc-table-container">
                  <table className="rc-table">
                    <thead>
                      <tr>
                        <th>Assignment ID</th>
                        <th>Relief Request ID</th>
                        <th>Assigned Volunteer</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((asgn) => (
                        <tr key={asgn.id}>
                          <td><strong>Assignment #{asgn.id}</strong></td>
                          <td>Request #{asgn.relief_request_id}</td>
                          <td>Volunteer #{asgn.volunteer_id}</td>
                          <td>
                            <StatusBadge status={asgn.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* TAB 3: Volunteers Directory */}
          {activeTab === "volunteers" && (
            <section className="dashboard-card">
              <h2>Registered Volunteers Directory</h2>
              <p className="text-muted" style={{ marginBottom: "16px" }}>
                Active volunteer profiles, skill sets, availability, and recorded GPS locations.
              </p>

              {volunteers.length === 0 ? (
                <div className="empty-state">
                  <p>No volunteers have registered yet.</p>
                </div>
              ) : (
                <div className="rc-table-container">
                  <table className="rc-table">
                    <thead>
                      <tr>
                        <th>Volunteer ID</th>
                        <th>User ID</th>
                        <th>Specialized Skills</th>
                        <th>Availability</th>
                        <th>Field GPS Coordinates</th>
                      </tr>
                    </thead>
                    <tbody>
                      {volunteers.map((vol) => (
                        <tr key={vol.id}>
                          <td><strong>Volunteer #{vol.id}</strong></td>
                          <td>User #{vol.user_id}</td>
                          <td>{vol.skills || "General Relief"}</td>
                          <td>
                            <StatusBadge
                              status={vol.availability === "Available" ? "active" : "pending"}
                            />
                            <span style={{ marginLeft: "8px" }}>{vol.availability}</span>
                          </td>
                          <td>
                            {vol.latitude != null && vol.longitude != null
                              ? `📍 ${Number(vol.latitude).toFixed(4)}, ${Number(vol.longitude).toFixed(4)}`
                              : "Not recorded"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* TAB 4: Disasters */}
          {activeTab === "disasters" && (
            <section className="dashboard-card">
              <h2>Disaster Incidents Registry</h2>
              <p className="text-muted" style={{ marginBottom: "16px" }}>
                Active and archived disaster events cataloged in the system.
              </p>

              {disasters.length === 0 ? (
                <div className="empty-state">
                  <p>No disaster events cataloged in database.</p>
                </div>
              ) : (
                <div className="rc-table-container">
                  <table className="rc-table">
                    <thead>
                      <tr>
                        <th>Incident ID</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {disasters.map((d) => (
                        <tr key={d.id}>
                          <td><strong>#{d.id}</strong></td>
                          <td><strong>{d.name}</strong></td>
                          <td style={{ textTransform: "capitalize" }}>{d.disaster_type}</td>
                          <td>{d.location}</td>
                          <td>
                            <StatusBadge status={d.status} />
                          </td>
                          <td>{d.description || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
