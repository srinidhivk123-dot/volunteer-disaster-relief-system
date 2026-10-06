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
import "./App.css";


function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">

      <nav className="navbar">
        <div className="logo">
          🚨 ReliefConnect
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
            🚨
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

        </div>

      </div>


      <div className="features-section">

        <div className="feature-card">

          <div className="feature-icon">
            🆘
          </div>

          <h2>
            Request Emergency Help
          </h2>

          <p>
            Submit requests for food, water, medical
            assistance, shelter, and other emergency needs.
          </p>

        </div>


        <div className="feature-card">

          <div className="feature-icon">
            🤝
          </div>

          <h2>
            Volunteer Support
          </h2>

          <p>
            Volunteers can view assigned relief tasks
            and update their progress.
          </p>

        </div>


        <div className="feature-card">

          <div className="feature-icon">
            📢
          </div>

          <h2>
            Disaster Information
          </h2>

          <p>
            Stay informed about active disaster events
            and relief activities.
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
         <Route path="/disaster-information" element={<DisasterInformation />} /> 
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
        <Route
         path="/admin-dashboard"
         element={<AdminDashboard />}
        />
      </Routes>

    </BrowserRouter>
  );
}


export default App;