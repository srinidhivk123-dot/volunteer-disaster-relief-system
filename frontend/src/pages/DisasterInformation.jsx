import { useEffect,useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function DisasterInformation() {
  const navigate=useNavigate();

  const [disasters,setDisasters]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  useEffect(() => {
    const token=localStorage.getItem("access_token");

    if (!token) {
      navigate("/login",{ replace:true });
      return;
    }

    fetch("http://127.0.0.1:8000/disasters/active",{
      headers:{
        Authorization:`Bearer ${token}`
      }
    })
      .then(async response => {
        if (!response.ok) {
          throw new Error("Failed to load disaster information");
        }

        return response.json();
      })
      .then(data => {
        setDisasters(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load disaster information.");
        setLoading(false);
      });
  },[navigate]);

  return (
    <div className="dashboard-page">

      <nav className="dashboard-navbar">
        <div className="logo">
          <span>🚨</span>
          <h2>ReliefConnect</h2>
        </div>

        <button
          className="logout-btn"
          onClick={() => {
            localStorage.removeItem("access_token");
            navigate("/login",{ replace:true });
          }}
        >
          Logout
        </button>
      </nav>

      <main className="dashboard-content">

        <div className="dashboard-header">

          <div>
            <p className="section-label">
              EMERGENCY INFORMATION
            </p>

            <h1>Active Disaster Information</h1>

            <p>
              Stay informed about active disaster events
              and their locations.
            </p>
          </div>

          <button
            className="secondary-dashboard-btn"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>

        </div>

        {loading && (
          <div className="empty-request">
            <h3>Loading disaster information...</h3>
          </div>
        )}

        {!loading && error && (
          <div className="empty-request">
            <h3>{error}</h3>
          </div>
        )}

        {!loading && !error && disasters.length===0 && (
          <div className="empty-request">
            <h3>No active disasters</h3>
            <p>
              There are currently no active disaster events.
            </p>
          </div>
        )}

        {!loading && !error && disasters.length>0 && (
          <div className="dashboard-cards">

            {disasters.map(disaster => (
              <div
                className="dashboard-card"
                key={disaster.id}
              >

                <p className="section-label">
                  {disaster.status}
                </p>

                <h2>{disaster.name}</h2>

                <p>
                  <strong>Type:</strong>{" "}
                  {disaster.disaster_type}
                </p>

                <p>
                  <strong>Location:</strong>{" "}
                  {disaster.location}
                </p>

                <p>
                  {disaster.description ||
                    "No additional description available."}
                </p>

              </div>
            ))}

          </div>
        )}

      </main>

    </div>
  );
}

export default DisasterInformation;