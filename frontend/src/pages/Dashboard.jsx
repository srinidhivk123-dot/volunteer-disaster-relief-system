import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import Alert from "../components/Alert";
import { api, getStoredUser } from "../utils/api";

function Dashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
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

    async function fetchMyRequests() {
      try {
        setLoading(true);
        const data = await api.getMyRequests();
        setRequests(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load requests:", err);
        setErrorMsg("Unable to load your relief requests from the server.");
      } finally {
        setLoading(false);
      }
    }

    fetchMyRequests();
  }, [navigate, user]);

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const inProgressCount = requests.filter((r) => ["assigned", "in_progress"].includes(r.status)).length;
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
              <p>Request emergency relief, track assigned teams, and access safety information.</p>
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

          {/* Action Cards */}
          <div className="dashboard-cards">
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
              <h2>Active Disasters</h2>
              <p>View verified disaster warnings, safe zones, and relief center locations in your region.</p>
              <button
                type="button"
                className="rc-btn rc-btn-outline"
                onClick={() => navigate("/disaster-information")}
              >
                View Disasters
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