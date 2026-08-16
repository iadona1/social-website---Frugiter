import "../styles/welcome.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RulesModal from "../components/RulesModal";
import type { SignupData } from "../types/index";

export default function Welcome() {
  const navigate = useNavigate();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [signupData, setSignupData] = useState<SignupData>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    confirmPassword: "",
    password: "",
    dateOfBirth: "",
  });

  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    console.log("Sending signup data:", signupData);

    try {
      const res = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/home");
    } catch {
      setLoginError("Could not connect to server. Is it running?");
    }
  };

  const handleSignupClick = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");

    if (
      !signupData.firstName ||
      !signupData.lastName ||
      !signupData.email ||
      !signupData.password
    ) {
      setSignupError("Please fill in all fields before continuing.");
      return;
    }

    if (!signupData.username) {
      setSignupError("Please choose a username.");
      return;
    }

    if (signupData.username.length < 3) {
      setSignupError("Username must be at least 3 characters.");
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      setSignupError("Passwords do not match.");
      return;
    }

    if (signupData.password.length < 6) {
      setSignupError("Password must be at least 6 characters.");
      return;
    }

    if (!signupData.dateOfBirth) {
      setSignupError("Please enter your date of birth.");
      return;
    }

    setShowRules(true);
  };

  const handleRulesAccepted = async () => {
    setShowRules(false);
    setSignupLoading(true);

    try {
      const res = await fetch("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData),
      });

      const data = await res.json();

      if (!res.ok) {
        setSignupError(data.error);
        setSignupLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/select-avatar");
    } catch {
      setSignupError("Could not connect to server. Is it running?");
      setSignupLoading(false);
    }
  };

  const handleRulesDeclined = () => {
    setShowRules(false);
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/forgot-password");
  };

  return (
    <div className="welcome-page">
      {showRules && (
        <RulesModal
          onAccept={handleRulesAccepted}
          onDecline={handleRulesDeclined}
        />
      )}

      <div className="welcome-bg" />

      <div className="bubbles">
        {Array.from({ length: 10 }).map((_, i) => (
          <div className="bubble" key={i} />
        ))}
      </div>

      <nav className="welcome-navbar">
        <div className="navbar-logo">
          Aero<span>Social</span>
        </div>
        <form className="navbar-auth" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
          />
          <button type="submit" className="btn-login">
            Log In
          </button>
          <a href="#" className="navbar-forgot" onClick={handleForgotPassword}>
            Forgot password?
          </a>
        </form>
        {loginError && <div className="login-error">{loginError}</div>}
      </nav>

      <main className="welcome-content">
        <div className="welcome-left">
          <img
            src="/assets/small-Frugiter-Icons-(2).png"
            alt="AeroSocial"
            className="welcome-icon"
          />
          <h1 className="welcome-tagline">
            Connect and share with the people in your life.
          </h1>
          <p className="welcome-sub">
            AeroSocial helps you stay in touch with friends and family, share
            your moments, and discover new connections.
          </p>
        </div>

        <div className="welcome-card">
          <div className="card-title">Sign Up</div>
          <div className="card-sub">It's free and always will be.</div>

          <form onSubmit={handleSignupClick}>
            <div className="card-row">
              <input
                className="aero-input"
                type="text"
                placeholder="First Name"
                value={signupData.firstName}
                onChange={(e) =>
                  setSignupData({ ...signupData, firstName: e.target.value })
                }
              />
              <input
                className="aero-input"
                type="text"
                placeholder="Last Name"
                value={signupData.lastName}
                onChange={(e) =>
                  setSignupData({ ...signupData, lastName: e.target.value })
                }
              />
            </div>

            <div className="input-group">
              <input
                className="aero-input"
                type="text"
                placeholder="Username (e.g. john_doe)"
                value={signupData.username}
                onChange={(e) =>
                  setSignupData({
                    ...signupData,
                    username: e.target.value.toLowerCase().replace(/\s/g, "_"),
                  })
                }
              />
            </div>

            <div className="input-group">
              <input
                className="aero-input"
                type="email"
                placeholder="Your Email"
                value={signupData.email}
                onChange={(e) =>
                  setSignupData({ ...signupData, email: e.target.value })
                }
              />
            </div>

            <div className="input-group">
              <input
                className="aero-input"
                type="password"
                placeholder="New Password"
                value={signupData.password}
                onChange={(e) =>
                  setSignupData({
                    ...signupData,
                    password: e.target.value,
                  })
                }
              />
            </div>
            <div className="input-group">
              <input
                className="aero-input"
                type="password"
                placeholder="Re-enter Password"
                value={signupData.confirmPassword}
                onChange={(e) =>
                  setSignupData({
                    ...signupData,
                    confirmPassword: e.target.value,
                  })
                }
              />
            </div>

            <div className="input-group-birthday">
              <label className="input-label">Birthday</label>
              <input
                className="aero-input"
                type="date"
                value={signupData.dateOfBirth}
                onChange={(e) =>
                  setSignupData({ ...signupData, dateOfBirth: e.target.value })
                }
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="input-hint">
              You must be at least 15 years old to register.
            </div>

            {signupError && <div className="signup-error">{signupError}</div>}

            <div className="card-divider" />

            <button
              type="submit"
              className="btn-signup"
              disabled={signupLoading}
            >
              {signupLoading ? "Creating account..." : "Sign Up"}
            </button>
          </form>
        </div>
      </main>

      <footer className="welcome-footer">
        <div>
          <a href="#">English</a> ·<a href="#">Privacy</a> ·
          <a href="#">Terms</a> ·<a href="#">About</a> ·<a href="#">Help</a>
        </div>
        <div className="footer-copy">AeroSocial © 2026</div>
      </footer>
    </div>
  );
}
