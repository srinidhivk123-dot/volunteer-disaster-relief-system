import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("Loading requests...");

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    const fetchRequests = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/relief-requests/my",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.detail || "Failed to load requests");
          return;
        }

        setRequests(data);
        setMessage("");
      } catch (error) {
        console.error(error);
        setMessage("Cannot connect to the backend.");
      }
    };

    fetchRequests();
  }, [navigate]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">

        <button
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>

        <h1>My Relief Requests</h1>

        {message && (
          <p>{message}</p>
        )}

        {!message && requests.length === 0 && (
          <p>You haven't submitted any relief requests yet.</p>
        )}

        {requests.map((request) => (
          <div
            key={request.id}
            className="dashboard-card"
          >
            <h2>Request #{request.id}</h2>

            <p>
              <strong>Type:</strong>{" "}
              {request.request_type}
            </p>

            <p>
              <strong>Description:</strong>{" "}
              {request.description}
            </p>

            <p>
              <strong>Location:</strong>{" "}
              {request.location}
            </p>

            <p>
              <strong>Priority:</strong>{" "}
              {request.priority}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {request.status}
            </p>

            <p>
              <strong>Source:</strong>{" "}
              {request.request_source}
            </p>
          </div>
        ))}

      </div>
    </div>
  );
}

export default MyRequests;