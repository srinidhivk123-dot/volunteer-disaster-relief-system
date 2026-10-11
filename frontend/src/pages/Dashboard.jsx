import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import Alert from "../components/Alert";
import { api, getStoredUser } from "../utils/api";

function Dashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [requests, setRequests] = useState([]);
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDisasters, setLoadingDisasters] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = useCallback(async () => {
    if (!user) {
      navigate("/login/victim", { replace: true });
      return;
    }

    if (user.role === "admin") {
      navigate("/admin-dashboard", { replace: true });
      return;
    }

    if (user.role === "volunteer") {
      navigate("/volunteer-dashboard", { replace: true });
      return;
    }

    setLoading(true);
    setLoadingDisasters(true);
    setErrorMsg("");

    try {
      // 1. Fetch victim's requests
      try {
        const reqData = await api.getMyRequests();
        setRequests(Array.isArray(reqData) ? reqData : []);
      } catch (reqErr) {
        console.error("Failed to load my requests:", reqErr);
        setErrorMsg("Unable to load your requests. Please verify your connection.");
      }

      // 2. Fetch active disasters
      try {
        const disData = await api.getActiveDisasters();
        setDisasters(Array.isArray(disData) ? disData : []);
      } catch (disErr) {
        console.error("Failed to load active disasters:", disErr);
      }
    } finally {
      setLoading(false);
      setLoadingDisasters(false);
    }
  }, [navigate, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const inProgressCount = requests.filter((r) => ["assigned", "accepted", "in_progress"].includes(r.status)).length;
  const completedCount = requests.filter((r) => r.status === "completed").length;

  return (
    <div className="victim-dashboard-page">
      <Navbar />

      <main className="dashboard-page">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div>
              <span className="rc-status-badge badge-amber" style={{ marginBottom: "8px" }}>
                Victim Dashboard
              </span>
              <h1>Relief & Assistance Portal</h1>
              <p>Request emergency relief, track assigned teams, and access safety advisories.</p>
            </div>
            <button
              type="button"
              className="rc-btn rc-btn-primary rc-btn-lg"
              onClick={() => navigate("/request-help")}
            >
              🆘 Request Help Now
            </button>
          </div>

          {errorMsg && <Alert type="error" message={errorMsg} onClose={() => setErrorMsg("")} />}

          {/* Quick Metrics */}
          <div className="admin-summary-grid">
            <div className="admin-summary-card stat-teal">
              <h3>Total Requests</h3>
              <p className="stat-number">{loading ? "..." : requests.length}</p>
            </div>
            <div className="admin-summary-card stat-amber">
              <h3>Pending Review</h3>
              <p className="stat-number">{loading ? "..." : pendingCount}</p>
            </div>
            <div className="admin-summary-card stat-teal">
              <h3>In Progress / Assigned</h3>
              <p className="stat-number">{loading ? "..." : inProgressCount}</p>
            </div>
            <div className="admin-summary-card stat-green">
              <h3>Completed Assistance</h3>
              <p className="stat-number">{loading ? "..." : completedCount}</p>
            </div>
          </div>

          {/* Active Disasters Section */}
          <section className="dashboard-card" style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h2>Active Disaster Advisories & Incidents</h2>
                <p className="text-muted" style={{ margin: "4px 0 0", fontSize: "14px" }}>
                  Official active disaster records declared by emergency response teams.
                </p>
              </div>
              <button
                type="button"
                className="rc-btn rc-btn-outline rc-btn-sm"
                onClick={loadData}
                disabled={loadingDisasters}
              >
                🔄 Refresh Disasters
              </button>
            </div>

            {loadingDisasters ? (
              <p className="text-muted" style={{ padding: "20px 0", textAlign: "center" }}>
                Loading active disaster records...
              </p>
            ) : disasters.length === 0 ? (
              <div className="empty-state" style={{ padding: "24px", background: "#F8FAFC", borderRadius: "8px" }}>
                <div className="icon">🛡️</div>
                <h3>No Active Disaster Emergencies Declared</h3>
                <p>
                  There are currently no active disaster alerts declared in the system. You may still submit an emergency relief request if you require urgent assistance.
                </p>
                <button
                  type="button"
                  className="rc-btn rc-btn-primary"
                  onClick={() => navigate("/request-help")}
                  style={{ marginTop: "12px" }}
                >
                  Submit Relief Request
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
                {disasters.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <span className="rc-status-badge badge-teal" style={{ fontSize: "11px" }}>
                          Incident #{d.id}
                        </span>
                        <StatusBadge status={d.status} />
                      </div>
                      <h3 style={{ margin: "0 0 6px 0", fontSize: "17px", color: "#0F172A" }}>{d.name}</h3>
                      <div style={{ fontSize: "13px", color: "#475569", marginBottom: "8px" }}>
                        <strong>Category:</strong> <span style={{ textTransform: "capitalize" }}>{d.disaster_type}</span> &bull; <strong>Area:</strong> {d.location}
                      </div>
                      <p style={{ fontSize: "13px", color: "#64748B", margin: "0 0 12px 0", lineHeight: "1.5" }}>
                        {d.description || "Official response monitoring active for this area."}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rc-btn rc-btn-primary rc-btn-sm"
                      style={{ width: "100%", marginTop: "8px" }}
                      onClick={() => navigate("/request-help", { state: { preselectedDisasterId: d.id } })}
                    >
                      Request Aid in this Area &rarr;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Action Cards */}
          <div className="dashboard-cards" style={{ marginBottom: "28px" }}>
            <div className="dashboard-card">
              <div className="dashboard-card-icon">🆘</div>
              <h2>Request Help</h2>
              <p>Submit emergency requests for food, clean water, medical assistance, rescue, or shelter.</p>
              <button
                type="button"
                className="rc-btn rc-btn-primary"
                onClick={() => navigate("/request-help")}
              >
                Submit Request
              </button>
            </div>

            <div className="dashboard-card">
              <div className="dashboard-card-icon">📋</div>
              <h2>Track My Requests</h2>
              <p>Check the live status of all your submitted assistance requests and volunteer updates.</p>
              <button
                type="button"
                className="rc-btn rc-btn-outline-teal"
                onClick={() => navigate("/my-requests")}
              >
                View Request History
              </button>
            </div>

            <div className="dashboard-card">
              <div className="dashboard-card-icon">📢</div>
              <h2>Public Disaster Advisories</h2>
              <p>View verified disaster warnings, safe zones, and relief center locations in your region.</p>
              <button
                type="button"
                className="rc-btn rc-btn-outline"
                onClick={() => navigate("/disaster-information")}
              >
                View Disasters Hub
              </button>
            </div>
          </div>

          {/* Recent Requests Section */}
          <section className="dashboard-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2>Recent Relief Requests</h2>
              {requests.length > 0 && (
                <button
                  type="button"
                  className="rc-btn rc-btn-outline rc-btn-sm"
                  onClick={() => navigate("/my-requests")}
                >
                  View All ({requests.length}) →
                </button>
              )}
            </div>

            {loading ? (
              <p className="text-muted" style={{ padding: "24px 0", textAlign: "center" }}>
                Loading your requests...
              </p>
            ) : requests.length === 0 ? (
              <div className="empty-state">
                <div className="icon">📋</div>
                <h3>No Active Relief Requests</h3>
                <p>You haven't submitted any assistance requests yet. If you need supplies, shelter, or rescue, submit a request now.</p>
                <button
                  type="button"
                  className="rc-btn rc-btn-primary"
                  onClick={() => navigate("/request-help")}
                >
                  Submit Your First Request
                </button>
              </div>
            ) : (
              <div className="rc-table-container">
                <table className="rc-table">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Category</th>
                      <th>Priority</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>GPS Recorded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.slice(0, 5).map((req) => (
                      <tr key={req.id}>
                        <td><strong>#{req.id}</strong></td>
                        <td style={{ textTransform: "capitalize" }}>{req.request_type}</td>
                        <td>
                          <StatusBadge status={req.priority} type="priority" />
                        </td>
                        <td>{req.location}</td>
                        <td>
                          <StatusBadge status={req.status} />
                        </td>
                        <td>{req.latitude != null ? "📍 Yes" : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;