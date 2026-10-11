import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Alert from "../components/Alert";
import { api } from "../utils/api";

function GuestRequest() {
  const navigate = useNavigate();

  const [disasters, setDisasters] = useState([]);
  const [loadingDisasters, setLoadingDisasters] = useState(true);
  const [disasterId, setDisasterId] = useState("");
  const [requestType, setRequestType] = useState("rescue");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("HIGH");
  const [phone, setPhone] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [locationStatus, setLocationStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
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
      } finally {
        setLoadingDisasters(false);
      }
    }
    fetchDisasters();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by your browser. The emergency description below is sufficient.");
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
          setLocationStatus("Location access permission was denied. You can still submit your emergency request with the description below.");
        } else if (error.code === 2) {
          setLocationStatus("Location information is currently unavailable. You can proceed with the emergency description below.");
        } else {
          setLocationStatus("GPS detection timed out. You can proceed with the emergency description below.");
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
      setErrorMessage("Please provide a description of the emergency.");
      return;
    }

    const cleanedPhone = phone.trim();
    if (cleanedPhone && !/^[0-9+() -]{7,15}$/.test(cleanedPhone)) {
      setErrorMessage("Please enter a valid telephone number (7 to 15 digits) or leave it blank.");
      return;
    }

    setSubmitting(true);

    try {
      const derivedLocation = location.trim()
        ? location.trim()
        : latitude !== null && longitude !== null
        ? `GPS Coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
        : "Emergency Location (See description)";

      const payload = {
        disaster_id: disasterId ? Number(disasterId) : null,
        request_type: requestType || "rescue",
        description: description.trim(),
        location: derivedLocation,
        priority: priority || "HIGH",
        phone: cleanedPhone || null,
        latitude: latitude !== null ? Number(latitude) : null,
        longitude: longitude !== null ? Number(longitude) : null,
      };

      const result = await api.createGuestRequest(payload);
      if (!result || !result.id) {
        throw new Error("Failed to obtain request reference ID from server.");
      }
      setSuccessData(result);
    } catch (err) {
      console.error("Guest request failed:", err);
      setErrorMessage(err.message || "Failed to submit emergency relief request. Please try again or call emergency services.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccessData(null);
    setDescription("");
    setLocation("");
    setPhone("");
    setLatitude(null);
    setLongitude(null);
    setLocationStatus("");
    setErrorMessage("");
  };

  return (
    <div className="guest-request-page">
      <Navbar />

      <div className="request-page">
        <div className="request-card">
          <div className="request-header">
            <span className="rc-status-badge badge-critical" style={{ marginBottom: "12px" }}>
              Public Emergency Submission
            </span>
            <h1>Emergency Help Request</h1>
            <p>
              Submit an immediate assistance request directly to emergency coordinators. No registration or login is required.
            </p>
          </div>

          <Alert type="info">
            <strong>Urgent Safety Notice:</strong> Submitting here notifies relief teams. For life-threatening emergencies, also attempt to contact official national emergency hotlines.
          </Alert>

          {errorMessage && <Alert type="error" message={errorMessage} onClose={() => setErrorMessage("")} />}

          {successData ? (
            <div className="empty-state" style={{ background: "#F0FDF4", borderColor: "#86EFAC" }}>
              <div className="icon">✅</div>
              <h3 style={{ color: "#166534" }}>Emergency Request Recorded!</h3>
              <p style={{ color: "#14532D" }}>
                Your request reference ID is <strong>Request #{successData.id}</strong>. Volunteer coordinators have received your notification and will prioritize assistance.
              </p>
              <div style={{ margin: "20px 0", fontSize: "14px", color: "#166534" }}>
                <p><strong>Reference Number:</strong> #{successData.id}</p>
                <p><strong>Category:</strong> {successData.request_type}</p>
                <p><strong>Location:</strong> {successData.location}</p>
                <p><strong>Status:</strong> {successData.status}</p>
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button
                  type="button"
                  className="rc-btn rc-btn-primary"
                  onClick={handleReset}
                >
                  Submit Another Emergency Request
                </button>
                <button
                  type="button"
                  className="rc-btn rc-btn-outline"
                  onClick={() => navigate("/")}
                >
                  Return Home
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Emergency Description - Required */}
              <div className="rc-form-group">
                <label htmlFor="request-desc">Description of the Emergency *</label>
                <textarea
                  id="request-desc"
                  rows={4}
                  placeholder="Describe what emergency assistance is needed, number of people affected, immediate hazards, or urgent medical needs..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* GPS Location - Optional with Button */}
              <div className="gps-field-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <strong>GPS Location (Optional)</strong>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748B" }}>
                      Allows response teams to accurately navigate to your exact position on the map.
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

                {locationStatus && (
                  <p className="gps-info">{locationStatus}</p>
                )}

                {latitude !== null && longitude !== null && (
                  <div style={{ marginTop: "8px", fontSize: "13px", color: "#1F2937", background: "#ffffff", padding: "8px 12px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                    <strong>Latitude:</strong> {latitude.toFixed(6)} &bull; <strong>Longitude:</strong> {longitude.toFixed(6)}
                  </div>
                )}
              </div>

              {/* Location Address - Optional */}
              <div className="rc-form-group">
                <label htmlFor="request-location">Location Address / Landmark (Optional)</label>
                <input
                  id="request-location"
                  type="text"
                  placeholder="e.g. Near Central Bridge, Main Street, Ward 4"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <small>If GPS is unavailable, please provide your nearest street, landmark, or town name.</small>
              </div>

              {/* Contact Phone - Optional */}
              <div className="rc-form-group">
                <label htmlFor="request-phone">Contact Phone Number (Optional)</label>
                <input
                  id="request-phone"
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={15}
                  autoComplete="tel"
                />
                <small>Volunteers will use this number if they need to call you for directions.</small>
              </div>

              {/* Disaster selection - Optional, does not block */}
              {disasters.length > 0 && (
                <div className="rc-form-group">
                  <label htmlFor="disaster-select">Associated Active Disaster (Optional)</label>
                  <select
                    id="disaster-select"
                    value={disasterId}
                    onChange={(e) => setDisasterId(e.target.value)}
                  >
                    <option value="">General Emergency (Not specific to declared event)</option>
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
                  <label htmlFor="request-type">Type of Assistance</label>
                  <select
                    id="request-type"
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                  >
                    <option value="rescue">Search & Rescue Operations</option>
                    <option value="medical">Medical Assistance / First Aid</option>
                    <option value="food">Food Supplies</option>
                    <option value="water">Clean Drinking Water</option>
                    <option value="shelter">Emergency Shelter</option>
                    <option value="other">Other Relief Assistance</option>
                  </select>
                </div>

                <div className="rc-form-group">
                  <label htmlFor="request-priority">Urgency Level</label>
                  <select
                    id="request-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="HIGH">High (Urgent Emergency)</option>
                    <option value="MEDIUM">Medium (Timely Help Needed)</option>
                    <option value="LOW">Low (Supplies / Stable)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button
                  type="submit"
                  className="rc-btn rc-btn-primary"
                  style={{ flex: 1 }}
                  disabled={submitting}
                >
                  {submitting ? "Submitting Request..." : "🆘 Submit Emergency Help Request"}
                </button>
                <button
                  type="button"
                  className="rc-btn rc-btn-outline"
                  onClick={() => navigate("/")}
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

export default GuestRequest;
