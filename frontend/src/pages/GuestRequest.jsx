import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function GuestRequest() {
  const navigate = useNavigate();

  const [disasterId,setDisasterId] = useState("1");
  const [requestType,setRequestType] = useState("food");
  const [description,setDescription] = useState("");
  const [location,setLocation] = useState("");
  const [priority,setPriority] = useState("MEDIUM");
  const [phone,setPhone] = useState("");
  const [message,setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("Submitting request...");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/relief-requests/guest",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            disaster_id:Number(disasterId),
            request_type:requestType,
            description:description,
            location:location,
            priority:priority,
            phone:phone,
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
      setPhone("");
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
          onClick={() => navigate("/")}
        >
          Back
        </button>

        <h1>Request Emergency Help</h1>

        <p>
          You can submit an emergency relief request without creating an account.
        </p>

        <form onSubmit={handleSubmit}>

          <label>Disaster ID</label>

          <input
            type="number"
            value={disasterId}
            onChange={(e) => setDisasterId(e.target.value)}
            min="1"
            required
          />

          <label>Request Type</label>

          <select
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
          >
            <option value="food">Food</option>
            <option value="water">Water</option>
            <option value="medical">Medical</option>
            <option value="shelter">Shelter</option>
            <option value="rescue">Rescue</option>
            <option value="other">Other</option>
          </select>

          <label>Description</label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the help you need"
            required
          />

          <label>Location</label>

          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter your location"
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

          <label>Phone Number</label>

          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            maxLength="15"
            required
          />

          <button
            type="submit"
            className="submit-button"
          >
            Submit Emergency Request
          </button>

        </form>

        {message && (
          <p className="request-message">
            {message}
          </p>
        )}

      </div>

    </div>
  );
}

export default GuestRequest;