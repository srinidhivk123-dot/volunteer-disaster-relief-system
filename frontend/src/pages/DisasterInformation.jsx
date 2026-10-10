import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import Alert from "../components/Alert";
import { api, getStoredUser } from "../utils/api";

function DisasterInformation() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadDisasters = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await api.getActiveDisasters();
      setDisasters(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Disasters fetch error:", err);
      setErrorMessage(err.message || "Unable to load active disaster records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    api.getActiveDisasters()
      .then((data) => {
        if (isMounted) {
          setDisasters(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Disasters fetch error:", err);
          setErrorMessage(err.message || "Unable to load active disaster records.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="disaster-info-page">
      <Navbar />

      <main className="dashboard-page">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div>
              <span className="rc-status-badge badge-critical" style={{ marginBottom: "8px" }}>
                Public Safety Advisory
              </span>
              <h1>Active Disaster Information & Relief Hubs</h1>
              <p>Official alerts, affected areas, and active disaster operations coordinated by relief authorities.</p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="rc-btn rc-btn-primary"
                onClick={() => navigate(user ? "/request-help" : "/guest-request")}
              >
                🆘 Request Help
              </button>
              <button
                type="button"
                className="rc-btn rc-btn-outline"
                onClick={loadDisasters}
                disabled={loading}
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          <Alert type="info">
            <strong>Advisory:</strong> All records below represent official disaster declarations recorded in the system. If you are located within an impacted area, follow local civil defense instructions and locate the nearest high ground or relief hub.
          </Alert>

          {errorMessage && <Alert type="error" message={errorMessage} onClose={() => setErrorMessage("")} />}

          {loading ? (
            <div className="dashboard-card" style={{ textAlign: "center", padding: "48px" }}>
              <p className="text-muted">Fetching latest active disaster information from emergency registry...</p>
            </div>
          ) : disasters.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🛡️</div>
              <h3>No Active Disaster Emergencies Declared</h3>
              <p>
                There are currently no active disaster alerts recorded in the system database. Normal emergency monitoring remains active.
              </p>
              <button
                type="button"
                className="rc-btn rc-btn-outline"
                onClick={() => navigate(user ? "/dashboard" : "/")}
              >
                Return to {user ? "Dashboard" : "Home"}
              </button>
            </div>
          ) : (
            <div className="dashboard-cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
              {disasters.map((disaster) => (
                <div key={disaster.id} className="dashboard-card" style={{ marginBottom: "0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", gap: "10px" }}>
                    <div>
                      <span className="rc-status-badge badge-teal" style={{ marginBottom: "6px" }}>
                        Incident #{disaster.id}
                      </span>
                      <h2 style={{ margin: "4px 0 0", fontSize: "20px" }}>{disaster.name}</h2>
                    </div>
                    <StatusBadge status={disaster.status} />
                  </div>

                  <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: "6px", border: "1px solid #E2E8F0", margin: "8px 0 16px", fontSize: "13px" }}>
                    <div style={{ marginBottom: "4px" }}>
                      <strong>Disaster Type:</strong> <span style={{ textTransform: "capitalize" }}>{disaster.disaster_type}</span>
                    </div>
                    <div>
                      <strong>Impact Area:</strong> {disaster.location}
                    </div>
                  </div>

                  <p style={{ color: "#475569", lineHeight: "1.6", flex: 1, margin: "0 0 16px 0" }}>
                    {disaster.description || "No specific guidance notes published for this event."}
                  </p>

                  <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <small className="text-muted">Official Relief Mission</small>
                    <button
                      type="button"
                      className="rc-btn rc-btn-outline-teal rc-btn-sm"
                      onClick={() => navigate(user ? "/request-help" : "/guest-request")}
                    >
                      Request Aid in this Area →
                    </button>
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

export default DisasterInformation;
