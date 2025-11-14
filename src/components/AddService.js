import React, { useState, useEffect } from 'react';
import { addDoc, updateDoc } from 'firebase/firestore';
import { getCollectionRef, getDocRef } from '../firebase/config';
import Notification from './Notification';
import useNotification from '../hooks/useNotification';
import './AddService.css';

const AddService = ({ onBack, onServiceAddedOrUpdated, editingService }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    serviceCenterName: '',
    address: '',
    mobileNumber: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { notification, showNotification, hideNotification } = useNotification();

  useEffect(() => {
    if (editingService) {
      setFormData({
        companyName: editingService.companyName || '',
        serviceCenterName: editingService.serviceCenterName || '',
        address: editingService.address || '',
        mobileNumber: editingService.mobileNumber || ''
      });
    }
  }, [editingService]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Validate and format mobile number (only digits, max 10)
    if (name === 'mobileNumber') {
      const digitsOnly = value.replace(/\D/g, '');
      const limitedDigits = digitsOnly.slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: limitedDigits }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate mobile number (exactly 10 digits)
    if (formData.mobileNumber.length !== 10) {
      showNotification('Mobile number must be exactly 10 digits', 'error');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const serviceData = {
        ...formData,
        createdAt: editingService ? editingService.createdAt : new Date().toISOString()
      };

      if (editingService) {
        // Update existing service
        const serviceRef = getDocRef('services', editingService.id);
        await updateDoc(serviceRef, serviceData);
        showNotification('Service updated successfully!', 'success');
      } else {
        // Add new service
        const servicesRef = getCollectionRef('services');
        await addDoc(servicesRef, serviceData);
        showNotification('Service added successfully!', 'success');
      }

      onServiceAddedOrUpdated();
    } catch (error) {
      console.error('Error saving service:', error);
      showNotification('Error saving service. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-service">
      <div className="technicians-header">
        <h1>{editingService ? 'Edit Service' : 'Add New Service'}</h1>
        <button type="button" className="btn-primary" onClick={onBack}>
          <span className="btn-icon">←</span> Back to Services
        </button>
      </div>

      <div className="add-service-container">
        <div className="add-service-card">
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Company & Service Center Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Company Name *</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter company name"
                  />
                </div>

                <div className="form-group">
                  <label>Service Center Name *</label>
                  <input
                    type="text"
                    name="serviceCenterName"
                    value={formData.serviceCenterName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter service center name"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Address *</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    required
                    placeholder="Enter complete address"
                  />
                </div>

                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter 10 digit mobile number"
                    pattern="[0-9]{10}"
                    maxLength="10"
                    title="Please enter exactly 10 digits"
                  />
                  {formData.mobileNumber && formData.mobileNumber.length !== 10 && (
                    <small style={{color: '#ef4444', display: 'block', marginTop: '0.25rem'}}>
                      Must be 10 digits
                    </small>
                  )}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? (editingService ? 'Updating Service...' : 'Adding Service...') :
                 (editingService ? 'Update Service' : 'Add Service')}
              </button>
              <button type="button" className="btn-secondary" onClick={onBack} disabled={isSubmitting}>
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
};

export default AddService;