import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Alert from "../components/Alert";
import { api, getStoredUser } from "../utils/api";

function RequestHelp() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [disasters, setDisasters] = useState([]);
  const [loadingDisasters, setLoadingDisasters] = useState(true);
  const [disasterId, setDisasterId] = useState("");
  const [requestType, setRequestType] = useState("food");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [locationStatus, setLocationStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    async function fetchDisasters() {
      setLoadingDisasters(true);
      try {
        const data = await api.getActiveDisasters();
        const activeList = Array.isArray(data) ? data : [];
        setDisasters(activeList);
        if (activeList.length > 0) {
          setDisasterId(String(activeList[0].id));
        }
      } catch (err) {
        console.error("Failed to load active disasters:", err);
        setErrorMessage("Unable to fetch active disaster records from the server.");
      } finally {
        setLoadingDisasters(false);
      }
    }
    fetchDisasters();
  }, [navigate, user]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by your browser.");
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
          setLocationStatus("Location access permission was denied. Enter your location manually.");
        } else if (error.code === 2) {
          setLocationStatus("Location information is currently unavailable.");
        } else {
          setLocationStatus("Unable to determine current GPS location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setErrorMessage("");

    if (!disasterId) {
      setErrorMessage("Please select an active disaster incident.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        disaster_id: Number(disasterId),
        request_type: requestType,
        description: description.trim(),
        location: location.trim(),
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
              Registered Victim Portal
            </span>
            <h1>Submit Relief Request</h1>
            <p>
              Submit your required emergency supplies or assistance details. Response teams will prioritize your request based on urgency and location.
            </p>
          </div>

          {errorMessage && <Alert type="error" message={errorMessage} onClose={() => setErrorMessage("")} />}

          {successData ? (
            <div className="empty-state" style={{ background: "#F0FDF4", borderColor: "#86EFAC" }}>
              <div className="icon">✅</div>
              <h3 style={{ color: "#166534" }}>Request Submitted Successfully!</h3>
              <p style={{ color: "#14532D" }}>
                Your relief request is registered under <strong>Request #{successData.id}</strong>. You can monitor volunteer assignment status on your dashboard.
              </p>
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
              {loadingDisasters ? (
                <div style={{ padding: "16px", textAlign: "center", color: "#64748B" }}>
                  Loading active disasters...
                </div>
              ) : disasters.length === 0 ? (
                <Alert type="warning">
                  There are currently no active declared disasters in the system. Relief requests require an active disaster record. Please check back later.
                </Alert>
              ) : (
                <div className="rc-form-group">
                  <label htmlFor="disaster-select">Associated Active Disaster *</label>
                  <select
                    id="disaster-select"
                    value={disasterId}
                    onChange={(e) => setDisasterId(e.target.value)}
                    required
                  >
                    {disasters.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.disaster_type} - {d.location})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-row">
                <div className="rc-form-group">
                  <label htmlFor="req-type">Required Category *</label>
                  <select
                    id="req-type"
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                    required
                  >
                    <option value="rescue">Rescue Operations</option>
                    <option value="food">Food Supplies</option>
                    <option value="water">Clean Water</option>
                    <option value="medical">Medical Assistance</option>
                    <option value="shelter">Emergency Shelter</option>
                    <option value="other">Other Assistance</option>
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
                    <option value="HIGH">High (Urgent emergency)</option>
                    <option value="MEDIUM">Medium (Within 24 hours)</option>
                    <option value="LOW">Low (Stable, basic needs)</option>
                  </select>
                </div>
              </div>

              <div className="rc-form-group">
                <label htmlFor="req-location">Current Location Address *</label>
                <input
                  id="req-location"
                  type="text"
                  placeholder="Enter detailed street, landmark, or village name"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              <div className="gps-field-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <strong>GPS Coordinates</strong>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748B" }}>
                      Helps field volunteers locate you directly on the coordination map.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rc-btn rc-btn-outline-teal rc-btn-sm"
                    onClick={getCurrentLocation}
                  >
                    📍 Capture Current GPS
                  </button>
                </div>

                {locationStatus && <p className="gps-info">{locationStatus}</p>}

                {latitude !== null && longitude !== null && (
                  <div style={{ marginTop: "8px", fontSize: "13px", color: "#1F2937", background: "#ffffff", padding: "8px 12px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                    <strong>Latitude:</strong> {latitude.toFixed(6)} &bull; <strong>Longitude:</strong> {longitude.toFixed(6)}
                  </div>
                )}
              </div>

              <div className="rc-form-group">
                <label htmlFor="req-description">Description of Assistance Needed *</label>
                <textarea
                  id="req-description"
                  rows={4}
                  placeholder="State the number of family members, specific medicine required, water shortage details, or accessibility constraints..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button
                  type="submit"
                  className="rc-btn rc-btn-primary"
                  style={{ flex: 1 }}
                  disabled={submitting || (disasters.length === 0 && !loadingDisasters)}
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
