import React, { useState } from "react";
import "./TechnicianLogin.css";

const TechnicianLogin = ({ technician, onLoginSuccess, onCancel }) => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Validate credentials
    if (userId === technician.userId && password === technician.password) {
      onLoginSuccess();
    } else {
      setError("Invalid User ID or Password");
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-modal">
        <div className="login-header">
          <h2>Technician Login</h2>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>

        <div className="login-body">
          <div className="tech-info">
            <h3>{technician.name}</h3>
            <p>{technician.email}</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label>User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your user ID"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-login">
                Login
              </button>
              <button type="button" className="btn-cancel" onClick={onCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TechnicianLogin;
