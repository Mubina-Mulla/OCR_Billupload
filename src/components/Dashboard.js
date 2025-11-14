import React, { useState } from 'react';
import Tickets from './Tickets';
import './Dashboard.css';

const Dashboard = () => {
  const [filterCategory, setFilterCategory] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const [showTickets, setShowTickets] = useState(true); // Show tickets by default
  const excludeResolved = true; // Dashboard should not show resolved tickets

  const sections = [
    { name: "demo", label: "Demo" },
    { name: "service", label: "Service" },
    { name: "third party", label: "Third Party Tech" },
    { name: "in store", label: "In Store" },
    { name: "in stock", label: "In Stock" },
  ];

  const handleCategoryClick = (categoryName) => {
    // Toggle behavior: if clicking the same card, show all tickets and deactivate
    if (activeFilter === categoryName && filterCategory === categoryName) {
      setFilterCategory(null); // Show all tickets
      setActiveFilter(null); // Deactivate card (change color back)
    } else {
      setFilterCategory(categoryName); // Show filtered tickets
      setActiveFilter(categoryName); // Activate card
    }
    setShowTickets(true); // Keep tickets visible
  };

  const clearFilter = () => {
    setFilterCategory(null);
    setActiveFilter(null);
    setShowTickets(true); // Keep tickets visible
  };

  return (
    <div className="dashboard">
     
     {/* Section cards */}
      <div className="dashboard-sections">
        {sections.map(section => (
          <div
            key={section.name}
            className={`section ${activeFilter === section.name ? "active" : ""}`}
            onClick={() => handleCategoryClick(section.name)}
            style={{ cursor: "pointer" }}
          >
            <h3>{section.label}</h3>
            <p>Click to view {section.label} tickets</p>
          </div>
        ))}
      </div>

      {/* Tickets Section - Always visible below category cards */}
      <div style={{ marginTop: "30px" }}>
        {filterCategory ? (
          <>
            <div style={{ marginBottom: "20px", textAlign: "center" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#2c3e50" }}>
                {sections.find(s => s.name === filterCategory)?.label} Tickets
              </h2>
            </div>
            <Tickets filterCategory={filterCategory} excludeResolved={excludeResolved} />
          </>
        ) : (
          <>
            <div style={{ marginBottom: "20px", textAlign: "center" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#2c3e50" }}>
                All Tickets
              </h2>
            </div>
            <Tickets filterCategory={null} excludeResolved={excludeResolved} />
          </>
        )}
      </div>

    </div>
  );
};

export default Dashboard;