import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Alert from "../components/Alert";
import { api, setAuthToken, getStoredUser } from "../utils/api";

const ROLE_CONFIGS = {
  victim: {
    id: "victim",
    title: "Victim Portal",
    badge: "Relief Recipient",
    badgeClass: "badge-amber",
    icon: "🆘",
    description: "Sign in to request relief aid, supplies, medical assistance, and track live status.",
    redirectPath: "/dashboard",
    allowRegister: true,
    registerTitle: "Register as Relief Recipient",
    guestHelpNotice: true,
  },
  volunteer: {
    id: "volunteer",
    title: "Volunteer Portal",
    badge: "Relief Volunteer",
    badgeClass: "badge-teal",
    icon: "🤝",
    description: "Sign in to view relief assignments, update your field availability, and assist victims.",
    redirectPath: "/volunteer-dashboard",
    allowRegister: true,
    registerTitle: "Register as Field Volunteer",
    guestHelpNotice: false,
  },
  admin: {
    id: "admin",
    title: "Command Center",
    badge: "Administrator Only",
    badgeClass: "badge-navy",
    icon: "🛡️",
    description: "Authorized access for disaster management officers, incident coordinators, and system administrators.",
    redirectPath: "/admin-dashboard",
    allowRegister: false,
    guestHelpNotice: false,
  },
};

export default function RoleLogin({ role: propRole }) {
  const { roleParam } = useParams();
  const currentRole = propRole || roleParam || "victim";
  const config = ROLE_CONFIGS[currentRole] || ROLE_CONFIGS.victim;

  const navigate = useNavigate();

  // Tab state: "login" or "register" (only for victim & volunteer)
  const [activeTab, setActiveTab] = useState("login");

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Registration form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regSkills, setRegSkills] = useState("General Disaster Relief");
  const [regPhone, setRegPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setErrorMsg("");
    setSuccessMsg("");

    if (!email.trim() || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      // Call role-specific login endpoint
      const data = await api.login(email.trim(), password, config.id);
      setAuthToken(data.access_token);

      const user = getStoredUser();
      const actualRole = user?.role || data.role || config.id;

      setSuccessMsg("Authentication verified! Redirecting to your dashboard...");

      setTimeout(() => {
        if (actualRole === "admin") {
          navigate("/admin-dashboard", { replace: true });
        } else if (actualRole === "volunteer") {
          navigate("/volunteer-dashboard", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }, 500);
    } catch (err) {
      console.error(`${config.title} login error:`, err);
      setErrorMsg(err.message || "Invalid email or password. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (loading) return;

    setErrorMsg("");
    setSuccessMsg("");

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    // Password validation matching security policy
    if (regPassword.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(regPassword)) {
      setErrorMsg("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/[a-z]/.test(regPassword)) {
      setErrorMsg("Password must contain at least one lowercase letter.");
      return;
    }
    if (!/[0-9]/.test(regPassword)) {
      setErrorMsg("Password must contain at least one digit.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg("Passwords do not match. Please verify both password entries.");
      return;
    }

    setLoading(true);

    try {
      if (config.id === "volunteer") {
        await api.registerVolunteer({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          skills: regSkills.trim() || "General Disaster Relief",
          phone: regPhone.trim() || null,
        });
        setSuccessMsg("Volunteer account created successfully! Please sign in with your credentials.");
      } else {
        await api.register(regName.trim(), regEmail.trim(), regPassword, "victim");
        setSuccessMsg("Victim account created successfully! Please sign in with your credentials.");
      }

      // Switch to sign-in tab with prefilled email
      setActiveTab("login");
      setEmail(regEmail.trim());
      setPassword("");
      setRegName("");
      setRegEmail("");
      setRegPassword("");
      setRegConfirmPassword("");
    } catch (err) {
      console.error("Registration error:", err);
      setErrorMsg(err.message || "Registration failed. Please check the provided information.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <Navbar />

      <div className="login-page">
        <div className="login-card">
          <div className="login-card-header">
            <div className="icon">{config.icon}</div>
            <span className={`rc-status-badge ${config.badgeClass}`} style={{ marginBottom: "10px" }}>
              {config.badge}
            </span>
            <h1>{config.title}</h1>
            <p>{config.description}</p>
          </div>

          {config.guestHelpNotice && (
            <div className="login-guest-banner">
              <span>🆘 Need immediate emergency help?</span>
              <Link to="/guest-request" className="login-guest-banner-link">
                Submit Request Without Login &rarr;
              </Link>
            </div>
          )}

          {config.allowRegister && (
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab-btn ${activeTab === "login" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("login");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${activeTab === "register" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("register");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
              >
                Register
              </button>
            </div>
          )}

          {errorMsg && <Alert type="error" message={errorMsg} onClose={() => setErrorMsg("")} />}
          {successMsg && <Alert type="success" message={successMsg} />}

          {/* Sign In Form */}
          {activeTab === "login" || !config.allowRegister ? (
            <form onSubmit={handleLogin} noValidate>
              <div className="rc-form-group">
                <label htmlFor="role-login-email">{config.title} Email Address</label>
                <input
                  id="role-login-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>

              <div className="rc-form-group">
                <label htmlFor="role-login-password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="role-login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="rc-btn rc-btn-primary"
                style={{ width: "100%", marginTop: "14px" }}
                disabled={loading}
              >
                {loading ? "Authenticating..." : `Sign In as ${config.badge}`}
              </button>

              {!config.allowRegister && (
                <div className="admin-notice-box">
                  <span className="admin-notice-icon">🔒</span>
                  <p>
                    <strong>Restricted Access:</strong> Administrator credentials are strictly provisioned by system security. Public registration is not permitted.
                  </p>
                </div>
              )}
            </form>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegister} noValidate>
              <div className="rc-form-group">
                <label htmlFor="reg-name">Full Name *</label>
                <input
                  id="reg-name"
                  type="text"
                  placeholder="Your full legal name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="name"
                />
              </div>

              <div className="rc-form-group">
                <label htmlFor="reg-email">Email Address *</label>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="name@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="email"
                />
              </div>

              {config.id === "volunteer" && (
                <>
                  <div className="rc-form-group">
                    <label htmlFor="reg-skills">Relief Skills / Specialty</label>
                    <select
                      id="reg-skills"
                      value={regSkills}
                      onChange={(e) => setRegSkills(e.target.value)}
                      disabled={loading}
                    >
                      <option value="General Disaster Relief">General Disaster Relief & Logistics</option>
                      <option value="Emergency Medical & Rescue">Emergency Medical & First Aid</option>
                      <option value="Food & Water Distribution">Food & Water Supply Distribution</option>
                      <option value="Search & Evacuation">Search, Rescue & Evacuation</option>
                      <option value="Shelter Management">Shelter Management & Coordination</option>
                    </select>
                  </div>

                  <div className="rc-form-group">
                    <label htmlFor="reg-phone">Contact Phone Number (Optional)</label>
                    <input
                      id="reg-phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      disabled={loading}
                      autoComplete="tel"
                    />
                  </div>
                </>
              )}

              <div className="rc-form-group">
                <label htmlFor="reg-password">Password *</label>
                <div className="password-input-wrapper">
                  <input
                    id="reg-password"
                    type={showRegPassword ? "text" : "password"}
                    placeholder="Min 8 chars, 1 uppercase, 1 digit"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    disabled={loading}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    aria-label={showRegPassword ? "Hide password" : "Show password"}
                    title={showRegPassword ? "Hide password" : "Show password"}
                  >
                    {showRegPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                <small>Requires 8+ characters, uppercase letter, lowercase letter, and number</small>
              </div>

              <div className="rc-form-group">
                <label htmlFor="reg-confirm">Confirm Password *</label>
                <input
                  id="reg-confirm"
                  type={showRegPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                className="rc-btn rc-btn-primary"
                style={{ width: "100%", marginTop: "14px" }}
                disabled={loading}
              >
                {loading ? "Registering..." : `Create ${config.badge} Account`}
              </button>
            </form>
          )}

          <div className="login-footer-actions">
            <Link to="/login" className="login-back-link">
              &larr; Choose a Different Role Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
