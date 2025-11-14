import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { onSnapshot, addDoc, updateDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { getCollectionRef, getDocRef, db } from '../firebase/config';
import AddCustomer from './AddCustomer';
import AddTicket from './AddTicket';
import ConfirmDialog from './ConfirmDialog';
import Notification from './Notification';
import useNotification from '../hooks/useNotification';
import './CustomerManagement.css';

const CustomerManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddTicket, setShowAddTicket] = useState(false);
  const [ticketProductData, setTicketProductData] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', id: null });
  const { notification, showNotification, hideNotification } = useNotification();
  
  // Determine view from URL path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const customerId = pathParts[1]; // /customers/:customerId
  const productId = pathParts[3]; // /customers/:customerId/products/:productId
  
  const selectedCustomer = customerId ? customers.find(c => c.id === customerId) : null;
  const selectedProduct = productId ? products.find(p => p.id === productId) : null;
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    contactPerson: '',
    address: '',
    joinDate: ''
  });

  // Fetch customers from Firebase
  useEffect(() => {
    const customersRef = getCollectionRef('customers');
    const unsubscribe = onSnapshot(customersRef, (snapshot) => {
      const customersArray = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCustomers(customersArray);
    });

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      unsubscribe();
    };
  }, []);

  // Fetch products from Firebase
  useEffect(() => {
    const productsRef = getCollectionRef('products');
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const productsArray = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsArray);
    });
    
    return () => unsubscribe();
  }, []);

  // Fetch tickets from all users (for CustomerManagement to see all tickets)
  useEffect(() => {
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
    
    return () => {
      clearInterval(ticketInterval);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const customerData = {
      ...formData,
      joinDate: editingCustomer ? formData.joinDate : new Date().toISOString()
    };

    if (editingCustomer) {
      const customerRef = getDocRef('customers', editingCustomer.id);
      updateDoc(customerRef, customerData)
        .then(() => {
          showNotification('Customer updated successfully!', 'success');
          resetForm();
        })
        .catch(error => {
          console.error('Error updating customer:', error);
          showNotification('Error updating customer. Please try again.', 'error');
        });
    } else {
      const customersRef = getCollectionRef('customers');
      addDoc(customersRef, customerData)
        .then(() => {
          showNotification('Customer added successfully!', 'success');
          resetForm();
        })
        .catch(error => {
          console.error('Error adding customer:', error);
          showNotification('Error adding customer. Please try again.', 'error');
        });
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      whatsapp: customer.whatsapp || '',
      contactPerson: customer.contactPerson || '',
      address: customer.address || '',
      joinDate: customer.joinDate || ''
    });
    setShowForm(true);
  };

  const handleDelete = (customerId, customerName) => {
    setConfirmDialog({ isOpen: true, type: 'customer', id: customerId, name: customerName });
  };

  const confirmDeleteCustomer = async () => {
    try {
      const customerRef = getDocRef('customers', confirmDialog.id);
      await deleteDoc(customerRef);
      showNotification('Customer deleted successfully!', 'success');
      navigate('/customers');
    } catch (error) {
      console.error('Error deleting customer:', error);
      showNotification('Error deleting customer. Please try again.', 'error');
    }
    setConfirmDialog({ isOpen: false, type: '', id: null, name: '' });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      whatsapp: '',
      contactPerson: '',
      address: '',
      joinDate: ''
    });
    setEditingCustomer(null);
    setShowForm(false);
  };

  const filteredCustomers = customers.filter(customer => {
    if (!searchTerm) return true; // Show all if no search term
    
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(searchTerm) ||
      customer.whatsapp?.includes(searchTerm) ||
      customer.contactPerson?.toLowerCase().includes(searchLower) ||
      customer.address?.toLowerCase().includes(searchLower)
    );
  });

  const handleShowAddCustomer = () => {
    // Clear localStorage to ensure empty form
    localStorage.removeItem('customerFormData');
    localStorage.removeItem('tempProducts');
    
    // Reset form data to clear previous values
    setFormData({
      name: '',
      phone: '',
      whatsapp: '',
      contactPerson: '',
      address: '',
      joinDate: ''
    });
    setEditingCustomer(null);
    setShowAddCustomer(true);
  };

  const handleBackToCustomerList = () => {
    setShowAddCustomer(false);
    navigate('/customers');
  };

  const handleCustomerClick = (customer) => {
    navigate(`/customers/${customer.id}`);
  };

  const handleProductClick = (product) => {
    if (selectedCustomer) {
      // Check if product has any tickets before navigating
      const productTickets = tickets.filter(ticket => 
        ticket.productId === product.id || 
        ticket.productName === (product.name || product.productName)
      );
      
      // Only navigate to tickets page if there are tickets
      if (productTickets.length > 0) {
        navigate(`/customers/${selectedCustomer.id}/products/${product.id}`);
      } else {
        // Show notification that there are no tickets yet
        showNotification('No tickets found for this product. Click "Raise Ticket" to create one.', 'info');
      }
    }
  };

  const handleBackToProducts = () => {
    if (selectedCustomer) {
      navigate(`/customers/${selectedCustomer.id}`);
    }
  };

  const handleRaiseTicket = (product) => {
    setTicketProductData({
      product: product,
      customer: selectedCustomer
    });
    setShowAddTicket(true);
  };

  const handleBackFromTicket = () => {
    setShowAddTicket(false);
    setTicketProductData(null);
  };

  // Helper functions for ticket display
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high": return "#dc2626";
      case "medium": return "#ea580c";
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

  // Show AddCustomer component when showAddCustomer is true
  if (showAddCustomer) {
    return (
      <AddCustomer 
        onBack={handleBackToCustomerList}
      />
    );
  }

  // Show AddTicket component when showAddTicket is true
  if (showAddTicket && ticketProductData) {
    return (
      <AddTicket 
        onBack={handleBackFromTicket}
        prefilledData={{
          customerName: ticketProductData.customer.name,
          customerId: ticketProductData.customer.id,
          customerPhone: ticketProductData.customer.phone,
          productName: ticketProductData.product.name || ticketProductData.product.productName,
          productId: ticketProductData.product.id,
          serialNumber: ticketProductData.product.serialNumber,
          brand: ticketProductData.product.brand,
          model: ticketProductData.product.model,
          companyName: ticketProductData.product.companyName || ticketProductData.product.brand
        }}
      />
    );
  }

  // Show Product Tickets when a product is selected
  if (selectedProduct && selectedCustomer) {
    const productTickets = tickets.filter(ticket => 
      ticket.productId === selectedProduct.id || 
      ticket.productName === (selectedProduct.name || selectedProduct.productName)
    );

    return (
      <div className="customer-management">
        <div className="customer-header">
          <button className="btn-back" onClick={handleBackToProducts}>
            ← Back to Products
          </button>
          <div className="customer-info-header">
            <div className="customer-avatar-large">
              {(selectedProduct.name || selectedProduct.productName)?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div>
              <h1>{selectedProduct.name || selectedProduct.productName}</h1>
              <div className="customer-meta">
                {selectedProduct.serialNumber && <span>🔢 {selectedProduct.serialNumber}</span>}
                {selectedProduct.brand && <span>🏢 {selectedProduct.brand}</span>}
                {selectedProduct.model && <span>📱 {selectedProduct.model}</span>}
              </div>
              <div className="customer-address">👤 {selectedCustomer.name}</div>
            </div>
          </div>
        </div>

        <div className="products-section-header">
          <h2>Product Tickets ({productTickets.length})</h2>
        </div>

        {/* Tickets List - Card Grid View */}
        <div className="customers-container">
          {productTickets.length > 0 ? (
            <div className="tickets-grid">
              {productTickets.map(ticket => (
                <div key={ticket.id} className={`ticket-card priority-${ticket.priority?.toLowerCase() || "medium"}`}>
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
                      {ticket.serialNumber && (
                        <div className="info-row">
                          <span className="info-label">Serial Number</span>
                          <span className="info-value">{ticket.serialNumber}</span>
                        </div>
                      )}
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
                        <span className="meta-value">{ticket.subOption || ticket.assignedTo || 'Unassigned'}</span>
                        <span className="meta-category">{ticket.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🎫</div>
              <h3>No tickets found</h3>
              <p>This product doesn't have any tickets yet.</p>
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

  // Show Customer Products when a customer is selected
  if (selectedCustomer) {
    const customerProducts = products.filter(product => 
      product.customerId === selectedCustomer.id
    );

    return (
      <div className="customer-management">
        <div className="customer-header">
          <button className="btn-back" onClick={handleBackToCustomerList}>
            ← Back to Customers
          </button>
          <div className="customer-info-header">
            <div className="customer-avatar-large">
              {selectedCustomer.name?.charAt(0).toUpperCase() || 'C'}
            </div>
            <div>
              <h1>{selectedCustomer.name}</h1>
              <div className="customer-meta">
                <span>📱 {selectedCustomer.phone}</span>
                {selectedCustomer.whatsapp && <span>💬 {selectedCustomer.whatsapp}</span>}
                {selectedCustomer.contactPerson && <span>👤 {selectedCustomer.contactPerson}</span>}
              </div>
              {selectedCustomer.address && (
                <div className="customer-address">📍 {selectedCustomer.address}</div>
              )}
            </div>
          </div>
        </div>

        <div className="products-section-header">
          <h2>Customer Products ({customerProducts.length})</h2>
        </div>

        {/* Products List */}
        <div className="customers-container">
          {customerProducts.length > 0 ? (
            <>
              {/* Desktop Table View */}
              {!isMobile && (
                <div className="table-responsive">
                  <table className="customers-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        {customerProducts.some(p => p.companyName) && <th>Company</th>}
                        {customerProducts.some(p => p.serialNumber) && <th>Serial Number</th>}
                        {customerProducts.some(p => p.brand || p.model) && <th>Brand/Model</th>}
                        {customerProducts.some(p => p.purchaseDate) && <th>Purchase Date</th>}
                        {customerProducts.some(p => p.warrantyExpiry) && <th>Warranty</th>}
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerProducts.map(product => (
                        <tr key={product.id}>
                          <td style={{ cursor: 'pointer' }} onClick={() => handleProductClick(product)}>
                            <div className="customer-info">
                              <div className="customer-avatar">
                                {(product.name || product.productName)?.charAt(0).toUpperCase() || 'P'}
                              </div>
                              <div className="customer-details">
                                <div className="customer-name">{product.name || product.productName || 'Unnamed Product'}</div>
                              </div>
                            </div>
                          </td>
                          {customerProducts.some(p => p.companyName) && (
                            <td style={{ cursor: 'pointer' }} onClick={() => handleProductClick(product)}>{product.companyName || '-'}</td>
                          )}
                          {customerProducts.some(p => p.serialNumber) && (
                            <td style={{ cursor: 'pointer' }} onClick={() => handleProductClick(product)}>{product.serialNumber || '-'}</td>
                          )}
                          {customerProducts.some(p => p.brand || p.model) && (
                            <td style={{ cursor: 'pointer' }} onClick={() => handleProductClick(product)}>
                              {product.brand && <div>{product.brand}</div>}
                              {product.model && <div className="product-model">{product.model}</div>}
                              {!product.brand && !product.model && '-'}
                            </td>
                          )}
                          {customerProducts.some(p => p.purchaseDate) && (
                            <td style={{ cursor: 'pointer' }} onClick={() => handleProductClick(product)}>
                              {product.purchaseDate 
                                ? new Date(product.purchaseDate).toLocaleDateString() 
                                : '-'}
                            </td>
                          )}
                          {customerProducts.some(p => p.warrantyExpiry) && (
                            <td style={{ cursor: 'pointer' }} onClick={() => handleProductClick(product)}>
                              {product.warrantyExpiry 
                                ? new Date(product.warrantyExpiry).toLocaleDateString() 
                                : '-'}
                            </td>
                          )}
                          <td>
                            <button 
                              className="btn-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRaiseTicket(product);
                              }}
                              style={{
                                padding: '8px 16px',
                                fontSize: '0.875rem',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              🎫 Raise Ticket
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Mobile Card View */}
              {isMobile && (
                <div className="customers-cards">
                  {customerProducts.map(product => (
                    <div key={product.id} className="customer-card">
                      <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => handleProductClick(product)}>
                        <div className="customer-info">
                          <div className="customer-avatar">
                            {(product.name || product.productName)?.charAt(0).toUpperCase() || 'P'}
                          </div>
                          <div className="customer-details">
                            <div className="customer-name">{product.name || product.productName || 'Unnamed Product'}</div>
                            <div className="customer-id">Serial: {product.serialNumber || 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="card-content">
                        <div className="product-row">
                          <div className="product-info">
                            <div className="product-name">{product.name || product.productName}</div>
                            <div className="product-company">{product.companyName || product.brand || 'No company'}</div>
                            <div className="product-serial">SN: {product.serialNumber || 'N/A'}</div>
                          </div>
                        </div>
                        
                        <div className="product-row" style={{ borderBottom: 'none', paddingTop: '16px' }}>
                          <button 
                            className="raise-ticket-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRaiseTicket(product);
                            }}
                          >
                            🎫 Raise Ticket
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No products found</h3>
              <p>This customer doesn't have any products yet.</p>
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
    <div className="customer-management">
      <div className="customer-header">
        <h1>Customer Management</h1>
        <div className="header-actions">
          <button 
            className="btn-primary add-customer-btn"
            onClick={handleShowAddCustomer}
          >
            <span className="btn-icon">+</span> 
            <span className="btn-text">Add New Customer</span>
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Inline Add/Edit Form Modal */}
      {showForm && (
        <div className="form-modal">
          <div className="form-card">
            <div className="form-header">
              <h2>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="Enter customer name" 
                  />
                </div>
                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="Enter mobile number" 
                  />
                </div>
                <div className="form-group">
                  <label>WhatsApp Number</label>
                  <input 
                    type="tel" 
                    name="whatsapp" 
                    value={formData.whatsapp} 
                    onChange={handleInputChange} 
                    placeholder="Enter WhatsApp number" 
                  />
                </div>
                <div className="form-group">
                  <label>Contact Person</label>
                  <input 
                    type="text" 
                    name="contactPerson" 
                    value={formData.contactPerson} 
                    onChange={handleInputChange} 
                    placeholder="Enter contact person" 
                  />
                </div>
                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea 
                    name="address" 
                    value={formData.address} 
                    onChange={handleInputChange} 
                    rows="3" 
                    placeholder="Enter customer address" 
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary submit-btn">
                  {editingCustomer ? 'Update Customer' : 'Add Customer'}
                </button>
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customers List */}
      <div className="customers-container">
        {filteredCustomers.length > 0 ? (
          <>
            {/* Desktop Table View */}
            {!isMobile && (
              <div className="table-responsive">
                <table className="customers-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Contact</th>
                      <th>Address</th>
                      <th>Join Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map(customer => (
                      <tr key={customer.id}>
                        <td>
                          <div className="customer-info clickable" onClick={() => handleCustomerClick(customer)}>
                            <div className="customer-avatar">
                              {customer.name?.charAt(0).toUpperCase() || 'C'}
                            </div>
                            <div className="customer-details">
                              <div className="customer-name">{customer.name}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="contact-info">
                            <div className="phone">📱 {customer.phone}</div>
                            {customer.whatsapp && <div className="whatsapp">💬 {customer.whatsapp}</div>}
                            {customer.contactPerson && <div className="contact-person">👤 {customer.contactPerson}</div>}
                          </div>
                        </td>
                        <td>{customer.address || 'No address provided'}</td>
                        <td>{customer.joinDate ? new Date(customer.joinDate).toLocaleDateString() : 'N/A'}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="btn-action btn-edit" 
                              onClick={() => handleEdit(customer)}
                              title="Edit customer"
                            >
                              <span className="action-icon">✏️</span>
                              <span className="action-text"></span>
                            </button>
                            <button 
                              className="btn-action btn-delete" 
                              onClick={() => handleDelete(customer.id, customer.name)}
                              title="Delete customer"
                            >
                              <span className="action-icon">🗑️</span>
                              <span className="action-text"></span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile Card View */}
            {isMobile && (
              <div className="customers-cards">
                {filteredCustomers.map(customer => (
                  <div key={customer.id} className="customer-card">
                    <div className="card-header">
                      <div className="customer-info clickable" onClick={() => handleCustomerClick(customer)}>
                        <div className="customer-avatar">
                          {customer.name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div className="customer-details">
                          <div className="customer-name">{customer.name}</div>
                        </div>
                      </div>
                      <div className="card-actions">
                        <button 
                          className="btn-action btn-edit" 
                          onClick={() => handleEdit(customer)}
                        >
                          <span className="action-icon">✏️</span>
                        </button>
                        <button 
                          className="btn-action btn-delete" 
                          onClick={() => handleDelete(customer.id, customer.name)}
                        >
                          <span className="action-icon">🗑️</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="card-content">
                      <div className="card-section">
                        <h4>Contact Information</h4>
                        <div className="contact-info">
                          <div className="contact-item">📱 {customer.phone}</div>
                          {customer.whatsapp && <div className="contact-item">💬 {customer.whatsapp}</div>}
                          {customer.contactPerson && <div className="contact-item">👤 {customer.contactPerson}</div>}
                        </div>
                      </div>
                      
                      <div className="card-section">
                        <h4>Address</h4>
                        <p>{customer.address || 'No address provided'}</p>
                      </div>
                      
                      <div className="card-footer">
                        <div className="join-date">
                          <span className="date-label">Joined:</span>
                          <span>{customer.joinDate ? new Date(customer.joinDate).toLocaleDateString() : 'N/A'}</span>
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
            <div className="empty-icon">👥</div>
            <h3>No customers found</h3>
            <p>
              {searchTerm 
                ? `No customers match "${searchTerm}". Try a different search.`
                : "Get started by adding your first customer."
              }
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
        title={`Delete ${confirmDialog.type === 'customer' ? 'Customer' : 'Product'}`}
        message={`Are you sure you want to delete "${confirmDialog.name}"?`}
        onConfirm={confirmDialog.type === 'customer' ? confirmDeleteCustomer : null}
        onCancel={() => setConfirmDialog({ isOpen: false, type: '', id: null, name: '' })}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default CustomerManagement;