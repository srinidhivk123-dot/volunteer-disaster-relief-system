import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Alert from "../components/Alert";
import { api, getStoredUser } from "../utils/api";

function RequestHelp() {
  const navigate = useNavigate();
  const navLocation = useLocation();
  const user = getStoredUser();

  const [disasters, setDisasters] = useState([]);
  const [loadingDisasters, setLoadingDisasters] = useState(true);
  const [disasterId, setDisasterId] = useState(navLocation.state?.preselectedDisasterId ? String(navLocation.state.preselectedDisasterId) : "");
  const [requestType, setRequestType] = useState("rescue");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("HIGH");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [locationStatus, setLocationStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
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

    async function fetchDisasters() {
      setLoadingDisasters(true);
      try {
        const data = await api.getActiveDisasters();
        const activeList = Array.isArray(data) ? data : [];
        setDisasters(activeList);
        if (!disasterId && activeList.length > 0) {
          setDisasterId(String(activeList[0].id));
        }
      } catch (err) {
        console.error("Failed to load active disasters:", err);
      } finally {
        setLoadingDisasters(false);
      }
    }
    fetchDisasters();
  }, [navigate, user, disasterId]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by your browser. Please enter your location manually.");
      return;
    }

    setLocationStatus("Detecting your current GPS coordinates...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationStatus("📍 GPS coordinates captured successfully.");
      },
      (error) => {
        console.warn("Geolocation error:", error);
        if (error.code === 1) {
          setLocationStatus("Location access permission was denied. You can enter your location manually below.");
        } else if (error.code === 2) {
          setLocationStatus("Location information is currently unavailable.");
        } else {
          setLocationStatus("Timed out trying to detect GPS location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setErrorMessage("");

    if (!description.trim()) {
      setErrorMessage("Please describe the assistance you need.");
      return;
    }

    setSubmitting(true);

    try {
      const derivedLocation = location.trim()
        ? location.trim()
        : latitude !== null && longitude !== null
        ? `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
        : "Location not specified";

      const payload = {
        disaster_id: disasterId ? Number(disasterId) : null,
        request_type: requestType,
        description: description.trim(),
        location: derivedLocation,
        priority,
        request_source: "victim",
        latitude: latitude !== null ? Number(latitude) : null,
        longitude: longitude !== null ? Number(longitude) : null,
      };

      const result = await api.createVictimRequest(payload);
      setSuccessData(result);
    } catch (err) {
      console.error("Relief request creation failed:", err);
      setErrorMessage(err.message || "Failed to submit relief request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="request-help-page">
      <Navbar />

      <div className="request-page">
        <div className="request-card">
          <div className="request-header">
            <span className="rc-status-badge badge-teal" style={{ marginBottom: "12px" }}>
              Registered Relief Recipient
            </span>
            <h1>Submit Relief Request</h1>
            <p>
              Submit your needed emergency supplies or rescue details. Coordination officers will prioritize response teams based on urgency and location.
            </p>
          </div>

          {errorMessage && <Alert type="error" message={errorMessage} onClose={() => setErrorMessage("")} />}

          {successData ? (
            <div className="empty-state" style={{ background: "#F0FDF4", borderColor: "#86EFAC" }}>
              <div className="icon">✅</div>
              <h3 style={{ color: "#166534" }}>Relief Request Registered!</h3>
              <p style={{ color: "#14532D" }}>
                Your relief request has been recorded under <strong>Request #{successData.id}</strong>. You can track progress and volunteer updates on your dashboard.
              </p>
              <div style={{ margin: "20px 0", fontSize: "14px", color: "#166534" }}>
                <p><strong>Reference Number:</strong> #{successData.id}</p>
                <p><strong>Category:</strong> {successData.request_type}</p>
                <p><strong>Location:</strong> {successData.location}</p>
                <p><strong>Status:</strong> {successData.status}</p>
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "20px" }}>
                <button
                  type="button"
                  className="rc-btn rc-btn-primary"
                  onClick={() => navigate("/my-requests")}
                >
                  Track My Requests
                </button>
                <button
                  type="button"
                  className="rc-btn rc-btn-outline"
                  onClick={() => {
                    setSuccessData(null);
                    setDescription("");
                    setLocation("");
                    setLatitude(null);
                    setLongitude(null);
                    setLocationStatus("");
                  }}
                >
                  Submit Another Request
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Active Disaster Selection */}
              {loadingDisasters ? (
                <div style={{ padding: "12px", textAlign: "center", color: "#64748B" }}>
                  Loading active disaster information...
                </div>
              ) : disasters.length === 0 ? (
                <Alert type="info">
                  <strong>No Active Disasters Cataloged:</strong> There are currently no active disaster declarations registered in the system. You may still submit your emergency relief request directly, and response teams will assist you.
                </Alert>
              ) : (
                <div className="rc-form-group">
                  <label htmlFor="disaster-select">Associated Active Disaster</label>
                  <select
                    id="disaster-select"
                    value={disasterId}
                    onChange={(e) => setDisasterId(e.target.value)}
                  >
                    <option value="">General Emergency (No specific incident)</option>
                    {disasters.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.disaster_type} - {d.location})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Assistance Category & Urgency */}
              <div className="form-row">
                <div className="rc-form-group">
                  <label htmlFor="req-type">Required Category *</label>
                  <select
                    id="req-type"
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                    required
                  >
                    <option value="rescue">Search & Rescue Operations</option>
                    <option value="medical">Medical Assistance & Supplies</option>
                    <option value="food">Food Supplies</option>
                    <option value="water">Clean Drinking Water</option>
                    <option value="shelter">Emergency Shelter</option>
                    <option value="other">Other Relief Assistance</option>
                  </select>
                </div>

                <div className="rc-form-group">
                  <label htmlFor="req-priority">Urgency Priority *</label>
                  <select
                    id="req-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    required
                  >
                    <option value="HIGH">High (Urgent Emergency)</option>
                    <option value="MEDIUM">Medium (Within 24 Hours)</option>
                    <option value="LOW">Low (Basic Needs / Stable)</option>
                  </select>
                </div>
              </div>

              {/* Description of help needed - Required */}
              <div className="rc-form-group">
                <label htmlFor="req-description">Description of Assistance Needed *</label>
                <textarea
                  id="req-description"
                  rows={4}
                  placeholder="Describe your situation, number of people needing assistance, special medical requirements, or specific hazards..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* Location Address */}
              <div className="rc-form-group">
                <label htmlFor="req-location">Current Location Address / Landmark</label>
                <input
                  id="req-location"
                  type="text"
                  placeholder="Enter street name, landmark, camp number, or village name"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <small>Helps volunteers navigate directly to your location.</small>
              </div>

              {/* Optional GPS Location Capture */}
              <div className="gps-field-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <strong>GPS Coordinates (Optional)</strong>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748B" }}>
                      Helps field volunteers locate you directly on the coordination map.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rc-btn rc-btn-outline-teal rc-btn-sm"
                    onClick={getCurrentLocation}
                  >
                    📍 Use My Current Location
                  </button>
                </div>

                {locationStatus && <p className="gps-info">{locationStatus}</p>}

                {latitude !== null && longitude !== null && (
                  <div style={{ marginTop: "8px", fontSize: "13px", color: "#1F2937", background: "#ffffff", padding: "8px 12px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                    <strong>Latitude:</strong> {latitude.toFixed(6)} &bull; <strong>Longitude:</strong> {longitude.toFixed(6)}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button
                  type="submit"
                  className="rc-btn rc-btn-primary"
                  style={{ flex: 1 }}
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Relief Request"}
                </button>
                <button
                  type="button"
                  className="rc-btn rc-btn-outline"
                  onClick={() => navigate("/dashboard")}
                  disabled={submitting}
                >
                  Back to Dashboard
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default RequestHelp;
