import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function RequestHelp() {
  const navigate = useNavigate();

  const [disasterId, setDisasterId] = useState("1");
  const [requestType, setRequestType] = useState("food");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("Submitting request...");

    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/relief-requests/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            disaster_id: Number(disasterId),
            request_type: requestType,
            description: description,
            location: location,
            priority: priority,
            request_source: "victim",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Failed to submit request.");
        return;
      }

      setMessage(
        `Request submitted successfully! Request ID: ${data.id}`
      );

      setDescription("");
      setLocation("");
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to the backend.");
    }
  };

  return (
    <div className="request-page">
      <div className="request-card">

        <button
          className="back-button"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>

        <div className="request-header">
          <p className="section-label">
            EMERGENCY ASSISTANCE
          </p>

          <h1>Request Help</h1>

          <p>
            Submit your requirements and location so that
            relief teams can coordinate assistance.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Disaster ID</label>

            <input
              type="number"
              value={disasterId}
              onChange={(e) => setDisasterId(e.target.value)}
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label>Request Type</label>

            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              required
            >
              <option value="food">Food</option>
              <option value="water">Water</option>
              <option value="medical">
                Medical Assistance
              </option>
              <option value="shelter">Shelter</option>
              <option value="rescue">Rescue</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the help you need..."
              rows="5"
              required
            />
          </div>

          <div className="form-group">
            <label>Location</label>

            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter your current location"
              required
            />
          </div>

          <div className="form-group">
            <label>Priority</label>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              required
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <button
            type="submit"
            className="submit-request-btn"
          >
            Submit Relief Request
          </button>

        </form>

        {message && (
          <div className="request-message">
            {message}
          </div>
        )}

      </div>
    </div>
  );
}

export default RequestHelp;