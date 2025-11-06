// src/components/TechManagement/AddTechnicianPage.jsx
import React from "react";
import TechForm from "./TechForm";
import "./TechForm.css";

const AddTechnicianPage = ({ onClose }) => {
  return (
    <div className="technicians-section">
      <div className="technicians-header">
        <h1>Add New Technician</h1>
        <button className="btn-primary" onClick={onClose}>Back to Technicians</button>
      </div>

      {/* Full-page form (no modal/overlay) */}
      <TechForm tech={null} onClose={onClose} fullPage />
    </div>
  );
};

export default AddTechnicianPage;