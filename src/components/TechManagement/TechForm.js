// src/components/TechManagement/TechForm.jsx
import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import { ref, push, update } from "firebase/database";
import Notification from '../Notification';
import useNotification from '../../hooks/useNotification';
import "./TechForm.css";

function TechForm({ tech, onClose, onTechAdded, onBack, fullPage = false }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [skills, setSkills] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { notification, showNotification, hideNotification } = useNotification();

  // Handle phone input to allow only digits and limit to 10
  const handlePhoneChange = (value) => {
    const digitsOnly = value.replace(/\D/g, '');
    const limitedDigits = digitsOnly.slice(0, 10);
    setPhone(limitedDigits);
  };

  // Handle email input - convert to lowercase
  const handleEmailChange = (value) => {
    setEmail(value.toLowerCase());
  };

  useEffect(() => {
    if (tech) {
      setName(tech.name || "");
      setEmail(tech.email || "");
      setPhone(tech.phone || "");
      setAddress(tech.address || "");
      setSkills(tech.skills?.join(", ") || "");
      setUserId(tech.userId || "");
      setPassword(tech.password || "");
    }
  }, [tech]);

  const validateForm = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Name is required";
    
    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    // Phone validation (exactly 10 digits)
    if (!phone.trim()) {
      newErrors.phone = "Phone is required";
    } else if (!/^[0-9]{10}$/.test(phone)) {
      newErrors.phone = "Phone must be exactly 10 digits";
    }
    
    // User ID validation
    if (!userId.trim()) {
      newErrors.userId = "User ID is required";
    }
    
    // Password validation
    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const techData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      status: "Available",
      address: address.trim(),
      userId: userId.trim(),
      password: password.trim(),
      assignedTickets: tech?.assignedTickets || [],
    };

    try {
      if (tech) {
        await update(ref(db, `technicians/${tech.id}`), techData);
        showNotification('Technician updated successfully!', 'success');
      } else {
        await push(ref(db, "technicians"), techData);
        showNotification('Technician added successfully!', 'success');
      }
      
      // Handle different callback scenarios
      if (onTechAdded) {
        onTechAdded();
      } else if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Error saving technician:", error);
      showNotification('Failed to save technician. Try again.', 'error');
      setErrors({ submit: "Failed to save technician. Try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (fullPage) {
    return (
      <div className="tech-form-page">
        <div className="technicians-header">
          <h1>{tech ? "Edit Technician" : "Add New Technician"}</h1>
          <button
            type="button"
            className="btn-primary"
            onClick={onBack}
          >
            <span className="btn-icon">←</span> Back to Technicians
          </button>
        </div>

        <div className="tech-form-container">
          <div className="tech-form-card">
            <form onSubmit={handleSubmit} className="tech-form">
              {errors.submit && <div className="error-message">{errors.submit}</div>}

              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input 
                    type="text"
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input 
                    type="email"
                    value={email} 
                    onChange={(e) => handleEmailChange(e.target.value)} 
                    placeholder="example@gmail.com"
                    required
                  />
                  <small style={{color: '#6b7280', display: 'block', marginTop: '0.25rem'}}>
                    Email will be converted to lowercase
                  </small>
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <input 
                    type="tel"
                    value={phone} 
                    onChange={(e) => handlePhoneChange(e.target.value)} 
                    placeholder="Enter 10 digit mobile number"
                    pattern="[0-9]{10}"
                    maxLength="10"
                    title="Please enter exactly 10 digits"
                    required
                  />
                  {phone && phone.length !== 10 && !errors.phone && (
                    <small style={{color: '#ef4444'}}>Must be 10 digits</small>
                  )}
                  {errors.phone && <span className="error-text">{errors.phone}</span>}
                </div>

                <div className="form-group">
                  <label>User ID *</label>
                  <input 
                    type="text"
                    value={userId} 
                    onChange={(e) => setUserId(e.target.value)} 
                    placeholder="Enter user ID"
                    required
                  />
                  {errors.userId && <span className="error-text">{errors.userId}</span>}
                </div>

                <div className="form-group">
                  <label>Password *</label>
                  <input 
                    type="password"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Enter password (min 6 characters)"
                    minLength="6"
                    required
                  />
                  {errors.password && <span className="error-text">{errors.password}</span>}
                </div>

                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                    rows="3"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Skills (comma separated)</label>
                  <input 
                    type="text"
                    value={skills} 
                    onChange={(e) => setSkills(e.target.value)} 
                    placeholder="e.g. Hardware Repair, Software Installation, Network Setup"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (tech ? "Update Technician" : "Add Technician")}
                </button>
                <button type="button" className="btn-secondary" onClick={onBack}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        <Notification
          message={notification.message}
          type={notification.type}
          isVisible={notification.isVisible}
          onClose={hideNotification}
        />
      </div>
    );
  }

  return (
    <div className="tech-form-overlay">
      <div className="tech-form-modal">
        <div className="tech-form-header">
          <h2>{tech ? "Edit Technician" : "Add New Technician"}</h2>
          <button className="close-button" onClick={onClose}>
            &#10006;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="tech-form">
          {errors.submit && <div className="error-message">{errors.submit}</div>}

          <label>Full Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
          {errors.name && <span className="error-text">{errors.name}</span>}

          <label>Address</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} />

          <label>Email Address *</label>
          <input 
            type="email"
            value={email} 
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="example@gmail.com"
          />
          <small style={{color: '#6b7280', display: 'block', marginTop: '0.25rem'}}>
            Email will be converted to lowercase
          </small>
          {errors.email && <span className="error-text">{errors.email}</span>}

          <label>Phone Number *</label>
          <input 
            type="tel"
            value={phone} 
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="Enter 10 digit mobile number"
            pattern="[0-9]{10}"
            maxLength="10"
            title="Please enter exactly 10 digits"
          />
          {phone && phone.length !== 10 && !errors.phone && (
            <small style={{color: '#ef4444'}}>Must be 10 digits</small>
          )}
          {errors.phone && <span className="error-text">{errors.phone}</span>}

          <label>Skills (comma separated)</label>
          <input value={skills} onChange={(e) => setSkills(e.target.value)} />

          <div className="form-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}>
              {tech ? "Update Technician" : "Add Technician"}
            </button>
          </div>
        </form>
      </div>
      
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </div>
  );
}

export default TechForm;