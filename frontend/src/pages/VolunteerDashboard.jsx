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
  const [requestDetails, setRequestDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState("active"); // "active" | "history"

  const loadData = useCallback(async () => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (user.role !== "volunteer" && user.role !== "admin") {
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
        setProfileSkills(prof.skills || "");
        setProfileAvailability(prof.availability || "Available");
        setProfileLat(prof.latitude);
        setProfileLng(prof.longitude);
      } catch (profErr) {
        if (profErr.status === 404) {
          // No profile yet, allow creating one
          setProfile(null);
          setEditingProfile(true);
        } else {
          throw profErr;
        }
      }

      // 2. Fetch Assignments
      const assignList = await api.getAllAssignments();
      const safeAssignments = Array.isArray(assignList) ? assignList : [];
      setAssignments(safeAssignments);

      // 3. Load request details for all assignments
      const detailsMap = {};
      await Promise.all(
        safeAssignments.map(async (asgn) => {
          try {
            const req = await api.getRequestById(asgn.relief_request_id);
            if (req) {
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
              detailsMap[asgn.relief_request_id] = {
                ...req,
                distanceKm: dist,
              };
            }
          } catch (reqErr) {
            console.warn(`Could not load details for request #${asgn.relief_request_id}:`, reqErr);
          }
        })
      );
      setRequestDetails(detailsMap);
    } catch (err) {
      console.error("Error loading volunteer data:", err);
      setErrorMessage(err.message || "Failed to load volunteer records.");
    } finally {
      setLoading(false);
    }
  }, [navigate, user]);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        let prof = null;
        try {
          prof = await api.getMyVolunteerProfile();
          if (isMounted) {
            setProfile(prof);
            setProfileSkills(prof.skills || "");
            setProfileAvailability(prof.availability || "Available");
            setProfileLat(prof.latitude);
            setProfileLng(prof.longitude);
          }
        } catch (profErr) {
          if (profErr.status === 404 && isMounted) {
            setProfile(null);
            setEditingProfile(true);
          } else {
            throw profErr;
          }
        }

        const assignList = await api.getAllAssignments();
        const safeAssignments = Array.isArray(assignList) ? assignList : [];
        if (isMounted) setAssignments(safeAssignments);

        const detailsMap = {};
        await Promise.all(
          safeAssignments.map(async (asgn) => {
            try {
              const req = await api.getRequestById(asgn.relief_request_id);
              if (req) {
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
                detailsMap[asgn.relief_request_id] = {
                  ...req,
                  distanceKm: dist,
                };
              }
            } catch (reqErr) {
              console.warn(`Could not load details for request #${asgn.relief_request_id}:`, reqErr);
            }
          })
        );

        if (isMounted) {
          setRequestDetails(detailsMap);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error loading volunteer data:", err);
          setErrorMessage(err.message || "Failed to load volunteer records.");
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

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
        skills: profileSkills.trim(),
        availability: profileAvailability,
        latitude: profileLat != null ? Number(profileLat) : null,
        longitude: profileLng != null ? Number(profileLng) : null,
      };

      const updated = await api.updateMyVolunteerProfile(payload);
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

  const activeAssignments = assignments.filter((a) =>
    ["assigned", "in_progress"].includes(a.status?.toLowerCase())
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
              <p>Manage your field availability, view dispatched assignments, and report status progress.</p>
            </div>
            <button
              type="button"
              className="rc-btn rc-btn-navy"
              onClick={() => navigate("/assisted-request")}
            >
              🤝 Create Assisted Request
            </button>
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
                    <label htmlFor="vol-skills">My Skills & Certifications</label>
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
                        Allows dispatchers to match you with nearby victims based on distance.
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

          {/* Task Assignments Navigation Tabs */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "32px 0 16px", flexWrap: "wrap", gap: "12px" }}>
            <div className="auth-tabs" style={{ marginBottom: "0", minWidth: "280px" }}>
              <button
                type="button"
                className={`auth-tab-btn ${activeTab === "active" ? "active" : ""}`}
                onClick={() => setActiveTab("active")}
              >
                Active Tasks ({activeAssignments.length})
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${activeTab === "history" ? "active" : ""}`}
                onClick={() => setActiveTab("history")}
              >
                Completed / History ({historyAssignments.length})
              </button>
            </div>

            <button
              type="button"
              className="rc-btn rc-btn-outline rc-btn-sm"
              onClick={loadData}
            >
              🔄 Refresh Tasks
            </button>
          </div>

          {/* Task Cards List */}
          {loading ? (
            <div className="dashboard-card" style={{ textAlign: "center", padding: "48px" }}>
              <p className="text-muted">Loading assigned relief tasks...</p>
            </div>
          ) : (activeTab === "active" ? activeAssignments : historyAssignments).length === 0 ? (
            <div className="empty-state">
              <div className="icon">{activeTab === "active" ? "🤝" : "✅"}</div>
              <h3>
                {activeTab === "active"
                  ? "No Active Relief Tasks Assigned"
                  : "No Past Task History"}
              </h3>
              <p>
                {activeTab === "active"
                  ? "When an administrator assigns a relief request to your profile, details and instructions will appear here."
                  : "Tasks you complete or decline will be logged here for operation audits."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {(activeTab === "active" ? activeAssignments : historyAssignments).map((asgn) => {
                const req = requestDetails[asgn.relief_request_id];
                const isAssigned = asgn.status === "assigned";
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
                              <small className="text-muted" style={{ display: "block" }}>Victim Contact</small>
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
                        Relief request #{asgn.relief_request_id} details loading or archived.
                      </p>
                    )}

                    {/* Volunteer Status Actions */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #E2E8F0", paddingTop: "14px" }}>
                      {isAssigned && (
                        <>
                          <button
                            type="button"
                            className="rc-btn rc-btn-primary rc-btn-sm"
                            onClick={() => handleUpdateAssignmentStatus(asgn.id, "in_progress")}
                            disabled={updatingId === asgn.id}
                          >
                            {updatingId === asgn.id ? "Updating..." : "✅ Accept & Start Task"}
                          </button>
                          <button
                            type="button"
                            className="rc-btn rc-btn-danger rc-btn-sm"
                            onClick={() => handleUpdateAssignmentStatus(asgn.id, "declined")}
                            disabled={updatingId === asgn.id}
                          >
                            {updatingId === asgn.id ? "Updating..." : "✕ Decline Task"}
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
                          {updatingId === asgn.id ? "Updating..." : "🏁 Mark Task Completed"}
                        </button>
                      )}

                      {!isAssigned && !isInProgress && (
                        <span className="text-muted" style={{ fontSize: "13px", alignSelf: "center" }}>
                          Status: {asgn.status} &bull; No pending actions
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default VolunteerDashboard;
