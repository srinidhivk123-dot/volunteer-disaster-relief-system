import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

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

      <nav className="navbar">
        <div className="logo">
          ðŸš¨ ReliefConnect
        </div>

        <button
          className="login-button"
          onClick={() => navigate("/login")}
        >
          Login
        </button>
      </nav>


      <div className="hero-section">

        <div className="hero-content">

          <div className="hero-icon">
            ðŸš¨
          </div>

          <h1>
            Volunteer Disaster Relief
            <br />
            Coordination System
          </h1>

          <p>
            Connecting victims with volunteers during
            disaster emergencies.
          </p>

          <button
            className="hero-button"
            onClick={() => navigate("/login")}
          >
            Get Started
          </button>

          <button
            className="hero-button"
            onClick={() => navigate("/guest-request")}
          >
            Request Help as Guest
          </button>

        </div>

      </div>


      <div className="features-section">

        <div className="feature-card">

          <div className="feature-icon">
            ðŸ†˜
          </div>

          <h2>
            Request Emergency Help
          </h2>

          <p>
            Submit requests for food, water, medical
            assistance, shelter, andother emergency needs.
          </p>

        </div>


        <div className="feature-card">

          <div className="feature-icon">
            ðŸ¤
          </div>

          <h2>
            Volunteer Support
          </h2>

          <p>
            Volunteers can register their skills,
            availability, and assist disaster victims.
          </p>

        </div>

      </div>


      <footer>
        <p>
          ReliefConnect - Volunteer Disaster Relief
          Coordination System
        </p>
      </footer>

    </div>
  );
}


function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/disaster-information"
          element={<DisasterInformation />}
        />

        {/* Home */}
        <Route
          path="/"
          element={<Home />}
        />


        {/* Authentication */}
        <Route
          path="/login"
          element={<Login />}
        />


        {/* Victim Dashboard */}
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />


        {/* Victim - Create Relief Request */}
        <Route
          path="/request-help"
          element={<RequestHelp />}
        />


        {/* Guest - Create Relief Request */}
        <Route
          path="/guest-request"
          element={<GuestRequest />}
        />


        {/* Victim - View My Requests */}
        <Route
          path="/my-requests"
          element={<MyRequests />}
        />


        {/* Volunteer Dashboard */}
        <Route
          path="/volunteer-dashboard"
          element={<VolunteerDashboard />}
        />


        {/* Volunteer - Assisted Relief Request */}
        <Route
          path="/assisted-request"
          element={<AssistedRequest />}
        />


        {/* Admin Dashboard */}
        <Route
          path="/admin-dashboard"
          element={<AdminDashboard />}
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;