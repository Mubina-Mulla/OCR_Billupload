// src/components/TechManagement/TechnicianCard.jsx
import React from "react";
import "./TechCards.css";

const TechnicianCard = ({ tech, onEdit, onDelete }) => {
  if (!tech) return null;

  const getStatusClass = (status) => {
    const statusMap = {
      'Available': 'status-available',
      'Busy': 'status-busy',
      'Offline': 'status-offline'
    };
    return statusMap[status] || 'status-available';
  };

  const renderSkills = (skills) => {
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return "—";
    }
    
    return (
      <div className="skills-container">
        {skills.slice(0, 3).map((skill, index) => (
          <span key={index} className="skill-tag">
            {skill.trim()}
          </span>
        ))}
        {skills.length > 3 && (
          <span className="skill-tag">+{skills.length - 3}</span>
        )}
      </div>
    );
  };

  return (
    <div className="technician-card" data-status={tech.status}>
      <h3>{tech.name}</h3>
      <p>Address: {tech.address || "—"}</p>
      <p>Email: {tech.email}</p>
      <p>Phone: {tech.phone || "—"}</p>
      <p>
        Skills: {renderSkills(tech.skills)}
      </p>
      <p>
        Status: {tech.status || "Available"}
        <span className={`status-badge ${getStatusClass(tech.status)}`}>
          {tech.status || "Available"}
        </span>
      </p>

      <div className="card-actions">
        <button onClick={onEdit}>Edit</button>
        <button onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
};

export default TechnicianCard;