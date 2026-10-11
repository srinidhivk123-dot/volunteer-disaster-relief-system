import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import Alert from "../components/Alert";
import ReliefRequestMap from "../components/ReliefRequestMap";
import { api, getStoredUser } from "../utils/api";

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

function VolunteerDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [profile, setProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileSkills, setProfileSkills] = useState("");
  const [profileAvailability, setProfileAvailability] = useState("Available");
  const [profileLat, setProfileLat] = useState(null);
  const [profileLng, setProfileLng] = useState(null);

  const [assignments, setAssignments] = useState([]);
  const [availableRequests, setAvailableRequests] = useState([]);
  const [disasters, setDisasters] = useState([]);
  const [requestDetails, setRequestDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [acceptingRequestId, setAcceptingRequestId] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState("active"); // "active" | "available" | "history" | "disasters"

  const loadData = useCallback(async () => {
    if (!user) {
      navigate("/login/volunteer", { replace: true });
      return;
    }

    if (user.role === "admin") {
      navigate("/admin-dashboard", { replace: true });
      return;
    }

    if (user.role !== "volunteer") {
      navigate("/dashboard", { replace: true });
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      // 1. Fetch Profile
      let prof = null;
      try {
        prof = await api.getMyVolunteerProfile();
        setProfile(prof);
        setProfileSkills(prof?.skills || "");
        setProfileAvailability(prof?.availability || "Available");
        setProfileLat(prof?.latitude);
        setProfileLng(prof?.longitude);
      } catch (profErr) {
        if (profErr.status === 404) {
          setProfile(null);
          setEditingProfile(true);
        } else {
          console.warn("Could not fetch volunteer profile:", profErr);
        }
      }

      // 2. Fetch Assignments
      let safeAssignments = [];
      try {
        const assignList = await api.getAllAssignments();
        safeAssignments = Array.isArray(assignList) ? assignList : [];
        setAssignments(safeAssignments);
      } catch (asgnErr) {
        console.warn("Could not fetch assignments:", asgnErr);
      }

      // 3. Fetch Active Disasters
      try {
        const disList = await api.getActiveDisasters();
        setDisasters(Array.isArray(disList) ? disList : []);
      } catch (disErr) {
        console.warn("Could not fetch active disasters:", disErr);
      }

      // 4. Fetch All Relief Requests (for details and available unassigned requests)
      try {
        const allReqs = await api.getAllRequests();
        const safeReqs = Array.isArray(allReqs) ? allReqs : [];

        // Build details map for assigned tasks
        const detailsMap = {};
        safeReqs.forEach((req) => {
          let dist = null;
          if (
            prof?.latitude != null &&
            prof?.longitude != null &&
            req.latitude != null &&
            req.longitude != null
          ) {
            dist = calculateDistance(
              prof.latitude,
              prof.longitude,
              req.latitude,
              req.longitude
            );
          }
          detailsMap[req.id] = {
            ...req,
            distanceKm: dist,
          };
        });
        setRequestDetails(detailsMap);

        // Filter unassigned pending requests
        const assignedReqIds = new Set(
          safeAssignments
            .filter((a) => a.status !== "declined")
            .map((a) => Number(a.relief_request_id))
        );

        const unassigned = safeReqs.filter(
          (r) => r.status === "pending" && !assignedReqIds.has(Number(r.id))
        );
        setAvailableRequests(unassigned);
      } catch (reqListErr) {
        console.warn("Could not fetch relief requests:", reqListErr);
      }
    } catch (err) {
      console.error("Error loading volunteer data:", err);
      setErrorMessage(err.message || "Failed to load volunteer records.");
    } finally {
      setLoading(false);
    }
  }, [navigate, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus("Geolocation is not supported by your browser.");
      return;
    }
    setGpsStatus("Detecting GPS coordinates...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setProfileLat(pos.coords.latitude);
        setProfileLng(pos.coords.longitude);
        setGpsStatus("📍 GPS position captured successfully.");
      },
      (err) => {
        console.warn("GPS error:", err);
        setGpsStatus("Unable to access GPS location. Permission denied or timed out.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = {
        skills: profileSkills.trim() || "General Disaster Relief",
        availability: profileAvailability,
        latitude: profileLat != null ? Number(profileLat) : null,
        longitude: profileLng != null ? Number(profileLng) : null,
      };

      let updated;
      if (profile) {
        updated = await api.updateMyVolunteerProfile(payload);
      } else {
        updated = await api.createVolunteerProfile(payload);
      }
      setProfile(updated);
      setEditingProfile(false);
      setSuccessMessage("Volunteer profile updated successfully!");
      setGpsStatus("");
      await loadData();
    } catch (err) {
      console.error("Profile save error:", err);
      setErrorMessage(err.message || "Failed to save profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateAssignmentStatus = async (assignmentId, newStatus) => {
    setUpdatingId(assignmentId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await api.updateAssignmentStatus(assignmentId, newStatus);
      setSuccessMessage(`Assignment status updated to "${newStatus}".`);
      await loadData();
    } catch (err) {
      console.error("Status update error:", err);
      setErrorMessage(err.message || "Failed to update assignment status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    if (!profile) {
      setErrorMessage("Please complete your volunteer profile before accepting relief requests.");
      return;
    }

    setAcceptingRequestId(requestId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await api.createAssignment(requestId, profile.id);
      setSuccessMessage(`Relief Request #${requestId} accepted successfully! It is now listed under your Active Tasks.`);
      setActiveTab("active");
      await loadData();
    } catch (err) {
      console.error("Failed to accept request:", err);
      setErrorMessage(err.message || "Failed to accept relief request.");
    } finally {
      setAcceptingRequestId(null);
    }
  };

  const activeAssignments = assignments.filter((a) =>
    ["assigned", "accepted", "in_progress"].includes(a.status?.toLowerCase())
  );

  const historyAssignments = assignments.filter((a) =>
    ["completed", "declined"].includes(a.status?.toLowerCase())
  );

  return (
    <div className="volunteer-dashboard-page">
      <Navbar />

      <main className="dashboard-page">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div>
              <span className="rc-status-badge badge-teal" style={{ marginBottom: "8px" }}>
                Field Volunteer Console
              </span>
              <h1>Volunteer Operations</h1>
              <p>Manage your availability, view dispatched assignments, and accept open community relief requests.</p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="rc-btn rc-btn-navy"
                onClick={() => navigate("/assisted-request")}
              >
                🤝 Create Assisted Request
              </button>
              <button
                type="button"
                className="rc-btn rc-btn-outline"
                onClick={loadData}
                disabled={loading}
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {errorMessage && <Alert type="error" message={errorMessage} onClose={() => setErrorMessage("")} />}
          {successMessage && <Alert type="success" message={successMessage} onClose={() => setSuccessMessage("")} />}

          {/* Volunteer Profile Card */}
          <section className="dashboard-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
              <h2>My Field Profile</h2>
              {!editingProfile && (
                <button
                  type="button"
                  className="rc-btn rc-btn-outline-teal rc-btn-sm"
                  onClick={() => setEditingProfile(true)}
                >
                  ✏️ Edit Profile & Location
                </button>
              )}
            </div>

            {editingProfile ? (
              <form onSubmit={handleSaveProfile} style={{ marginTop: "14px" }}>
                <div className="form-row">
                  <div className="rc-form-group">
                    <label htmlFor="vol-skills">My Skills & Specialization</label>
                    <input
                      id="vol-skills"
                      type="text"
                      placeholder="e.g. First Aid, Boat Rescue, Medical Doctor, Driver"
                      value={profileSkills}
                      onChange={(e) => setProfileSkills(e.target.value)}
                    />
                  </div>

                  <div className="rc-form-group">
                    <label htmlFor="vol-avail">Current Availability</label>
                    <select
                      id="vol-avail"
                      value={profileAvailability}
                      onChange={(e) => setProfileAvailability(e.target.value)}
                    >
                      <option value="Available">Available (On-Call)</option>
                      <option value="Busy">Busy (Currently on mission)</option>
                      <option value="Unavailable">Unavailable (Off-duty)</option>
                    </select>
                  </div>
                </div>

                <div className="gps-field-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <strong>Live Field GPS Coordinates</strong>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748B" }}>
                        Allows coordinators to calculate distances to nearby victims.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rc-btn rc-btn-outline-teal rc-btn-sm"
                      onClick={handleCaptureGps}
                    >
                      📍 Update Current GPS
                    </button>
                  </div>

                  {gpsStatus && <p className="gps-info">{gpsStatus}</p>}

                  {profileLat != null && profileLng != null && (
                    <div style={{ marginTop: "8px", fontSize: "13px", color: "#1F2937" }}>
                      <strong>Latitude:</strong> {Number(profileLat).toFixed(6)} &bull; <strong>Longitude:</strong> {Number(profileLng).toFixed(6)}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                  <button
                    type="submit"
                    className="rc-btn rc-btn-primary"
                    disabled={savingProfile}
                  >
                    {savingProfile ? "Saving Profile..." : "Save Profile Details"}
                  </button>
                  {profile && (
                    <button
                      type="button"
                      className="rc-btn rc-btn-outline"
                      onClick={() => {
                        setEditingProfile(false);
                        setGpsStatus("");
                      }}
                      disabled={savingProfile}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            ) : profile ? (
              <div className="profile-card-grid">
                <div className="profile-field">
                  <label>Skills & Specialization</label>
                  <span>{profile.skills || "General Relief Assistance"}</span>
                </div>
                <div className="profile-field">
                  <label>Availability Status</label>
                  <StatusBadge
                    status={profile.availability === "Available" ? "active" : "pending"}
                  />
                  <span style={{ marginLeft: "8px", fontSize: "14px" }}>{profile.availability}</span>
                </div>
                <div className="profile-field">
                  <label>Field GPS Location</label>
                  <span>
                    {profile.latitude != null && profile.longitude != null
                      ? `📍 ${Number(profile.latitude).toFixed(4)}, ${Number(profile.longitude).toFixed(4)}`
                      : "Not shared"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "20px" }}>
                <p>No volunteer profile found. Please configure your skills and availability.</p>
              </div>
            )}
          </section>

          {/* Navigation Tabs */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "32px 0 16px", flexWrap: "wrap", gap: "12px" }}>
            <div className="auth-tabs" style={{ marginBottom: "0", minWidth: "300px" }}>
              <button
                type="button"
                className={`auth-tab-btn ${activeTab === "active" ? "active" : ""}`}
                onClick={() => setActiveTab("active")}
              >
                Active Tasks ({activeAssignments.length})
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${activeTab === "available" ? "active" : ""}`}
                onClick={() => setActiveTab("available")}
              >
                Available Requests ({availableRequests.length})
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${activeTab === "disasters" ? "active" : ""}`}
                onClick={() => setActiveTab("disasters")}
              >
                Active Disasters ({disasters.length})
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${activeTab === "history" ? "active" : ""}`}
                onClick={() => setActiveTab("history")}
              >
                Task History ({historyAssignments.length})
              </button>
            </div>
          </div>

          {/* Tab 1: Active Assigned Tasks */}
          {activeTab === "active" && (
            loading ? (
              <div className="dashboard-card" style={{ textAlign: "center", padding: "48px" }}>
                <p className="text-muted">Loading assigned relief tasks...</p>
              </div>
            ) : activeAssignments.length === 0 ? (
              <div className="empty-state">
                <div className="icon">🤝</div>
                <h3>No Active Relief Tasks Assigned</h3>
                <p>
                  You currently have no active assigned tasks. Check the <strong>Available Requests</strong> tab above to accept an open relief request, or wait for an incident commander to dispatch you.
                </p>
                <button
                  type="button"
                  className="rc-btn rc-btn-primary"
                  onClick={() => setActiveTab("available")}
                  style={{ marginTop: "12px" }}
                >
                  Browse Available Requests ({availableRequests.length})
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {activeAssignments.map((asgn) => {
                  const req = requestDetails[asgn.relief_request_id];
                  const isAssigned = asgn.status === "assigned";
                  const isAccepted = asgn.status === "accepted";
                  const isInProgress = asgn.status === "in_progress";

                  return (
                    <div key={asgn.id} className="dashboard-card" style={{ marginBottom: "0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid #E2E8F0", paddingBottom: "14px", marginBottom: "16px" }}>
                        <div>
                          <h2 style={{ margin: "0 0 4px 0", fontSize: "18px" }}>
                            Assignment #{asgn.id} &mdash; Relief Request #{asgn.relief_request_id}
                          </h2>
                          {req && (
                            <span className="text-muted" style={{ fontSize: "13px" }}>
                              Category: <strong style={{ textTransform: "capitalize", color: "#17324D" }}>{req.request_type}</strong>
                              {req.distanceKm != null && ` • Approx. ${req.distanceKm} km from you`}
                            </span>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          {req && <StatusBadge status={req.priority} type="priority" />}
                          <StatusBadge status={asgn.status} />
                        </div>
                      </div>

                      {req ? (
                        <>
                          <p style={{ margin: "0 0 16px 0", color: "#1F2937", lineHeight: "1.6" }}>
                            <strong>Requirement:</strong> {req.description}
                          </p>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", background: "#F8FAFC", padding: "12px 16px", borderRadius: "8px", border: "1px solid #E2E8F0", marginBottom: "16px" }}>
                            <div>
                              <small className="text-muted" style={{ display: "block" }}>Location</small>
                              <strong>{req.location}</strong>
                            </div>
                            {req.phone && (
                              <div>
                                <small className="text-muted" style={{ display: "block" }}>Contact Phone</small>
                                <a href={`tel:${req.phone}`} style={{ fontWeight: "700" }}>
                                  📞 {req.phone}
                                </a>
                              </div>
                            )}
                            <div>
                              <small className="text-muted" style={{ display: "block" }}>Distance</small>
                              <strong>
                                {req.distanceKm != null
                                  ? `📍 ${req.distanceKm} km away`
                                  : "GPS coordinates unavailable"}
                              </strong>
                            </div>
                          </div>

                          {req.latitude != null && req.longitude != null && (
                            <div style={{ marginBottom: "16px" }}>
                              <ReliefRequestMap
                                latitude={req.latitude}
                                longitude={req.longitude}
                                requestId={req.id}
                                location={req.location}
                                height="220px"
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-muted" style={{ marginBottom: "16px" }}>
                          Relief request #{asgn.relief_request_id} details loading.
                        </p>
                      )}

                      {/* Volunteer Status Actions */}
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #E2E8F0", paddingTop: "14px", flexWrap: "wrap" }}>
                        {isAssigned && (
                          <>
                            <button
                              type="button"
                              className="rc-btn rc-btn-teal rc-btn-sm"
                              onClick={() => handleUpdateAssignmentStatus(asgn.id, "accepted")}
                              disabled={updatingId === asgn.id}
                            >
                              {updatingId === asgn.id ? "Updating..." : "👍 Accept Task"}
                            </button>
                            <button
                              type="button"
                              className="rc-btn rc-btn-primary rc-btn-sm"
                              onClick={() => handleUpdateAssignmentStatus(asgn.id, "in_progress")}
                              disabled={updatingId === asgn.id}
                            >
                              {updatingId === asgn.id ? "Updating..." : "▶️ Start Response"}
                            </button>
                            <button
                              type="button"
                              className="rc-btn rc-btn-danger rc-btn-sm"
                              onClick={() => handleUpdateAssignmentStatus(asgn.id, "declined")}
                              disabled={updatingId === asgn.id}
                            >
                              {updatingId === asgn.id ? "Updating..." : "✕ Decline"}
                            </button>
                          </>
                        )}

                        {isAccepted && (
                          <>
                            <button
                              type="button"
                              className="rc-btn rc-btn-primary rc-btn-sm"
                              onClick={() => handleUpdateAssignmentStatus(asgn.id, "in_progress")}
                              disabled={updatingId === asgn.id}
                            >
                              {updatingId === asgn.id ? "Updating..." : "▶️ Start Response (In Progress)"}
                            </button>
                            <button
                              type="button"
                              className="rc-btn rc-btn-navy rc-btn-sm"
                              onClick={() => handleUpdateAssignmentStatus(asgn.id, "completed")}
                              disabled={updatingId === asgn.id}
                            >
                              {updatingId === asgn.id ? "Updating..." : "🏁 Mark Completed"}
                            </button>
                          </>
                        )}

                        {isInProgress && (
                          <button
                            type="button"
                            className="rc-btn rc-btn-navy rc-btn-sm"
                            onClick={() => handleUpdateAssignmentStatus(asgn.id, "completed")}
                            disabled={updatingId === asgn.id}
                          >
                            {updatingId === asgn.id ? "Updating..." : "🏁 Mark Completed"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Tab 2: Available Open Requests to Accept */}
          {activeTab === "available" && (
            loading ? (
              <div className="dashboard-card" style={{ textAlign: "center", padding: "48px" }}>
                <p className="text-muted">Loading available requests...</p>
              </div>
            ) : availableRequests.length === 0 ? (
              <div className="empty-state">
                <div className="icon">✅</div>
                <h3>No Open Relief Requests Pending Assignment</h3>
                <p>
                  All current relief requests have already been assigned to volunteer responders. Check back shortly for new requests.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {availableRequests.map((req) => {
                  let dist = null;
                  if (
                    profile?.latitude != null &&
                    profile?.longitude != null &&
                    req.latitude != null &&
                    req.longitude != null
                  ) {
                    dist = calculateDistance(
                      profile.latitude,
                      profile.longitude,
                      req.latitude,
                      req.longitude
                    );
                  }

                  return (
                    <div key={req.id} className="dashboard-card" style={{ marginBottom: "0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid #E2E8F0", paddingBottom: "14px", marginBottom: "16px" }}>
                        <div>
                          <h2 style={{ margin: "0 0 4px 0", fontSize: "18px" }}>
                            Request #{req.id} &mdash; <span style={{ textTransform: "capitalize" }}>{req.request_type}</span>
                          </h2>
                          <span className="text-muted" style={{ fontSize: "13px" }}>
                            Source: <strong style={{ textTransform: "capitalize" }}>{req.request_source || "Victim"}</strong>
                            {dist != null && ` • Approx. ${dist} km from you`}
                          </span>
                        </div>

                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <StatusBadge status={req.priority} type="priority" />
                          <StatusBadge status={req.status} />
                        </div>
                      </div>

                      <p style={{ margin: "0 0 16px 0", color: "#1F2937", lineHeight: "1.6" }}>
                        <strong>Description:</strong> {req.description}
                      </p>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", background: "#F8FAFC", padding: "12px 16px", borderRadius: "8px", border: "1px solid #E2E8F0", marginBottom: "16px" }}>
                        <div>
                          <small className="text-muted" style={{ display: "block" }}>Location</small>
                          <strong>{req.location}</strong>
                        </div>
                        {req.phone && (
                          <div>
                            <small className="text-muted" style={{ display: "block" }}>Contact Phone</small>
                            <a href={`tel:${req.phone}`} style={{ fontWeight: "700" }}>
                              📞 {req.phone}
                            </a>
                          </div>
                        )}
                        <div>
                          <small className="text-muted" style={{ display: "block" }}>Distance</small>
                          <strong>{dist != null ? `📍 ${dist} km away` : "GPS coordinates unavailable"}</strong>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #E2E8F0", paddingTop: "14px" }}>
                        <button
                          type="button"
                          className="rc-btn rc-btn-primary rc-btn-sm"
                          onClick={() => handleAcceptRequest(req.id)}
                          disabled={acceptingRequestId === req.id}
                        >
                          {acceptingRequestId === req.id ? "Accepting..." : "🤝 Accept This Request"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Tab 3: Active Disasters View */}
          {activeTab === "disasters" && (
            disasters.length === 0 ? (
              <div className="empty-state">
                <div className="icon">🛡️</div>
                <h3>No Active Disaster Emergencies Declared</h3>
                <p>There are currently no active disaster alerts declared in the coordination system.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
                {disasters.map((d) => (
                  <div key={d.id} className="dashboard-card" style={{ marginBottom: "0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <span className="rc-status-badge badge-teal">Incident #{d.id}</span>
                      <StatusBadge status={d.status} />
                    </div>
                    <h3 style={{ margin: "4px 0", fontSize: "18px" }}>{d.name}</h3>
                    <div style={{ fontSize: "13px", color: "#475569", marginBottom: "8px" }}>
                      <strong>Category:</strong> <span style={{ textTransform: "capitalize" }}>{d.disaster_type}</span> &bull; <strong>Area:</strong> {d.location}
                    </div>
                    <p style={{ fontSize: "13px", color: "#64748B", margin: "0" }}>
                      {d.description || "Active relief operations cataloged."}
                    </p>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Tab 4: Completed / History Tasks */}
          {activeTab === "history" && (
            historyAssignments.length === 0 ? (
              <div className="empty-state">
                <div className="icon">📋</div>
                <h3>No Past Task History</h3>
                <p>Tasks you complete will be cataloged here for operations audit and tracking.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {historyAssignments.map((asgn) => {
                  const req = requestDetails[asgn.relief_request_id];
                  return (
                    <div key={asgn.id} className="dashboard-card" style={{ marginBottom: "0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <div>
                          <strong>Assignment #{asgn.id}</strong> &mdash; Request #{asgn.relief_request_id}
                          {req && ` (${req.request_type} - ${req.location})`}
                        </div>
                        <StatusBadge status={asgn.status} />
                      </div>
                      {req && <p style={{ margin: "0", fontSize: "14px", color: "#64748B" }}>{req.description}</p>}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}

export default VolunteerDashboard;
