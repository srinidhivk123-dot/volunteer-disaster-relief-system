import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Alert from "../components/Alert";
import { api, getStoredUser } from "../utils/api";

function AssistedRequest() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [disasters, setDisasters] = useState([]);
  const [loadingDisasters, setLoadingDisasters] = useState(true);
  const [victimId, setVictimId] = useState("");
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
    if (!user || (user.role !== "volunteer" && user.role !== "admin")) {
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
        setErrorMessage("Unable to fetch active disaster records.");
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

    setLocationStatus("Detecting current coordinates...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationStatus("📍 GPS coordinates captured.");
      },
      (error) => {
        console.warn("Geolocation error:", error);
        setLocationStatus("Unable to determine GPS location.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setErrorMessage("");

    if (!victimId || isNaN(victimId)) {
      setErrorMessage("Please enter a valid Victim User ID.");
      return;
    }

    if (!disasterId) {
      setErrorMessage("Please select an active disaster event.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        victim_id: Number(victimId),
        disaster_id: Number(disasterId),
        request_type: requestType,
        description: description.trim(),
        location: location.trim(),
        priority,
        latitude: latitude !== null ? Number(latitude) : null,
        longitude: longitude !== null ? Number(longitude) : null,
      };

      const result = await api.createAssistedRequest(payload);
      setSuccessData(result);
    } catch (err) {
      console.error("Assisted request error:", err);
      setErrorMessage(err.message || "Failed to create assisted relief request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="assisted-request-page">
      <Navbar />

      <div className="request-page">
        <div className="request-card">
          <div className="request-header">
            <span className="rc-status-badge badge-teal" style={{ marginBottom: "12px" }}>
              Field Volunteer Action
            </span>
            <h1>Assisted Relief Submission</h1>
            <p>
              Submit an official relief request on behalf of a victim who cannot access the portal directly.
            </p>
          </div>

          {errorMessage && <Alert type="error" message={errorMessage} onClose={() => setErrorMessage("")} />}

          {successData ? (
            <div className="empty-state" style={{ background: "#F0FDF4", borderColor: "#86EFAC" }}>
              <div className="icon">✅</div>
              <h3 style={{ color: "#166534" }}>Assisted Request Created!</h3>
              <p style={{ color: "#14532D" }}>
                Relief Request <strong>#{successData.id}</strong> has been created on behalf of Victim User #{successData.victim_id}.
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "20px" }}>
                <button
                  type="button"
                  className="rc-btn rc-btn-primary"
                  onClick={() => navigate("/volunteer-dashboard")}
                >
                  Return to Volunteer Dashboard
                </button>
                <button
                  type="button"
                  className="rc-btn rc-btn-outline"
                  onClick={() => {
                    setSuccessData(null);
                    setVictimId("");
                    setDescription("");
                    setLocation("");
                    setLatitude(null);
                    setLongitude(null);
                    setLocationStatus("");
                  }}
                >
                  Submit Another
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="rc-form-group">
                  <label htmlFor="assisted-victim-id">Victim User ID *</label>
                  <input
                    id="assisted-victim-id"
                    type="number"
                    placeholder="e.g. 5"
                    min="1"
                    value={victimId}
                    onChange={(e) => setVictimId(e.target.value)}
                    required
                  />
                  <small>System User ID of the victim record</small>
                </div>

                <div className="rc-form-group">
                  <label htmlFor="assisted-disaster">Associated Disaster *</label>
                  {loadingDisasters ? (
                    <select disabled><option>Loading active disasters...</option></select>
                  ) : disasters.length === 0 ? (
                    <select disabled><option>No active disasters available</option></select>
                  ) : (
                    <select
                      id="assisted-disaster"
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
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="rc-form-group">
                  <label htmlFor="assisted-category">Assistance Category *</label>
                  <select
                    id="assisted-category"
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
                  <label htmlFor="assisted-priority">Urgency Priority *</label>
                  <select
                    id="assisted-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    required
                  >
                    <option value="HIGH">High (Urgent situation)</option>
                    <option value="MEDIUM">Medium (Requires timely response)</option>
                    <option value="LOW">Low (Stable, basic needs)</option>
                  </select>
                </div>
              </div>

              <div className="rc-form-group">
                <label htmlFor="assisted-location">Victim's Location Address *</label>
                <input
                  id="assisted-location"
                  type="text"
                  placeholder="Address or physical location where victim is waiting"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              <div className="gps-field-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <strong>Record Current GPS Location</strong>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748B" }}>
                      Use if you are currently at the scene with the victim.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rc-btn rc-btn-outline-teal rc-btn-sm"
                    onClick={getCurrentLocation}
                  >
                    📍 Capture My GPS
                  </button>
                </div>

                {locationStatus && <p className="gps-info">{locationStatus}</p>}

                {latitude !== null && longitude !== null && (
                  <div style={{ marginTop: "8px", fontSize: "13px", color: "#1F2937" }}>
                    <strong>Latitude:</strong> {latitude.toFixed(6)} &bull; <strong>Longitude:</strong> {longitude.toFixed(6)}
                  </div>
                )}
              </div>

              <div className="rc-form-group">
                <label htmlFor="assisted-desc">Description of Relief Requirements *</label>
                <textarea
                  id="assisted-desc"
                  rows={4}
                  placeholder="Details of victim condition, supplies required, or immediate dangers..."
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
                  {submitting ? "Submitting..." : "Submit Assisted Request"}
                </button>
                <button
                  type="button"
                  className="rc-btn rc-btn-outline"
                  onClick={() => navigate("/volunteer-dashboard")}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default AssistedRequest;
