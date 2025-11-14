import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import { getCollectionRef, getDocRef, db } from "../../firebase/config";
import { onSnapshot, deleteDoc, collection, getDocs } from "firebase/firestore";
import TechForm from "./TechForm";
import ConfirmDialog from "../ConfirmDialog";
import Notification from "../Notification";
import useNotification from "../../hooks/useNotification";
import CustomerHistory from "./CustomerHistory";
import "./TechManagement.css";

const Technicians = () => {
  const navigate = useNavigate();
  const { techId } = useParams();
  const [technicians, setTechnicians] = useState([]);
  const [filteredTechs, setFilteredTechs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTech, setEditingTech] = useState(null);
  const [showAddTech, setShowAddTech] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [selectedDate, setSelectedDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: null, name: '' });
  const { notification, showNotification, hideNotification } = useNotification();
  const [showHistory, setShowHistory] = useState(false);
  const [customerTransactions, setCustomerTransactions] = useState([]);
  
  // Get selected tech from URL
  const selectedTech = techId ? technicians.find(t => t.id === techId) : null;


  useEffect(() => {
    const techRef = getCollectionRef("technicians");
    const unsubscribeTech = onSnapshot(techRef, (snapshot) => {
      const techArray = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTechnicians(techArray);
      setFilteredTechs(techArray);
    });

    // Fetch tickets from all users (for TechManagement to see all tickets)
    const fetchAllUserTickets = async () => {
      try {
        const usersRef = getCollectionRef('users');
        const usersSnapshot = await getDocs(usersRef);
        const allTickets = [];
        
        for (const userDoc of usersSnapshot.docs) {
          const userTicketsRef = collection(db, 'mainData', 'Billuload', 'users', userDoc.id, 'tickets');
          const ticketsSnapshot = await getDocs(userTicketsRef);
          
          ticketsSnapshot.docs.forEach(ticketDoc => {
            allTickets.push({
              id: ticketDoc.id,
              userId: userDoc.id,
              userEmail: userDoc.data().email,
              userName: userDoc.data().name,
              ...ticketDoc.data()
            });
          });
        }
        
        setTickets(allTickets);
      } catch (error) {
        console.error('Error fetching user tickets:', error);
        setTickets([]);
      }
    };
    
    // Initial fetch
    fetchAllUserTickets();
    
    // Set up interval to refresh tickets every 30 seconds
    const ticketInterval = setInterval(fetchAllUserTickets, 30000);
    
    const unsubscribeTickets = () => {
      clearInterval(ticketInterval);
    };

    // Fetch customer transactions
    const transactionsRef = getCollectionRef("customerTransactions");
    const unsubscribeTransactions = onSnapshot(transactionsRef, (snapshot) => {
      const transactionsArray = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCustomerTransactions(transactionsArray);
    });

    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      unsubscribeTech();
      unsubscribeTickets();
      unsubscribeTransactions();
    };
  }, []);

  // 🔍 Search Filter
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTechs(technicians);
    } else {
      const lower = searchTerm.toLowerCase();
      const results = technicians.filter(
        (tech) =>
          tech.name?.toLowerCase().includes(lower) ||
          tech.phone?.toLowerCase().includes(lower) ||
          (Array.isArray(tech.skills) 
            ? tech.skills.some(skill => skill?.toLowerCase().includes(lower))
            : tech.skills?.toLowerCase().includes(lower)) ||
          tech.address?.toLowerCase().includes(lower)
      );
      setFilteredTechs(results);
    }
  }, [searchTerm, technicians]);

  const handleEdit = (tech) => {
    setEditingTech(tech);
    setShowAddTech(true);
  };

  const handleDelete = (id) => {
    const tech = technicians.find(t => t.id === id);
    setConfirmDialog({ isOpen: true, id, name: tech?.name || 'this technician' });
  };

  const confirmDelete = async () => {
    try {
      const techRef = getDocRef("technicians", confirmDialog.id);
      await deleteDoc(techRef);
      showNotification("Technician deleted successfully!", "success");
    } catch (error) {
      showNotification("Error deleting technician. Please try again.", "error");
    }
    setConfirmDialog({ isOpen: false, id: null, name: '' });
  };

  const handleAddTechClick = () => {
    setEditingTech(null);
    setShowAddTech(true);
  };

  const handleBackToList = () => {
    setShowAddTech(false);
    navigate('/tech');
  };

  const handleTechClick = (tech) => {
    navigate(`/tech/${tech.id}`);
  };

  const handleBackToTechList = () => {
    navigate('/tech');
  };

  const handleTechAddedOrUpdated = () => {
    setEditingTech(null);
    setShowAddTech(false);
  };

  if (showAddTech) {
    return (
      <TechForm
        tech={editingTech}
        onBack={handleBackToList}
        onTechAdded={handleTechAddedOrUpdated}
        fullPage={true}
      />
    );
  }

  // Show assigned tickets view
  if (selectedTech) {
    let techTickets = tickets.filter(ticket => 
      ticket.subOption === selectedTech.name || 
      ticket.assignedTo === selectedTech.name ||
      ticket.assignedTo === selectedTech.id
    );

    // Calculate total amount from all tickets
    // Wallet = In Store Service - In Store Commission - All Third Party Commissions
    const inStoreTotal = techTickets.reduce((sum, ticket) => {
      if (ticket.category === "In Store") {
        const serviceAmount = parseFloat(ticket.serviceAmount) || 0;
        const commissionAmount = parseFloat(ticket.commissionAmount) || 0;
        // Add (Service - Commission) for In Store
        return sum + (serviceAmount - commissionAmount);
      }
      return sum;
    }, 0);

    const thirdPartyCommissions = techTickets.reduce((sum, ticket) => {
      if (ticket.category === "Third Party") {
        const commissionAmount = parseFloat(ticket.commissionAmount) || 0;
        return sum + commissionAmount;
      }
      return sum;
    }, 0);

    // Final wallet = In Store Total - Third Party Commissions
    const totalTicketAmount = inStoreTotal - thirdPartyCommissions;

    // Calculate customer balance (total from tickets + credits - debits)
    // If no tickets, balance should be 0 regardless of transactions
    let customerBalance = 0;
    
    if (techTickets.length > 0) {
      const customerTrans = customerTransactions.filter(trans => trans.technicianId === selectedTech.id);
      const credits = customerTrans.filter(t => t.type === 'credit').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      const debits = customerTrans.filter(t => t.type === 'debit').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      customerBalance = totalTicketAmount + credits - debits;
    }

    // Filter tickets by date range
    const filterTicketsByDate = (ticket) => {
      // If using single date filter (legacy)
      if (selectedDate && !startDate && !endDate) {
        const ticketDate = new Date(ticket.createdAt);
        const filterDate = new Date(selectedDate);
        return ticketDate.getFullYear() === filterDate.getFullYear() &&
               ticketDate.getMonth() === filterDate.getMonth() &&
               ticketDate.getDate() === filterDate.getDate();
      }
      
      // If using start/end date range filter
      if (startDate || endDate) {
        const ticketStartDate = new Date(ticket.createdAt);
        const ticketEndDate = ticket.endDate ? new Date(ticket.endDate) : ticketStartDate;
        
        let matchesRange = true;
        
        // Check if ticket starts within or after the filter start date
        if (startDate) {
          const filterStartDate = new Date(startDate);
          matchesRange = matchesRange && (ticketStartDate >= filterStartDate || ticketEndDate >= filterStartDate);
        }
        
        // Check if ticket ends within or before the filter end date
        if (endDate) {
          const filterEndDate = new Date(endDate);
          filterEndDate.setHours(23, 59, 59, 999); // Include the entire end date
          matchesRange = matchesRange && (ticketStartDate <= filterEndDate || ticketEndDate <= filterEndDate);
        }
        
        return matchesRange;
      }
      
      // No date filters applied
      return true;
    };

    // Apply all filters
    techTickets = techTickets.filter(ticket => {
      const categoryMatch = categoryFilter === "All" || ticket.category === categoryFilter;
      const statusMatch = statusFilter === "All Status" || ticket.status === statusFilter;
      const dateMatch = filterTicketsByDate(ticket);
      return categoryMatch && statusMatch && dateMatch;
    });

    return (
      <div className="service-center">
        <div className="service-header">
          <button className="btn-secondary" onClick={handleBackToTechList}>
            ← Back to Technicians
          </button>
          <h1>{selectedTech.name}'s Assigned Tickets</h1>
        </div>

        <div className="tech-info-card">
          <div className="tech-info-grid">
            <div className="tech-info-item">
              <span className="tech-info-label">PHONE:</span>
              <span className="tech-info-value">{selectedTech.phone}</span>
            </div>
            <div className="tech-info-item">
              <span className="tech-info-label">SKILLS:</span>
              <span className="tech-info-value">
                {Array.isArray(selectedTech.skills) 
                  ? selectedTech.skills.join(", ") 
                  : selectedTech.skills}
              </span>
            </div>
            <div className="tech-info-item">
              <span className="tech-info-label">Wallet:</span>
              <span className="tech-info-value" style={{ fontWeight: 700, color: '#16a34a', fontSize: '1.1rem' }}>
                ₹{customerBalance.toFixed(2)}
              </span>
            </div>
            <div className="tech-info-item" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                className="btn-primary" 
                onClick={() => setShowHistory(true)}
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                📜 Transactions
              </button>
            </div>
          </div>
        </div>

        <div className="tickets-section">
          <div className="tickets-header">
            <div className="header-main">
              <h2>Assigned Tickets ({techTickets.length})</h2>
            </div>
            
            <div className="filter-buttons-container">
              <div className="filter-buttons">
                <button 
                  className={`filter-btn ${categoryFilter === "All" ? "active" : ""}`}
                  onClick={() => setCategoryFilter("All")}
                >
                  All
                </button>
                <button 
                  className={`filter-btn ${categoryFilter === "Third Party" ? "active" : ""}`}
                  onClick={() => setCategoryFilter("Third Party")}
                >
                  Third Party
                </button>
                <button 
                  className={`filter-btn ${categoryFilter === "In Store" ? "active" : ""}`}
                  onClick={() => setCategoryFilter("In Store")}
                >
                  In Store
                </button>
              </div>
              
              <div className="filter-controls-right">
                <div className="status-filter">
                  <label htmlFor="statusFilter" className="filter-label">
                    Status:
                  </label>
                  <select
                    id="statusFilter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="All Status">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                <div className="date-range-filter-section">
                  <div className="date-filter-group">
                    <label htmlFor="startDateFilter" className="date-filter-label">
                      Start Date:
                    </label>
                    <input
                      type="date"
                      id="startDateFilter"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="date-filter-input"
                    />
                  </div>
                  
                  <div className="date-filter-group">
                    <label htmlFor="endDateFilter" className="date-filter-label">
                      End Date:
                    </label>
                    <input
                      type="date"
                      id="endDateFilter"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="date-filter-input"
                    />
                  </div>
                  
                  {(startDate || endDate) && (
                    <button 
                      className="clear-date-filter"
                      onClick={() => {
                        setStartDate("");
                        setEndDate("");
                        setSelectedDate("");
                      }}
                    >
                      Clear Dates
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          {techTickets.length > 0 ? (
            <div className="tickets-grid">
              {techTickets.map(ticket => {
                const getPriorityColor = (priority) => {
                  switch (priority?.toLowerCase()) {
                    case "high": return "#dc2626";
                    case "medium": return "#facc15";
                    case "low": return "#16a34a";
                    default: return "#6b7280";
                  }
                };

                const getStatusColor = (status) => {
                  switch (status) {
                    case "Pending": return "#f59e0b";
                    case "In Progress": return "#3b82f6";
                    case "Resolved": return "#10b981";
                    default: return "#6b7280";
                  }
                };

                const getStatusIcon = (status) => {
                  switch (status) {
                    case "Pending": return "⏳";
                    case "In Progress": return "🔄";
                    case "Resolved": return "✅";
                    default: return "📋";
                  }
                };

                // Check if ticket is resolved
                const isResolved = ticket.status === "Resolved";

                return (
                  <div 
                    key={ticket.id} 
                    className="ticket-card tech-ticket-card"
                    style={{ 
                      borderLeft: `4px solid ${isResolved ? "#10b981" : getPriorityColor(ticket.priority)}`
                    }}
                  >
                    <div className="ticket-header">
                      <div className="header-top">
                        <h3 className="ticket-number">#{ticket.ticketNumber}</h3>
                        <div 
                          className="status-badge"
                          style={{ 
                            backgroundColor: isResolved ? "#10b981" : getStatusColor(ticket.status || 'Pending'),
                            color: 'white'
                          }}
                        >
                          <span className="status-icon">
                            {isResolved ? "✅" : getStatusIcon(ticket.status || 'Pending')}
                          </span>
                          {ticket.status || 'Pending'}
                        </div>
                      </div>
                    </div>

                    <div className="ticket-body">
                      <div className="info-section">
                        <div className="info-row">
                          <span className="info-label">CUSTOMER</span>
                          <span className="info-value">{ticket.customerName}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">PRODUCT</span>
                          <span className="info-value">{ticket.productName}</span>
                        </div>
                        {ticket.issueType && (
                          <div className="info-row">
                            <span className="info-label">ISSUE TYPE</span>
                            <span className="info-value">{ticket.issueType}</span>
                          </div>
                        )}
                        {ticket.createdBy && (
                          <div className="info-row">
                            <span className="info-label">CREATED BY</span>
                            <span className="info-value admin-name">👤 {ticket.createdBy}</span>
                          </div>
                        )}
                        {(ticket.category === "Third Party" || ticket.category === "In Store") && ticket.serviceAmount && (
                          <div className="info-row">
                            <span className="info-label">SERVICE AMOUNT</span>
                            <span className="info-value">₹{ticket.serviceAmount}</span>
                          </div>
                        )}
                        {(ticket.category === "Third Party" || ticket.category === "In Store") && ticket.commissionAmount && (
                          <div className="info-row">
                            <span className="info-label">COMMISSION</span>
                            <span className="info-value">₹{ticket.commissionAmount}</span>
                          </div>
                        )}
                        {(ticket.category === "Third Party" || ticket.category === "In Store") && ticket.serviceAmount && ticket.commissionAmount && (
                          <div className="info-row">
                            <span className="info-label" style={{ fontSize: '0.65rem' }}>
                              {ticket.category === "In Store" 
                                ? "TOTAL AMT (IN STORE)" 
                                : "TOTAL AMT (THIRD PARTY)"}
                            </span>
                            <span className="info-value" style={{ fontWeight: 700, color: '#16a34a' }}>
                              ₹{(parseFloat(ticket.serviceAmount) - parseFloat(ticket.commissionAmount)).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="meta-section">
                        <div className="priority-info">
                          <span className="meta-label">PRIORITY</span>
                          <div 
                            className="priority-tag"
                            style={{ 
                              backgroundColor: isResolved ? "#10b981" : getPriorityColor(ticket.priority),
                              color: 'white'
                            }}
                          >
                            {isResolved ? "COMPLETED" : (ticket.priority?.toUpperCase() || 'MEDIUM')}
                          </div>
                          <div className="meta-dates">
                            <div className="start-date">
                              <span className="date-label">Start:</span>
                              <span className="date-value">
                                {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-GB', { 
                                  day: '2-digit', 
                                  month: '2-digit', 
                                  year: 'numeric' 
                                }) : 'N/A'}
                              </span>
                            </div>
                            {ticket.endDate && (
                              <div className="end-date">
                                <span className="date-label">End:</span>
                                <span className="date-value">
                                  {new Date(ticket.endDate).toLocaleDateString('en-GB', { 
                                    day: '2-digit', 
                                    month: '2-digit', 
                                    year: 'numeric' 
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="assigned-info">
                          <span className="meta-label">ASSIGNED TO</span>
                          <span className="meta-value">{ticket.subOption || ticket.assignedTo || "Unassigned"}</span>
                          <span className="meta-category">{ticket.category || 'Third Party'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p>No tickets assigned to this technician yet.</p>
            </div>
          )}
        </div>

        <Notification
          message={notification.message}
          type={notification.type}
          isVisible={notification.isVisible}
          onClose={hideNotification}
        />

        {showHistory && (
          <CustomerHistory
            technician={selectedTech}
            transactions={customerTransactions}
            onClose={() => setShowHistory(false)}
            onTransactionAdded={() => {
              showNotification("Transaction added successfully!", "success");
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="service-center">
      <div className="service-header">
        <h1>Technician Management</h1>
        <button className="btn-primary" onClick={handleAddTechClick}>
          <span className="btn-icon">+</span> Add Technician
        </button>
      </div>

      {/* 🔍 Search Section */}
      <div className="search-section">
        <div className="search-container">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, phone, skills, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm("")}>
                ✕
              </button>
            )}
          </div>
          {searchTerm && (
            <div className="search-stats">
              <span>
                Found {filteredTechs.length} technician
                {filteredTechs.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="services-container">
        {filteredTechs.length > 0 ? (
          <>
            {!isMobile && (
              <div className="table-responsive">
                <table className="services-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Contact</th>
                      <th>Address</th>
                      <th>Skills</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTechs.map((tech) => (
                      <tr 
                        key={tech.id}
                        className="service-table-row"
                        onClick={() => handleTechClick(tech)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <div className="service-info">
                            <div className="service-icon">
                              {tech.name?.charAt(0).toUpperCase() || "T"}
                            </div>
                            <div className="service-details">
                              <div className="service-name">{tech.name}</div>
                            </div>
                          </div>
                        </td>
                        <td>{tech.phone || "N/A"}</td>
                        <td>{tech.address || "No address provided"}</td>
                        <td>{Array.isArray(tech.skills) ? tech.skills.join(", ") : (tech.skills || "No skills listed")}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="action-buttons">
                            <button
                              className="btn-icon btn-edit"
                              onClick={() => handleEdit(tech)}
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-icon btn-delete"
                              onClick={() => handleDelete(tech.id)}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {isMobile && (
              <div className="services-cards">
                {filteredTechs.map((tech) => (
                  <div 
                    key={tech.id} 
                    className="service-card clickable-service-card"
                    onClick={() => handleTechClick(tech)}
                  >
                    <div className="card-header">
                      <div className="service-info">
                        <div className="service-icon">
                          {tech.name?.charAt(0).toUpperCase() || "T"}
                        </div>
                        <div className="service-details">
                          <div className="service-name">{tech.name}</div>
                          <div className="service-id">
                            {Array.isArray(tech.skills) ? tech.skills.join(", ") : (tech.skills || "No skills listed")}
                          </div>
                        </div>
                      </div>
                      <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(tech)}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(tech.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="card-content">
                      <div className="card-section">
                        <h4>Contact Information</h4>
                        <p>📞 {tech.phone || "No phone"}</p>
                      </div>

                      <div className="card-section">
                        <h4>Address</h4>
                        <p>{tech.address || "No address provided"}</p>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">👨‍🔧</div>
            <h3>No technicians found</h3>
            <p>Try adjusting your search or add a new technician.</p>
            {/* <button className="btn-primary" onClick={handleAddTechClick}>
              Add Your First Technician
            </button> */}
          </div>
        )}
      </div>

      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Delete Technician"
        message={`Are you sure you want to delete "${confirmDialog.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, id: null, name: '' })}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

    </div>
  );
};

export default Technicians;