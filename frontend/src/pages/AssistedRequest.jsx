import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function AssistedRequest() {
  const [victimId, setVictimId] = useState("");
  const [disasterId, setDisasterId] = useState("1");
  const [requestType, setRequestType] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Creating assisted request...");

    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/relief-requests/assisted",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            victim_id: Number(victimId),
            disaster_id: Number(disasterId),
            request_type: requestType,
            description: description,
            location: location,
            priority: priority,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Failed to create request");
        return;
      }

      setMessage(
        `Assisted request created successfully. Request ID: ${data.id}`
      );

      setVictimId("");
      setRequestType("");
      setDescription("");
      setLocation("");
      setPriority("MEDIUM");
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to the backend.");
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">

        <button onClick={() => navigate("/volunteer-dashboard")}>
          ← Back to Volunteer Dashboard
        </button>

        <h1>Assisted Relief Request</h1>

        <p>
          Create a relief request on behalf of a victim.
        </p>

        <form onSubmit={handleSubmit}>

          <div className="dashboard-card">

            <label>Victim ID</label>
            <input
              type="number"
              value={victimId}
              onChange={(e) => setVictimId(e.target.value)}
              placeholder="Enter victim user ID"
              required
            />

            <label>Disaster ID</label>
            <input
              type="number"
              value={disasterId}
              onChange={(e) => setDisasterId(e.target.value)}
              required
            />

            <label>Request Type</label>
            <input
              type="text"
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              placeholder="Example: Food, Water, Medical"
              required
            />

            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the victim's requirement"
              required
            />

            <label>Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location"
              required
            />

            <label>Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>

            <button type="submit">
              Create Assisted Request
            </button>

            {message && <p>{message}</p>}

          </div>

        </form>
      </div>
    </div>
  );
}

export default AssistedRequest;