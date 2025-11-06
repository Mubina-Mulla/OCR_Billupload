import React, { useState, useEffect } from "react";
import { ref, onValue, remove, update } from "firebase/database";
import { db } from "../firebase/config";
import ConfirmDialog from './ConfirmDialog';
import Notification from './Notification';
import useNotification from '../hooks/useNotification';
import "./Tickets.css";

const Tickets = ({ filterCategory }) => {
  const [tickets, setTickets] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', ticketId: null });
  const { notification, showNotification, hideNotification } = useNotification();

  useEffect(() => {
    const ticketsRef = ref(db, "tickets");
    const unsubscribe = onValue(ticketsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const ticketsArray = Object.entries(data).map(([id, ticket]) => ({
          id,
          ...ticket,
        }));
        setTickets(ticketsArray);
        const categories = [...new Set(ticketsArray.map(t => t.category).filter(Boolean))];
        setAllCategories(categories);
      } else {
        setTickets([]);
        setAllCategories([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = (id) => {
    setConfirmDialog({ isOpen: true, type: 'delete', ticketId: id });
  };

  const confirmDelete = async () => {
    try {
      const ticketRef = ref(db, `tickets/${confirmDialog.ticketId}`);
      await remove(ticketRef);
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
      const ticketRef = ref(db, `tickets/${id}`);
      await update(ticketRef, { status: newStatus });
      showNotification('Ticket status updated!', 'success');
    } catch (error) {
      console.error('Error updating ticket:', error);
      showNotification('Error updating ticket. Please try again.', 'error');
    }
  };

  const confirmResolve = async () => {
    try {
      const ticketRef = ref(db, `tickets/${confirmDialog.ticketId}`);
      await remove(ticketRef);
      showNotification('Ticket resolved and removed successfully!', 'success');
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
      const statusMatch = ticket.status !== "Resolved";
      const dateMatch = filterTicketsByDate(ticket);
      const priorityMatch = selectedStatus ? ticket.priority === selectedStatus : true;
      return categoryMatch && statusMatch && dateMatch && priorityMatch;
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
              <div className="status-filter">
                <label htmlFor="statusFilter" className="filter-label">
                  Priority:
                </label>
                <select
                  id="statusFilter"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
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
                  <div className="info-row">
                    <span className="info-label">Serial No</span>
                    <span className="info-value">{ticket.serialNumber || '-'}</span>
                  </div>
                  {ticket.issueType && (
                    <div className="info-row">
                      <span className="info-label">Issue Type</span>
                      <span className="info-value">{ticket.issueType}</span>
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
                    <span className="meta-date">
                      {new Date(ticket.createdAt).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="assigned-info">
                    <span className="meta-label">Assigned To</span>
                    <span className="meta-value">{ticket.subOption || "Unassigned"}</span>
                    <span className="meta-category">{ticket.category}</span>
                  </div>
                </div>
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
            : 'Are you sure you want to resolve this ticket?\n\nThis action will remove the ticket from the list.'
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