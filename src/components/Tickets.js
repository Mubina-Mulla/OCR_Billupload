import React, { useState, useEffect } from "react";
import { onSnapshot, deleteDoc, updateDoc, getDocs, collection, doc } from "firebase/firestore";
import { db, getCollectionRef, getDocRef } from "../firebase/config";
import ConfirmDialog from './ConfirmDialog';
import Notification from './Notification';
import useNotification from '../hooks/useNotification';
import "./Tickets.css";

const Tickets = ({ filterCategory, excludeResolved = false }) => {
  const [tickets, setTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [allCategories, setAllCategories] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [technicians, setTechnicians] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', ticketId: null });
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "table"
  const { notification, showNotification, hideNotification } = useNotification();


  // Get current user ID for user-specific tickets
  const getCurrentUserId = () => {
    try {
      const currentAdmin = localStorage.getItem('currentAdmin');
      const superAdmin = localStorage.getItem('superAdmin');
      
      console.log('🔍 Tickets.js - Getting user ID');
      console.log('currentAdmin raw:', currentAdmin);
      console.log('superAdmin raw:', superAdmin);
      
      if (currentAdmin) {
        const adminData = JSON.parse(currentAdmin);
        const userId = adminData?.userId || adminData?.id;
        console.log('🆔 Tickets.js - Extracted user ID from currentAdmin:', userId);
        return userId;
      }
      
      if (superAdmin) {
        const adminData = JSON.parse(superAdmin);
        const userId = adminData?.userId || adminData?.id;
        console.log('🆔 Tickets.js - Extracted user ID from superAdmin:', userId);
        return userId;
      }
      
      console.log('❌ Tickets.js - No admin data found');
      return null;
    } catch (error) {
      console.error('❌ Tickets.js - Error getting user ID:', error);
      return null;
    }
  };

  useEffect(() => {
    const currentUserId = getCurrentUserId();
    
    if (!currentUserId) {
      console.error('No user ID found. Please login again.');
      return;
    }

    // Read tickets from user-specific path: /mainData/Billuload/users/{userId}/tickets
    const userTicketsRef = collection(db, 'mainData', 'Billuload', 'users', currentUserId, 'tickets');
    const unsubscribe = onSnapshot(userTicketsRef, (snapshot) => {
      const ticketsArray = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTickets(ticketsArray);
      const categories = [...new Set(ticketsArray.map(t => t.category).filter(Boolean))];
      setAllCategories(categories);
    }, (error) => {
      console.error('Error fetching user tickets:', error);
      // If subcollection doesn't exist yet, just set empty array
      setTickets([]);
      setAllCategories([]);
    });

    return () => unsubscribe();
  }, []);

  // Fetch technicians
  useEffect(() => {
    const techRef = getCollectionRef("technicians");
    const unsubscribe = onSnapshot(techRef, (snapshot) => {
      const techArray = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTechnicians(techArray);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = (id) => {
    setConfirmDialog({ isOpen: true, type: 'delete', ticketId: id });
  };

  const confirmDelete = async () => {
    try {
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        throw new Error('User ID not found. Please login again.');
      }
      
      const userTicketRef = doc(db, 'mainData', 'Billuload', 'users', currentUserId, 'tickets', confirmDialog.ticketId);
      await deleteDoc(userTicketRef);
      showNotification('Ticket deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting ticket:', error);
      showNotification('Error deleting ticket. Please try again.', 'error');
    }
    setConfirmDialog({ isOpen: false, type: '', ticketId: null });
  };

  const handleStatusChange = (id, newStatus) => {
    if (newStatus === "Resolved") {
      setConfirmDialog({ isOpen: true, type: 'resolve', ticketId: id });
    } else {
      updateTicketStatus(id, newStatus);
    }
  };

  const updateTicketStatus = async (id, newStatus) => {
    try {
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        throw new Error('User ID not found. Please login again.');
      }
      
      const userTicketRef = doc(db, 'mainData', 'Billuload', 'users', currentUserId, 'tickets', id);
      await updateDoc(userTicketRef, { status: newStatus });
      showNotification('Ticket status updated!', 'success');
    } catch (error) {
      console.error('Error updating ticket:', error);
      showNotification('Error updating ticket. Please try again.', 'error');
    }
  };

  const confirmResolve = async () => {
    try {
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        throw new Error('User ID not found. Please login again.');
      }
      
      const userTicketRef = doc(db, 'mainData', 'Billuload', 'users', currentUserId, 'tickets', confirmDialog.ticketId);
      await updateDoc(userTicketRef, { status: 'Resolved' });
      showNotification('Ticket resolved successfully!', 'success');
    } catch (error) {
      console.error('Error resolving ticket:', error);
      showNotification('Error resolving ticket. Please try again.', 'error');
    }
    setConfirmDialog({ isOpen: false, type: '', ticketId: null });
  };

  // ✅ Updated Priority Colors: High=Red, Medium=Yellow, Low=Green
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high": return "#dc2626";   // Red for High
      case "medium": return "#facc15"; // Yellow for Medium
      case "low": return "#16a34a";    // Green for Low
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

  const normalizeString = (str) => {
    if (!str) return '';
    return str.toString().toLowerCase().trim().replace(/\s+/g, ' ');
  };

  const filterTicketsByDate = (ticket) => {
    if (!selectedDate) return true;
    const ticketDate = new Date(ticket.createdAt);
    const filterDate = new Date(selectedDate);
    return ticketDate.getFullYear() === filterDate.getFullYear() &&
           ticketDate.getMonth() === filterDate.getMonth() &&
           ticketDate.getDate() === filterDate.getDate();
  };

  const filteredTickets = tickets
    .filter(ticket => {
      const categoryMatch = filterCategory 
        ? normalizeString(ticket.category) === normalizeString(filterCategory)
        : true;
      const dateMatch = filterTicketsByDate(ticket);
      const priorityMatch = selectedPriority ? ticket.priority === selectedPriority : true;
      const resolvedMatch = excludeResolved ? ticket.status !== 'Resolved' : true;
      return categoryMatch && dateMatch && priorityMatch && resolvedMatch;
    })
    .sort((a, b) => {
      // Sort by newest first (createdAt descending)
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA;
    });

  const getCategoryDisplayName = (category) => {
    const categoryMap = {
      "demo": "Demo",
      "service": "Service", 
      "third party": "Third Party",
      "in store": "In Store"
    };
    const normalizedCategory = normalizeString(category);
    return categoryMap[normalizedCategory] || category;
  };

  return (
    <div className="tickets-container">
      <div className="tickets-header">
        <div className="header-main">
          <h1>Ticket Management</h1>
          <div className="header-controls">
            <div className="tickets-count">
              {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'} found
              {filterCategory && ` in "${getCategoryDisplayName(filterCategory)}"`}
              {selectedDate && ` on ${new Date(selectedDate).toLocaleDateString()}`}
            </div>

            <div className="filter-section">
              <div className="view-toggle-section">
                <label className="filter-label">View:</label>
                <div className="view-toggle-buttons">
                  <button
                    className={`view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                    onClick={() => setViewMode("grid")}
                  >
                    <span className="view-icon">⊞</span>
                    Grid
                  </button>
                  <button
                    className={`view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
                    onClick={() => setViewMode("table")}
                  >
                    <span className="view-icon">☰</span>
                    Table
                  </button>
                </div>
              </div>

              <div className="status-filter">
                <label htmlFor="priorityFilter" className="filter-label">
                  Priority:
                </label>
                <select
                  id="priorityFilter"
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                </select>
              </div>
              

              <div className="date-filter-section">
                <label htmlFor="dateFilter" className="date-filter-label">
                  Date:
                </label>
                <input
                  type="date"
                  id="dateFilter"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="date-filter-input"
                />
                {selectedDate && (
                  <button 
                    className="clear-date-filter"
                    onClick={() => setSelectedDate("")}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="tickets-grid">
          {filteredTickets.length > 0 ? (
            filteredTickets.map(ticket => (
              <div
                key={ticket.id}
                className={`ticket-card priority-${ticket.priority?.toLowerCase() || "medium"}`}
              >
                <div className="ticket-header">
                  <div className="header-top">
                    <h3 className="ticket-number">#{ticket.ticketNumber}</h3>
                    <div 
                      className="status-badge" 
                      style={{ backgroundColor: getStatusColor(ticket.status) }}
                    >
                      <span className="status-icon">{getStatusIcon(ticket.status)}</span>
                      {ticket.status}
                    </div>
                  </div>
                </div>

                <div className="ticket-body">
                  <div className="info-section">
                    <div className="info-row">
                      <span className="info-label">Customer</span>
                      <span className="info-value">{ticket.customerName}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Product</span>
                      <span className="info-value">{ticket.productName}</span>
                    </div>
                    {ticket.issueType && (
                      <div className="info-row">
                        <span className="info-label">Issue Type</span>
                        <span className="info-value">{ticket.issueType}</span>
                      </div>
                    )}
                    {ticket.createdBy && (
                      <div className="info-row">
                        <span className="info-label">Created By</span>
                        <span className="info-value admin-name">👤 {ticket.createdBy}</span>
                      </div>
                    )}
                  </div>

                  <div className="meta-section">
                    <div className="priority-info">
                      <span className="meta-label">Priority</span>
                      <div 
                        className="priority-tag"
                        style={{ backgroundColor: getPriorityColor(ticket.priority) }}
                      >
                        {ticket.priority}
                      </div>
                      <div className="meta-dates">
                        <div className="start-date">
                          <span className="date-label">Start:</span>
                          <span className="date-value">
                            {new Date(ticket.createdAt).toLocaleDateString('en-GB', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric' 
                            })}
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
                      <span className="meta-label">Assigned To</span>
                      <span className="meta-value">{ticket.subOption || "Unassigned"}</span>
                      <span className="meta-category">{ticket.category}</span>
                      {(ticket.category === "Demo" || ticket.category === "Service") && ticket.callId && (
                        <span className="meta-call-id">Call ID: {ticket.callId}</span>
                      )}
                      {(ticket.category === "Demo" || ticket.category === "Service") && ticket.uniqueId && (
                        <span className="meta-unique-id">🔑 ID: {ticket.uniqueId}</span>
                      )}
                    </div>
                  </div>
                  {(ticket.category === "Third Party" || ticket.category === "In Store") && ticket.note && (
                    <div className="ticket-note">
                      <span className="note-label">📝 Note:</span>
                      <span className="note-text">{ticket.note}</span>
                    </div>
                  )}
                </div>

                <div className="ticket-actions">
                  <div className="action-group">
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(ticket.id)}
                    title="Delete ticket"
                  >
                    <span className="btn-icon">🗑</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No tickets found</h3>
              <p>
                {filterCategory 
                  ? `No tickets found for "${getCategoryDisplayName(filterCategory)}".` 
                  : "No tickets available."
                }
                {selectedDate && ` on ${new Date(selectedDate).toLocaleDateString()}`}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="tickets-table-container">
          {filteredTickets.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="table-responsive">
                <table className="tickets-table">
                  <thead>
                    <tr>
                      <th>Ticket #</th>
                      <th>Customer</th>
                      <th>Product</th>
                      <th>Issue Type</th>
                      <th>Created By</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Assigned To</th>
                      <th>Category</th>
                      <th>Call ID</th>
                      <th>Unique ID</th>
                      <th>Created Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map(ticket => (
                      <tr key={ticket.id} className={`table-row priority-${ticket.priority?.toLowerCase() || "medium"}`}>
                        <td className="ticket-number-cell">#{ticket.ticketNumber}</td>
                        <td className="customer-cell">{ticket.customerName}</td>
                        <td className="product-cell">{ticket.productName}</td>
                        <td className="issue-cell">{ticket.issueType || 'N/A'}</td>
                        <td className="admin-cell">
                          {ticket.createdBy ? (
                            <span className="admin-name-table">👤 {ticket.createdBy}</span>
                          ) : (
                            <span className="admin-name-table unknown">Unknown</span>
                          )}
                        </td>
                        <td className="priority-cell">
                          <div 
                            className="priority-tag-small"
                            style={{ backgroundColor: getPriorityColor(ticket.priority) }}
                          >
                            {ticket.priority}
                          </div>
                        </td>
                        <td className="status-cell">
                          <div 
                            className="status-badge-small" 
                            style={{ backgroundColor: getStatusColor(ticket.status) }}
                          >
                            <span className="status-icon">{getStatusIcon(ticket.status)}</span>
                            {ticket.status}
                          </div>
                        </td>
                        <td className="assigned-cell">{ticket.subOption || "Unassigned"}</td>
                        <td className="category-cell">{ticket.category}</td>
                        <td className="call-id-cell">
                          {(ticket.category === "Demo" || ticket.category === "Service") 
                            ? (ticket.callId || 'N/A') 
                            : '-'
                          }
                        </td>
                        <td className="unique-id-cell">
                          {(ticket.category === "Demo" || ticket.category === "Service") 
                            ? (ticket.uniqueId || 'N/A') 
                            : '-'
                          }
                        </td>
                        <td className="date-cell">
                          {new Date(ticket.createdAt).toLocaleDateString('en-GB', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric' 
                          })}
                        </td>
                        <td className="actions-cell">
                          <div className="table-actions">
                            <select
                              value={ticket.status}
                              onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                              className="status-select-small"
                            >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                            </select>
                            <button
                              className="btn-delete-small"
                              onClick={() => handleDelete(ticket.id)}
                              title="Delete ticket"
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (hidden on desktop, shown on mobile) */}
              <div className="mobile-cards">
                {filteredTickets.map(ticket => (
                  <div key={`mobile-${ticket.id}`} className="mobile-ticket-card">
                    <div className="mobile-card-header">
                      <span className="mobile-ticket-number">#{ticket.ticketNumber}</span>
                      <div 
                        className="status-badge-small" 
                        style={{ backgroundColor: getStatusColor(ticket.status) }}
                      >
                        <span className="status-icon">{getStatusIcon(ticket.status)}</span>
                        {ticket.status}
                      </div>
                    </div>

                    <div className="mobile-card-body">
                      <div className="mobile-info-row">
                        <span className="mobile-info-label">Customer</span>
                        <span className="mobile-info-value">{ticket.customerName}</span>
                      </div>
                      <div className="mobile-info-row">
                        <span className="mobile-info-label">Product</span>
                        <span className="mobile-info-value">{ticket.productName}</span>
                      </div>
                      <div className="mobile-info-row">
                        <span className="mobile-info-label">Issue Type</span>
                        <span className="mobile-info-value">{ticket.issueType || 'N/A'}</span>
                      </div>
                      {ticket.createdBy && (
                        <div className="mobile-info-row">
                          <span className="mobile-info-label">Created By</span>
                          <span className="mobile-info-value admin-name">👤 {ticket.createdBy}</span>
                        </div>
                      )}
                      <div className="mobile-info-row">
                        <span className="mobile-info-label">Priority</span>
                        <div 
                          className="priority-tag-small"
                          style={{ backgroundColor: getPriorityColor(ticket.priority) }}
                        >
                          {ticket.priority}
                        </div>
                      </div>
                      <div className="mobile-info-row">
                        <span className="mobile-info-label">Assigned To</span>
                        <span className="mobile-info-value">{ticket.subOption || "Unassigned"}</span>
                      </div>
                      <div className="mobile-info-row">
                        <span className="mobile-info-label">Category</span>
                        <span className="mobile-info-value">{ticket.category}</span>
                      </div>
                      <div className="mobile-info-row">
                        <span className="mobile-info-label">Created</span>
                        <span className="mobile-info-value">
                          {new Date(ticket.createdAt).toLocaleDateString('en-GB', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                      {(ticket.category === "Demo" || ticket.category === "Service") && ticket.callId && (
                        <div className="mobile-info-row">
                          <span className="mobile-info-label">Call ID</span>
                          <span className="mobile-info-value">{ticket.callId}</span>
                        </div>
                      )}
                      {(ticket.category === "Demo" || ticket.category === "Service") && ticket.uniqueId && (
                        <div className="mobile-info-row">
                          <span className="mobile-info-label">Unique ID</span>
                          <span className="mobile-info-value">{ticket.uniqueId}</span>
                        </div>
                      )}
                    </div>

                    <div className="mobile-card-actions">
                      <select
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                        className="mobile-status-select"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                      <button
                        className="mobile-delete-btn"
                        onClick={() => handleDelete(ticket.id)}
                        title="Delete ticket"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No tickets found</h3>
              <p>
                {filterCategory 
                  ? `No tickets found for "${getCategoryDisplayName(filterCategory)}".` 
                  : "No tickets available."
                }
                {selectedDate && ` on ${new Date(selectedDate).toLocaleDateString()}`}
              </p>
            </div>
          )}
        </div>
      )}
      
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.type === 'delete' ? 'Delete Ticket' : 'Resolve Ticket'}
        message={
          confirmDialog.type === 'delete'
            ? 'Are you sure you want to delete this ticket?'
            : 'Are you sure you want to mark this ticket as resolved?'
        }
        onConfirm={confirmDialog.type === 'delete' ? confirmDelete : confirmResolve}
        onCancel={() => setConfirmDialog({ isOpen: false, type: '', ticketId: null })}
        confirmText="OK"
        cancelText="Cancel"
        type={confirmDialog.type === 'delete' ? 'danger' : 'warning'}
      />
    </div>
  );
};

export default Tickets;