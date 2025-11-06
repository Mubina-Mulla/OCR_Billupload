// Updated TechList component with better skills display
import React, { useState } from "react";
import "./TechList.css";

const TechList = ({ technicians, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = technicians.filter(tech =>
    tech.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tech.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderSkills = (skills) => {
    if (!skills || !Array.isArray(skills)) return "—";
    
    return (
      <div className="skills-tags">
        {skills.slice(0, 3).map((skill, index) => (
          <span key={index} className="skill-tag">
            {skill.trim()}
          </span>
        ))}
        {skills.length > 3 && <span className="skill-tag">+{skills.length - 3}</span>}
      </div>
    );
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'Available': '#28a745',
      'Busy': '#dc3545',
      'Offline': '#6c757d'
    };
    return statusColors[status] || '#6c757d';
  };

  return (
    <div className="tech-list-container">
      <input
        type="text"
        placeholder="Search by name or email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />

      <table className="tech-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Address</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Skills</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((tech) => (
            <tr key={tech.id}>
              <td>
                <div className="tech-name">{tech.name}</div>
              </td>
              <td>{tech.address || "—"}</td>
              <td>{tech.email || "—"}</td>
              <td>{tech.phone || "—"}</td>
              <td>{renderSkills(tech.skills)}</td>
              <td>
                <div className="action-buttons">
                  <button onClick={() => onEdit(tech)}>Edit</button>
                  <button onClick={() => onDelete(tech.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {filtered.length === 0 && (
        <div className="empty-state">
          {technicians.length === 0 ? 'No technicians available' : 'No technicians found matching your search'}
        </div>
      )}
    </div>
  );
};

export default TechList;