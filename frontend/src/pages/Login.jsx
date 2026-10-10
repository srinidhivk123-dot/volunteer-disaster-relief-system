import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="login-page-wrapper">
      <Navbar />

      <div className="role-selection-page">
        <div className="role-selection-container">
          <header className="role-selection-header">
            <span className="rc-status-badge badge-teal" style={{ marginBottom: "12px" }}>
              Secure Authentication
            </span>
            <h1 className="role-selection-title">Select Your ReliefConnect Portal</h1>
            <p className="role-selection-subtitle">
              Choose your role below to access your role-specific dashboard and dedicated emergency workflows.
            </p>
          </header>

          {/* Prominent Emergency Relief Banner (No authentication required) */}
          <section className="emergency-quick-banner" aria-label="Urgent Emergency Notice">
            <div className="emergency-quick-content">
              <div className="emergency-quick-icon">🆘</div>
              <div className="emergency-quick-text">
                <h3>Facing an Immediate Disaster or Need Urgent Assistance?</h3>
                <p>
                  You do <strong>not</strong> need to log in or create an account to request emergency rescue, clean water, medical aid, or food.
                </p>
              </div>
            </div>
            <Link to="/guest-request" className="rc-btn rc-btn-danger rc-btn-lg emergency-quick-btn">
              Request Emergency Help Now &rarr;
            </Link>
          </section>

          {/* Three Role Cards */}
          <div className="role-cards-grid">
            {/* Card 1: Victim Portal */}
            <article className="role-portal-card role-portal-victim">
              <div className="role-portal-header">
                <div className="role-portal-icon">🆘</div>
                <span className="rc-status-badge badge-amber">Relief Recipient</span>
              </div>
              <h2 className="role-portal-title">Disaster Victim</h2>
              <p className="role-portal-desc">
                Request emergency supplies, food, rescue assistance, and monitor the live progress of your relief dispatches.
              </p>
              <ul className="role-portal-features">
                <li>Submit relief requests with GPS location</li>
                <li>Monitor live status transitions</li>
                <li>View complete historical request logs</li>
              </ul>
              <div className="role-portal-actions">
                <button
                  type="button"
                  className="rc-btn rc-btn-primary"
                  style={{ width: "100%" }}
                  onClick={() => navigate("/login/victim")}
                >
                  Victim Sign In & Register &rarr;
                </button>
              </div>
            </article>

            {/* Card 2: Volunteer Portal */}
            <article className="role-portal-card role-portal-volunteer">
              <div className="role-portal-header">
                <div className="role-portal-icon">🤝</div>
                <span className="rc-status-badge badge-teal">Field Volunteer</span>
              </div>
              <h2 className="role-portal-title">Relief Volunteer</h2>
              <p className="role-portal-desc">
                Accept field assignments, broadcast your GPS coordinates and availability, and assist disaster victims on the ground.
              </p>
              <ul className="role-portal-features">
                <li>Receive proximity-based dispatch assignments</li>
                <li>Submit assisted requests for victims in the field</li>
                <li>Update task completion status in real-time</li>
              </ul>
              <div className="role-portal-actions">
                <button
                  type="button"
                  className="rc-btn rc-btn-navy"
                  style={{ width: "100%" }}
                  onClick={() => navigate("/login/volunteer")}
                >
                  Volunteer Sign In & Register &rarr;
                </button>
              </div>
            </article>

            {/* Card 3: Administrator Portal */}
            <article className="role-portal-card role-portal-admin">
              <div className="role-portal-header">
                <div className="role-portal-icon">🛡️</div>
                <span className="rc-status-badge badge-navy">Incident Commander</span>
              </div>
              <h2 className="role-portal-title">Command Center</h2>
              <p className="role-portal-desc">
                Restricted operations console for incident commanders to declare disasters, assign volunteers, and oversee relief.
              </p>
              <ul className="role-portal-features">
                <li>Declare and manage active disaster events</li>
                <li>Live GIS Leaflet map of all emergency requests</li>
                <li>Automated nearby volunteer matching & dispatch</li>
              </ul>
              <div className="role-portal-actions">
                <button
                  type="button"
                  className="rc-btn rc-btn-outline-navy"
                  style={{ width: "100%" }}
                  onClick={() => navigate("/login/admin")}
                >
                  Command Center Sign In &rarr;
                </button>
              </div>
            </article>
          </div>

          <footer className="role-selection-footer">
            <Link to="/" className="rc-btn rc-btn-outline" style={{ fontSize: "14px" }}>
              &larr; Back to Home
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
