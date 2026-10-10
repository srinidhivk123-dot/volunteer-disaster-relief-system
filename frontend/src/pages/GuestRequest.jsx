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
  const [requestType, setRequestType] = useState("food");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
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
        setErrorMessage("Unable to fetch active disaster records from the server.");
      } finally {
        setLoadingDisasters(false);
      }
    }
    fetchDisasters();
  }, []);

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
          setLocationStatus("Location access permission was denied. You can still enter your address manually.");
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

    if (!disasterId) {
      setErrorMessage("Please select a valid active disaster incident.");
      return;
    }

    const cleanedPhone = phone.trim();
    if (!/^[0-9+() -]{7,15}$/.test(cleanedPhone)) {
      setErrorMessage("Please enter a valid telephone number (7 to 15 digits).");
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
        phone: cleanedPhone,
        latitude: latitude !== null ? Number(latitude) : null,
        longitude: longitude !== null ? Number(longitude) : null,
      };

      const result = await api.createGuestRequest(payload);
      setSuccessData(result);
    } catch (err) {
      console.error("Guest request failed:", err);
      setErrorMessage(err.message || "Failed to submit emergency relief request.");
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
            <h1>Request Emergency Help</h1>
            <p>
              Submit an urgent assistance request directly to the response coordinator. No login is required.
            </p>
          </div>

          <Alert type="info">
            <strong>Important Notice:</strong> ReliefConnect is a volunteer coordination platform. Submitting a request registers your need with local relief teams, but does not guarantee immediate rescue. For critical life-threatening emergencies, also contact official local emergency hotlines.
          </Alert>

          {errorMessage && <Alert type="error" message={errorMessage} onClose={() => setErrorMessage("")} />}

          {successData ? (
            <div className="empty-state" style={{ background: "#F0FDF4", borderColor: "#86EFAC" }}>
              <div className="icon">✅</div>
              <h3 style={{ color: "#166534" }}>Relief Request Registered!</h3>
              <p style={{ color: "#14532D" }}>
                Your request has been recorded under <strong>Request #{successData.id}</strong>. Volunteer coordinators have received your location and contact details.
              </p>
              <div style={{ margin: "20px 0", fontSize: "14px", color: "#166534" }}>
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
                  Submit Another Request
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
              {loadingDisasters ? (
                <div style={{ padding: "16px", textAlign: "center", color: "#64748B" }}>
                  Loading active disasters...
                </div>
              ) : disasters.length === 0 ? (
                <Alert type="warning">
                  There are currently no active disasters registered in the cloud database. Requests must be associated with an active declared disaster event. Please check back later or contact administration.
                </Alert>
              ) : (
                <div className="rc-form-group">
                  <label htmlFor="disaster-select">Active Disaster Event *</label>
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
                  <small>Select the disaster incident affecting your area</small>
                </div>
              )}

              <div className="form-row">
                <div className="rc-form-group">
                  <label htmlFor="request-type">Required Assistance *</label>
                  <select
                    id="request-type"
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                    required
                  >
                    <option value="rescue">Rescue Operations</option>
                    <option value="food">Food Supplies</option>
                    <option value="water">Clean Drinking Water</option>
                    <option value="medical">Medical Assistance</option>
                    <option value="shelter">Emergency Shelter</option>
                    <option value="other">Other Relief Assistance</option>
                  </select>
                </div>

                <div className="rc-form-group">
                  <label htmlFor="request-priority">Urgency Level *</label>
                  <select
                    id="request-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    required
                  >
                    <option value="HIGH">High (Urgent situation)</option>
                    <option value="MEDIUM">Medium (Requires timely response)</option>
                    <option value="LOW">Low (Stable, supplies needed)</option>
                  </select>
                </div>
              </div>

              <div className="rc-form-group">
                <label htmlFor="request-location">Location Address / Landmark *</label>
                <input
                  id="request-location"
                  type="text"
                  placeholder="e.g. 124 Main Road, Near Central Bridge, Ward 4"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              <div className="gps-field-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <strong>GPS Coordinates (Recommended)</strong>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748B" }}>
                      Allows response teams to accurately navigate to your coordinates on the map.
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

                {locationStatus && (
                  <p className="gps-info">{locationStatus}</p>
                )}

                {latitude !== null && longitude !== null && (
                  <div style={{ marginTop: "8px", fontSize: "13px", color: "#1F2937", background: "#ffffff", padding: "8px 12px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                    <strong>Latitude:</strong> {latitude.toFixed(6)} &bull; <strong>Longitude:</strong> {longitude.toFixed(6)}
                  </div>
                )}
              </div>

              <div className="rc-form-group">
                <label htmlFor="request-phone">Contact Phone Number *</label>
                <input
                  id="request-phone"
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={15}
                  required
                />
                <small>Volunteers will use this number to contact you or verify your location</small>
              </div>

              <div className="rc-form-group">
                <label htmlFor="request-desc">Details of Required Assistance *</label>
                <textarea
                  id="request-desc"
                  rows={4}
                  placeholder="Describe your situation, number of people needing assistance, special medical requirements, or any specific hazards..."
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
                  {submitting ? "Submitting Request..." : "Submit Emergency Relief Request"}
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
