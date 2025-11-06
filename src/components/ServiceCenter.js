import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ref, onValue, remove, update } from 'firebase/database';
import { database } from '../firebase/config';
import AddService from './AddService';
import ConfirmDialog from './ConfirmDialog';
import Notification from './Notification';
import useNotification from '../hooks/useNotification';
import './ServiceCenter.css';
import './TechManagement/TechManagement.css';

const ServiceCenter = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { serviceId } = useParams();
  const [services, setServices] = useState([]);
  const [showAddService, setShowAddService] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tickets, setTickets] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: null, name: '' });
  const { notification, showNotification, hideNotification } = useNotification();
  
  // Get selected service from URL
  const selectedService = serviceId ? services.find(s => s.id === serviceId) : null;

  useEffect(() => {
    const servicesRef = ref(database, 'services');
    onValue(servicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const servicesArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setServices(servicesArray);
      } else {
        setServices([]);
      }
    });

    // Fetch tickets
    const ticketsRef = ref(database, 'tickets');
    onValue(ticketsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const ticketsArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setTickets(ticketsArray);
      } else {
        setTickets([]);
      }
    });

    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDelete = (serviceId, serviceName) => {
    const service = services.find(s => s.id === serviceId);
    setConfirmDialog({ isOpen: true, id: serviceId, name: service?.serviceCenterName || serviceName || 'this service center' });
  };

  const confirmDelete = async () => {
    try {
      await remove(ref(database, `services/${confirmDialog.id}`));
      showNotification('Service center deleted successfully!', 'success');
    } catch (error) {
      showNotification('Error deleting service center. Please try again.', 'error');
    }
    setConfirmDialog({ isOpen: false, id: null, name: '' });
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setShowAddService(true);
  };

  const handleAddServiceClick = () => {
    setEditingService(null);
    setShowAddService(true);
  };

  const handleBackToServices = () => setShowAddService(false);

  const handleServiceAddedOrUpdated = () => {
    setEditingService(null);
    setShowAddService(false);
  };

  const handleServiceClick = (service) => {
    navigate(`/services/${service.id}`);
  };

  const handleBackToServiceList = () => {
    navigate('/services');
  };

  const filteredServices = services.filter(service =>
    service.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.serviceCenterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.mobileNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showAddService) {
    return (
      <AddService
        onBack={handleBackToServices}
        onServiceAddedOrUpdated={handleServiceAddedOrUpdated}
        editingService={editingService}
      />
    );
  }

  // Show assigned tickets view
  if (selectedService) {
    const serviceTickets = tickets.filter(ticket => {
      // Match by subOption (where service center name is stored)
      const matchesSubOption = ticket.subOption === selectedService.serviceCenterName || 
                                ticket.subOption === selectedService.companyName;
      
      // Also check if category is "Service" or "Demo" to ensure it's a service center ticket
      const isServiceTicket = ticket.category === "Service" || ticket.category === "Demo";
      
      return matchesSubOption && isServiceTicket;
    });

    return (
      <div className="service-center">
        <div className="service-header">
          <button className="btn-secondary" onClick={handleBackToServiceList}>
            ← Back to Service Centers
          </button>
          <h1>{selectedService.serviceCenterName}'s Assigned Tickets</h1>
        </div>

        <div className="tech-info-card">
          <div className="tech-info-grid">
            <div className="tech-info-item">
              <span className="tech-info-label">COMPANY:</span>
              <span className="tech-info-value">{selectedService.companyName}</span>
            </div>
            <div className="tech-info-item">
              <span className="tech-info-label">MOBILE:</span>
              <span className="tech-info-value">{selectedService.mobileNumber}</span>
            </div>
            <div className="tech-info-item full-width">
              <span className="tech-info-label">ADDRESS:</span>
              <span className="tech-info-value">{selectedService.address}</span>
            </div>
          </div>
        </div>

        <div className="tickets-section">
          <h2>Assigned Tickets ({serviceTickets.length})</h2>
          {serviceTickets.length > 0 ? (
            <div className="tickets-grid">
              {serviceTickets.map(ticket => (
                <div 
                  key={ticket.id} 
                  className="ticket-card service-ticket-card"
                >
                  <div className="ticket-header">
                    <div className="header-top">
                      <h3 className="ticket-number">#{ticket.ticketNumber}</h3>
                      <div className="status-badge status-pending">
                        <span className="status-icon">⏳</span>
                        {ticket.status || 'Pending'}
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
                        <div className="priority-tag priority-medium-tag">
                          {ticket.priority?.toUpperCase() || 'MEDIUM'}
                        </div>
                        <span className="meta-date">
                          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-GB', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric' 
                          }) : 'N/A'}
                        </span>
                      </div>
                      <div className="assigned-info">
                        <span className="meta-label">Assigned To</span>
                        <span className="meta-value">{ticket.subOption || "Unassigned"}</span>
                        <span className="meta-category">{ticket.category || 'Service'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No tickets assigned to this service center yet.</p>
            </div>
          )}
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
    <div className="service-center">
      <div className="service-header">
        <h1>Service Centers</h1>
        <button className="btn-primary" onClick={handleAddServiceClick}>
          <span className="btn-icon">+</span> Add New Service Center
        </button>
      </div>

      <div className="dashboard-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search service centers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>

      <div className="services-container">
        {filteredServices.length > 0 ? (
          <>
            {!isMobile && (
              <div className="table-responsive">
                <table className="services-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Service Center</th>
                      <th>Address</th>
                      <th>Mobile Number</th>
                      <th>Created Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServices.map(service => (
                      <tr 
                      key={service.id} 
                      className="service-table-row"
                      onClick={() => handleServiceClick(service)}
                      style={{ cursor: 'pointer' }}
                    >
                        <td>
                          <div className="service-info">
                            <div className="service-icon">{service.companyName?.charAt(0).toUpperCase() || 'C'}</div>
                            <div className="service-details">
                              <div className="service-name">{service.companyName}</div>
                            </div>
                          </div>
                        </td>
                        <td>{service.serviceCenterName}</td>
                        <td>{service.address || 'No address provided'}</td>
                        <td>{service.mobileNumber || 'N/A'}</td>
                        <td>{service.createdAt ? new Date(service.createdAt).toLocaleDateString() : 'N/A'}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="action-buttons">
                            <button className="btn-icon btn-edit" onClick={() => handleEdit(service)}>✏️</button>
                            <button className="btn-icon btn-delete" onClick={() => handleDelete(service.id)}>🗑️</button>
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
                {filteredServices.map(service => (
                  <div 
                    key={service.id} 
                    className="service-card clickable-service-card"
                    onClick={() => handleServiceClick(service)}
                  >
                    <div className="card-header">
                      <div className="service-info">
                        <div className="service-icon">{service.companyName?.charAt(0).toUpperCase() || 'C'}</div>
                        <div className="service-details">
                          <div className="service-name">{service.companyName}</div>
                          <div className="service-id">Center: {service.serviceCenterName}</div>
                        </div>
                      </div>
                      <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                        <button className="btn-icon btn-edit" onClick={() => handleEdit(service)}>✏️</button>
                        <button className="btn-icon btn-delete" onClick={() => handleDelete(service.id)}>🗑️</button>
                      </div>
                    </div>
                    
                    <div className="card-content">
                      <div className="card-section">
                        <h4>Contact Information</h4>
                        <div className="service-details-grid">
                          <div className="detail-item full-width">
                            <span className="detail-label">Mobile:</span>
                            <span className="detail-value">{service.mobileNumber || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="card-section">
                        <h4>Address</h4>
                        <p>{service.address || 'No address provided'}</p>
                      </div>
                      
                      <div className="card-footer">
                        <div className="date-section">
                          <span className="date-label">Created:</span>
                          <span>{service.createdAt ? new Date(service.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <h3>No service centers found</h3>
            <p>Try adjusting your search criteria, or add a new service center.</p>
            {/* <button className="btn-primary" onClick={handleAddServiceClick}>Add Your First Service Center</button> */}
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
        title="Delete Service Center"
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

export default ServiceCenter;