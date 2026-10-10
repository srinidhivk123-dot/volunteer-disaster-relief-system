import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getStoredUser, removeAuthToken } from "../utils/api";

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    removeAuthToken();
    navigate("/login", { replace: true });
  };

  const getHomeLink = () => {
    if (!user) return "/";
    if (user.role === "admin") return "/admin-dashboard";
    if (user.role === "volunteer") return "/volunteer-dashboard";
    return "/dashboard";
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="rc-navbar">
      <div className="rc-navbar-container">
        <Link to={getHomeLink()} className="rc-brand">
          <span className="rc-brand-icon">🚨</span>
          <div className="rc-brand-text">
            <span className="rc-brand-title">ReliefConnect</span>
            <span className="rc-brand-tag">Disaster Coordination</span>
          </div>
        </Link>

        <button
          className="rc-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>

        <div className={`rc-nav-menu ${mobileMenuOpen ? "is-open" : ""}`}>
          <div className="rc-nav-links">
            {!user && (
              <>
                <Link
                  to="/"
                  className={`rc-nav-link ${isActive("/") ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/guest-request"
                  className={`rc-nav-link ${isActive("/guest-request") ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Request Help
                </Link>
                <Link
                  to="/disaster-information"
                  className={`rc-nav-link ${isActive("/disaster-information") ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Disasters
                </Link>
              </>
            )}

            {user && user.role === "victim" && (
              <>
                <Link
                  to="/dashboard"
                  className={`rc-nav-link ${isActive("/dashboard") ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/request-help"
                  className={`rc-nav-link ${isActive("/request-help") ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Request Help
                </Link>
                <Link
                  to="/my-requests"
                  className={`rc-nav-link ${isActive("/my-requests") ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Requests
                </Link>
                <Link
                  to="/disaster-information"
                  className={`rc-nav-link ${isActive("/disaster-information") ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Disasters
                </Link>
              </>
            )}

            {user && user.role === "volunteer" && (
              <>
                <Link
                  to="/volunteer-dashboard"
                  className={`rc-nav-link ${isActive("/volunteer-dashboard") ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Volunteer Dashboard
                </Link>
                <Link
                  to="/assisted-request"
                  className={`rc-nav-link ${isActive("/assisted-request") ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Assisted Request
                </Link>
                <Link
                  to="/disaster-information"
                  className={`rc-nav-link ${isActive("/disaster-information") ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Disasters
                </Link>
              </>
            )}

            {user && user.role === "admin" && (
              <>
                <Link
                  to="/admin-dashboard"
                  className={`rc-nav-link ${isActive("/admin-dashboard") ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Console
                </Link>
                <Link
                  to="/disaster-information"
                  className={`rc-nav-link ${isActive("/disaster-information") ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Disasters
                </Link>
              </>
            )}
          </div>

          <div className="rc-nav-actions">
            {user ? (
              <div className="rc-user-section">
                <span className={`rc-role-chip rc-role-${user.role}`}>
                  {user.role}
                </span>
                <button
                  type="button"
                  className="rc-btn rc-btn-outline"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="rc-btn rc-btn-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
