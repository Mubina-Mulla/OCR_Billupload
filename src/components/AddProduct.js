import React, { useState, useEffect } from 'react';
import { addDoc, updateDoc } from 'firebase/firestore';
import { getCollectionRef, getDocRef } from '../firebase/config';
import AddTicket from './AddTicket';
import Notification from './Notification';
import useNotification from '../hooks/useNotification';
import './AddProduct.css';

const AddProduct = ({ onBack, onProductAdded, customer, editMode = false, productData = null }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    serialNumber: '',
    name: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddTicket, setShowAddTicket] = useState(false);
  const [savedProduct, setSavedProduct] = useState(null);
  const { notification, showNotification, hideNotification } = useNotification();

  // Prefill form in edit mode
  useEffect(() => {
    if (editMode && productData) {
      console.log('🔧 Edit mode - productData:', productData);
      setFormData({
        companyName: productData.companyName || '',
        serialNumber: productData.serialNumber || productData.serialNo || '',
        name: productData.name || productData.productName || ''
      });
    }
  }, [editMode, productData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.companyName || !formData.serialNumber || !formData.name) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const productPayload = {
        companyName: formData.companyName,
        serialNumber: formData.serialNumber,
        name: formData.name,
        customerName: customer?.name || '',
        customerId: customer?.id || '',
        status: 'active',
        createdAt: editMode ? (productData?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      };

      // Add updatedAt if in edit mode
      if (editMode) {
        productPayload.updatedAt = new Date().toISOString();
      }

      if (editMode && productData) {
        console.log('🔧 Edit mode - updating product...');
        
        // Check if it's a saved product (has Firebase id) or temporary product (has tempId)
        if (productData.id && !productData.tempId && productData.id !== 'undefined' && productData.id.length > 5) {
          // Update existing Firebase product
          const productRef = getDocRef('products', productData.id);
          await updateDoc(productRef, productPayload);
          if (onProductAdded) onProductAdded({ ...productPayload, id: productData.id });
          showNotification('Product updated successfully!', 'success');
        } else {
          // Update temporary product
          const updatedProduct = { 
            ...productPayload, 
            tempId: productData.tempId || Date.now(),
            id: productData.id && productData.id !== 'undefined' ? productData.id : undefined
          };
          if (onProductAdded) onProductAdded(updatedProduct);
          showNotification('Product updated successfully!', 'success');
        }
      } else {
        // Create new product
        const productsRef = getCollectionRef('products');
        const newProductRef = await addDoc(productsRef, productPayload);
        if (onProductAdded) onProductAdded({ ...productPayload, id: newProductRef.id });
        showNotification('Product added successfully!', 'success');
      }

      setSavedProduct(productPayload);
      onBack();
    } catch (error) {
      console.error('Error saving product:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'unavailable' || error.message.includes('ERR_INTERNET_DISCONNECTED')) {
        showNotification('No internet connection. Product will be saved when you reconnect.', 'warning');
      } else if (error.code === 'permission-denied') {
        showNotification('Permission denied. Please check your Firebase rules.', 'error');
      } else {
        showNotification('Error saving product. Please try again.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showAddTicket && savedProduct) {
    return (
      <AddTicket
        onBack={() => setShowAddTicket(false)}
        onTicketAdded={() => {
          setShowAddTicket(false);
          onBack();
        }}
        productData={savedProduct}
        customer={customer}
      />
    );
  }

  return (
    <div className="add-product">
      <div className="service-header">
        <h1>{editMode ? 'Edit Product' : 'Add Product'}</h1>
        <button 
          className="btn-primary"
          onClick={onBack}
        >
          <span className="btn-icon">←</span> Back
        </button>
      </div>

      <div className="add-product-container">
        <div className="add-product-card">
          <form onSubmit={handleSubmit}>
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
                <label>Serial Number *</label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter serial number"
                />
              </div>
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter product name"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting
                  ? editMode
                    ? 'Updating Product...'
                    : 'Adding Product...'
                  : editMode
                  ? 'Update Product'
                  : 'Add Product'}
              </button>
              {savedProduct && (
                <button type="button" className="btn-primary" onClick={() => setShowAddTicket(true)}>
                  + Raise Ticket
                </button>
              )}
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

export default AddProduct;