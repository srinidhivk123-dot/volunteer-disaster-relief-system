import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import Alert from "../components/Alert";
import ReliefRequestMap from "../components/ReliefRequestMap";
import { api, getStoredUser } from "../utils/api";

function MyRequests() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [expandedMapId, setExpandedMapId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await api.getMyRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load requests:", err);
      setErrorMessage(err.message || "Unable to load requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    let isMounted = true;
    api.getMyRequests()
      .then((data) => {
        if (isMounted) {
          setRequests(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to load requests:", err);
          setErrorMessage(err.message || "Unable to load requests.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [navigate, user]);

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm(`Are you sure you want to cancel Relief Request #${requestId}?`)) {
      return;
    }

    setCancellingId(requestId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await api.updateRequestStatus(requestId, "cancelled");
      setSuccessMessage(`Request #${requestId} has been successfully cancelled.`);
      await fetchRequests();
    } catch (err) {
      console.error("Cancellation error:", err);
      setErrorMessage(err.message || "Failed to cancel request.");
    } finally {
      setCancellingId(null);
    }
  };

  const filteredRequests = filter === "all"
    ? requests
    : requests.filter((r) => r.status?.toLowerCase() === filter);

  return (
    <div className="my-requests-page">
      <Navbar />

      <main className="dashboard-page">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div>
              <span className="rc-status-badge badge-teal" style={{ marginBottom: "8px" }}>
                Request Tracking
              </span>
              <h1>My Relief Requests</h1>
              <p>Review all your submitted assistance requests and their active fulfillment status.</p>
            </div>
            <button
              type="button"
              className="rc-btn rc-btn-primary"
              onClick={() => navigate("/request-help")}
            >
              + Submit New Request
            </button>
          </div>

          {errorMessage && <Alert type="error" message={errorMessage} onClose={() => setErrorMessage("")} />}
          {successMessage && <Alert type="success" message={successMessage} onClose={() => setSuccessMessage("")} />}

          {/* Filter Toolbar */}
          <div className="admin-toolbar">
            <div className="toolbar-filters">
              <label htmlFor="status-filter" style={{ fontSize: "14px", fontWeight: "600", color: "#17324D" }}>
                Filter Status:
              </label>
              <select
                id="status-filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #E2E8F0" }}
              >
                <option value="all">All Requests ({requests.length})</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <button
              type="button"
              className="rc-btn rc-btn-outline rc-btn-sm"
              onClick={fetchRequests}
            >
              🔄 Refresh List
            </button>
          </div>

          {loading ? (
            <div className="dashboard-card" style={{ textAlign: "center", padding: "48px" }}>
              <p className="text-muted">Loading your requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📂</div>
              <h3>No Requests Found</h3>
              <p>
                {filter === "all"
                  ? "You haven't submitted any emergency relief requests yet."
                  : `No requests currently match the "${filter}" filter.`}
              </p>
              {filter === "all" && (
                <button
                  type="button"
                  className="rc-btn rc-btn-primary"
                  onClick={() => navigate("/request-help")}
                >
                  Create Relief Request
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {filteredRequests.map((req) => (
                <div key={req.id} className="dashboard-card" style={{ marginBottom: "0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid #E2E8F0", paddingBottom: "14px", marginBottom: "16px" }}>
                    <div>
                      <h2 style={{ margin: "0 0 4px 0", fontSize: "18px" }}>
                        Relief Request #{req.id}
                      </h2>
                      <span className="text-muted" style={{ fontSize: "13px" }}>
                        Category: <strong style={{ textTransform: "capitalize", color: "#17324D" }}>{req.request_type}</strong> &bull; Source: {req.request_source}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <StatusBadge status={req.priority} type="priority" />
                      <StatusBadge status={req.status} />
                    </div>
                  </div>

                  <p style={{ margin: "0 0 16px 0", color: "#1F2937", lineHeight: "1.6" }}>
                    {req.description}
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", background: "#F8FAFC", padding: "12px 16px", borderRadius: "8px", border: "1px solid #E2E8F0", marginBottom: "16px" }}>
                    <div>
                      <small className="text-muted" style={{ display: "block" }}>Location</small>
                      <strong>{req.location}</strong>
                    </div>
                    {req.phone && (
                      <div>
                        <small className="text-muted" style={{ display: "block" }}>Contact Number</small>
                        <strong>{req.phone}</strong>
                      </div>
                    )}
                    <div>
                      <small className="text-muted" style={{ display: "block" }}>GPS Coordinates</small>
                      <strong>
                        {req.latitude != null && req.longitude != null
                          ? `${Number(req.latitude).toFixed(5)}, ${Number(req.longitude).toFixed(5)}`
                          : "Not recorded"}
                      </strong>
                    </div>
                  </div>

                  {/* Optional Map Toggle */}
                  {req.latitude != null && req.longitude != null && (
                    <div style={{ marginBottom: "16px" }}>
                      <button
                        type="button"
                        className="rc-btn rc-btn-outline rc-btn-sm"
                        onClick={() => setExpandedMapId(expandedMapId === req.id ? null : req.id)}
                      >
                        {expandedMapId === req.id ? "Hide Map" : "📍 View Location on Map"}
                      </button>

                      {expandedMapId === req.id && (
                        <div style={{ marginTop: "12px" }}>
                          <ReliefRequestMap
                            latitude={req.latitude}
                            longitude={req.longitude}
                            requestId={req.id}
                            location={req.location}
                            height="280px"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #E2E8F0", paddingTop: "14px" }}>
                    {["pending", "assigned"].includes(req.status?.toLowerCase()) && (
                      <button
                        type="button"
                        className="rc-btn rc-btn-danger rc-btn-sm"
                        onClick={() => handleCancelRequest(req.id)}
                        disabled={cancellingId === req.id}
                      >
                        {cancellingId === req.id ? "Cancelling..." : "Cancel Request"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default MyRequests;
