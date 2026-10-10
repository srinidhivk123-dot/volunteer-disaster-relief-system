import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Alert from "../components/Alert";
import { api, setAuthToken, getStoredUser } from "../utils/api";

function Login() {
  const [activeTab, setActiveTab] = useState("login"); // "login" | "register"
  
  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Registration form state
  const [name, setName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [regRole, setRegRole] = useState("victim");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const data = await api.login(email.trim(), password);
      setAuthToken(data.access_token);

      const user = getStoredUser();
      const role = user?.role || "victim";

      setSuccessMsg("Authentication successful! Redirecting to dashboard...");

      setTimeout(() => {
        if (role === "admin") {
          navigate("/admin-dashboard", { replace: true });
        } else if (role === "volunteer") {
          navigate("/volunteer-dashboard", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }, 500);
    } catch (err) {
      console.error("Login failure:", err);
      setErrorMsg(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (loading) return;

    setErrorMsg("");
    setSuccessMsg("");

    // Password validation matching backend requirements
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
    if (regPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.register(name.trim(), regEmail.trim(), regPassword, regRole);
      setSuccessMsg(`Account created successfully as ${regRole}! Please sign in with your credentials.`);
      setActiveTab("login");
      setEmail(regEmail.trim());
      setPassword("");
      setName("");
      setRegEmail("");
      setRegPassword("");
      setConfirmPassword("");
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
            <div className="icon">🚨</div>
            <h1>{activeTab === "login" ? "Welcome Back" : "Create Account"}</h1>
            <p>
              {activeTab === "login"
                ? "Sign in to coordinate relief or track assistance"
                : "Register as a relief recipient or community member"}
            </p>
          </div>

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

          {errorMsg && <Alert type="error" message={errorMsg} onClose={() => setErrorMsg("")} />}
          {successMsg && <Alert type="success" message={successMsg} />}

          {activeTab === "login" ? (
            <form onSubmit={handleLogin}>
              <div className="rc-form-group">
                <label htmlFor="login-email">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  autoFocus
                />
              </div>

              <div className="rc-form-group">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <button
                type="submit"
                className="rc-btn rc-btn-primary"
                style={{ width: "100%", marginTop: "12px" }}
                disabled={loading}
              >
                {loading ? "Authenticating..." : "Sign In to ReliefConnect"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="rc-form-group">
                <label htmlFor="reg-name">Full Name</label>
                <input
                  id="reg-name"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="rc-form-group">
                <label htmlFor="reg-role">Account Type & Role</label>
                <select
                  id="reg-role"
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  disabled={loading}
                >
                  <option value="victim">Disaster Victim (Request Relief & Track Status)</option>
                  <option value="volunteer">Relief Volunteer (Respond & Accept Dispatches)</option>
                  <option value="admin">System Administrator (Command Center & Dispatch)</option>
                </select>
              </div>

              <div className="rc-form-group">
                <label htmlFor="reg-email">Email Address</label>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="name@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="rc-form-group">
                <label htmlFor="reg-password">Password</label>
                <input
                  id="reg-password"
                  type="password"
                  placeholder="Minimum 8 chars, 1 uppercase, 1 digit"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <small>Requires 8+ characters, uppercase, lowercase, and a number</small>
              </div>

              <div className="rc-form-group">
                <label htmlFor="reg-confirm">Confirm Password</label>
                <input
                  id="reg-confirm"
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <button
                type="submit"
                className="rc-btn rc-btn-primary"
                style={{ width: "100%", marginTop: "12px" }}
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          )}

          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <button
              type="button"
              className="rc-btn rc-btn-outline"
              onClick={() => navigate("/")}
              style={{ fontSize: "13px" }}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
