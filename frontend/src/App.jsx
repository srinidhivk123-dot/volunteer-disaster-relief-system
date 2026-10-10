import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import DisasterInformation from "./pages/DisasterInformation";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RequestHelp from "./pages/RequestHelp";
import MyRequests from "./pages/MyRequests";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import AssistedRequest from "./pages/AssistedRequest";
import AdminDashboard from "./pages/AdminDashboard";
import GuestRequest from "./pages/GuestRequest";
import "./App.css";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <Navbar />

      <main>
        <section className="hero-section">
          <div className="hero-content">
            <span className="hero-pill">Emergency Response Platform</span>
            <h1 className="hero-title">
              Volunteer Disaster Relief Coordination System
            </h1>
            <p className="hero-description">
              Connecting disaster victims with trained volunteers and relief teams in real-time. Coordinate supplies, rescue operations, and essential medical assistance efficiently.
            </p>
            <div className="hero-actions">
              <button
                type="button"
                className="rc-btn rc-btn-primary rc-btn-lg"
                onClick={() => navigate("/guest-request")}
              >
                🆘 Request Emergency Help Now
              </button>
              <button
                type="button"
                className="rc-btn rc-btn-navy rc-btn-lg"
                onClick={() => navigate("/login")}
              >
                Volunteer / Staff Login
              </button>
              <button
                type="button"
                className="rc-btn rc-btn-outline rc-btn-lg"
                onClick={() => navigate("/disaster-information")}
              >
                📢 Active Disasters
              </button>
            </div>
          </div>
        </section>

        <section className="features-section">
          <div className="section-header">
            <h2>How ReliefConnect Works</h2>
            <p>A coordinated ecosystem for swift emergency relief</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🆘</div>
              <h3>Emergency Assistance</h3>
              <p>
                Victims or good samaritans can submit urgent requests for rescue, food, clean water, medical aid, or shelter with GPS coordinates, even without an account.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>Volunteer Dispatch</h3>
              <p>
                Volunteers share their live availability, skills, and GPS locations. Incident commanders assign nearby volunteers based on geographic proximity.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🗺️</div>
              <h3>Incident Management</h3>
              <p>
                Administrators monitor relief operations with real-time mapping, track task status transitions, and ensure no request goes unattended.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <p><strong>ReliefConnect</strong> &mdash; Volunteer Disaster Relief Coordination System</p>
        <small>Developed for Capstone Project &bull; Built with FastAPI, React, and OpenStreetMap</small>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/guest-request" element={<GuestRequest />} />
        <Route path="/disaster-information" element={<DisasterInformation />} />
        
        {/* Victim routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/request-help" element={<RequestHelp />} />
        <Route path="/my-requests" element={<MyRequests />} />

        {/* Volunteer routes */}
        <Route path="/volunteer-dashboard" element={<VolunteerDashboard />} />
        <Route path="/assisted-request" element={<AssistedRequest />} />

        {/* Admin route */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;