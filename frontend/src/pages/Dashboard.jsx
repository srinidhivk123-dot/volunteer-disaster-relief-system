import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login", { replace: true });
  };

  return (
    <div className="dashboard-page">

      {/* Dashboard Navigation */}
      <nav className="dashboard-navbar">
        <div className="logo">
          <span>🚨</span>
          <h2>ReliefConnect</h2>
        </div>

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>
      </nav>

      {/* Dashboard Content */}
      <main className="dashboard-content">

        <div className="dashboard-header">
          <div>
            <p className="section-label">
              VICTIM DASHBOARD
            </p>

            <h1>Welcome to ReliefConnect</h1>

            <p>
              Request emergency assistance and track your
              relief requests.
            </p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="dashboard-cards">

          <div className="dashboard-card">
            <div className="dashboard-card-icon">
              🆘
            </div>

            <h2>Request Help</h2>

            <p>
              Submit a request for food, water, medical
              assistance, shelter, or other emergency needs.
            </p>

            <button
              onClick={() => navigate("/request-help")}
            >
              Request Help
            </button>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-icon">
              📋
            </div>

            <h2>My Requests</h2>

            <p>
              View the relief requests you have submitted
              and check their current status.
            </p>

            <button onClick={() => navigate("/my-requests")}>
             View Requests
            </button>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-icon">
              📢
            </div>

            <h2>Emergency Information</h2>

            <p>
              Stay informed about active disaster events and
              available relief services.
            </p>

            <button className="secondary-dashboard-btn">
              View Information
            </button>
          </div>

        </div>

        {/* Current Status */}
        <section className="request-status">

          <h2>My Recent Requests</h2>

          <div className="empty-request">

            <div className="empty-icon">
              📋
            </div>

            <h3>No requests yet</h3>

            <p>
              You haven't submitted a relief request yet.
            </p>

            <button
              onClick={() => navigate("/request-help")}
            >
              Submit Your First Request
            </button>

          </div>

        </section>

      </main>

      {/* Footer */}
      <footer>
        <h3>ReliefConnect</h3>

        <p>
          Volunteer Disaster Relief Coordination System
        </p>
      </footer>

    </div>
  );
}

export default Dashboard;