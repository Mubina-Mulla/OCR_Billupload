import React, { useState, useEffect } from 'react';
import { onSnapshot, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getCollectionRef, getDocRef } from '../firebase/config';
import AddProduct from './AddProduct';
import Notification from './Notification';
import useNotification from '../hooks/useNotification';
import './ProductManagement.css';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { notification, showNotification, hideNotification } = useNotification();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    status: 'active',
    createdAt: ''
  });

  useEffect(() => {
    const productsRef = getCollectionRef('products');
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const productsArray = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsArray);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const productData = {
      ...formData,
      createdAt: editingProduct ? formData.createdAt : new Date().toISOString()
    };

    if (editingProduct) {
      const productRef = getDocRef('products', editingProduct.id);
      updateDoc(productRef, productData)
        .then(() => {
          showNotification('Product updated successfully!', 'success');
          resetForm();
        })
        .catch(error => {
          console.error('Error updating product:', error);
          showNotification('Error updating product. Please try again.', 'error');
        });
    } else {
      const productsRef = getCollectionRef('products');
      addDoc(productsRef, productData)
        .then(() => {
          showNotification('Product added successfully!', 'success');
          resetForm();
        })
        .catch(error => {
          console.error('Error adding product:', error);
          showNotification('Error adding product. Please try again.', 'error');
        });
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      category: product.category || '',
      description: product.description || '',
      status: product.status || 'active',
      createdAt: product.createdAt || ''
    });
    setShowForm(true);
  };

  const handleDelete = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const productRef = getDocRef('products', productId);
      deleteDoc(productRef)
        .then(() => {
          showNotification('Product deleted successfully!', 'success');
        })
        .catch(error => {
          console.error('Error deleting product:', error);
          showNotification('Error deleting product. Please try again.', 'error');
        });
    }
  };

  const updateProductStatus = (productId, status) => {
    const productRef = getDocRef('products', productId);
    updateDoc(productRef, { status })
      .then(() => {
        showNotification('Product status updated successfully!', 'success');
      })
      .catch(error => {
        console.error('Error updating product status:', error);
        showNotification('Error updating product status. Please try again.', 'error');
      });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      status: 'active',
      createdAt: ''
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'out-of-stock': return 'status-out-of-stock';
      default: return '';
    }
  };


  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleAddProductClick = () => {
    setShowAddProduct(true);
  };

  const handleBackToProducts = () => {
    setShowAddProduct(false);
  };

  const handleProductAdded = () => {
    // This will be called when a product is successfully added
    // The products list will automatically update due to the Firebase listener
  };

  const filteredAndSortedProducts = products
    .filter(product => {
      const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  if (showAddProduct) {
    return (
      <AddProduct 
        onBack={handleBackToProducts}
        onProductAdded={handleProductAdded}
      />
    );
  }

  return (
    <div className="product-management">
      <div className="page-header">
        <div className="header-content">
          <h1>Product Management</h1>
          {/* <p>Manage your product inventory efficiently</p> */}
        </div>
        <button className="btn-primary" onClick={handleAddProductClick}>
          <span className="btn-icon">+</span> Add New Product
        </button>
      </div>

      <div className="dashboard-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search products by name, category, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="control-group">
          <div className="sort-section">
            <span className="control-label">Sort by:</span>
            <select 
              value={sortBy} 
              onChange={(e) => handleSort(e.target.value)}
              className="sort-select"
            >
              <option value="name">Name</option>
              <option value="createdAt">Date Added</option>
            </select>
            <button 
              className="sort-order-btn"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-content">
            <div className="form-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter product name"
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Electronics, Clothing"
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Product description and features"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Update' : 'Add'} Product
                </button>
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="products-container">
        {filteredAndSortedProducts.length > 0 ? (
          <>
            {/* Desktop Table View */}
            {!isMobile && (
              <div className="table-responsive">
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Date Added</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedProducts.map(product => (
                      <tr key={product.id}>
                        <td>
                          <div className="product-info">
                            <div className="product-avatar">{product.name?.charAt(0).toUpperCase() || 'P'}</div>
                            <div className="product-details">
                              <div className="product-name">{product.name}</div>
                              <div className="product-id">ID: {product.productId || product.id.substring(0,8)}</div>
                              {product.companyName && <div className="company-name">{product.companyName}</div>}
                            </div>
                          </div>
                        </td>
                        <td>{product.category}</td>
                        <td>
                          <div className="status-cell">
                            <span className={`status-badge ${getStatusClass(product.status)}`}>{product.status}</span>
                            <select value={product.status} onChange={(e) => updateProductStatus(product.id, e.target.value)} className="status-select">
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="out-of-stock">Out of Stock</option>
                            </select>
                          </div>
                        </td>
                        <td>{product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-icon btn-edit" onClick={() => handleEdit(product)}>✏️</button>
                            <button className="btn-icon btn-delete" onClick={() => handleDelete(product.id)}>🗑️</button>
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
              <div className="products-cards">
                {filteredAndSortedProducts.map(product => (
                  <div key={product.id} className="product-card">
                    <div className="card-header">
                      <div className="product-info">
                        <div className="product-avatar">{product.name?.charAt(0).toUpperCase() || 'P'}</div>
                        <div className="product-details">
                          <div className="product-name">{product.name}</div>
                          <div className="product-id">ID: {product.productId || product.id.substring(0,8)}</div>
                          {product.companyName && <div className="company-name">{product.companyName}</div>}
                        </div>
                      </div>
                      <div className="card-actions">
                        <button className="btn-icon btn-edit" onClick={() => handleEdit(product)}>✏️</button>
                        <button className="btn-icon btn-delete" onClick={() => handleDelete(product.id)}>🗑️</button>
                      </div>
                    </div>
                    
                    <div className="card-content">
                      <div className="card-section">
                        <h4>Product Information</h4>
                        <div className="product-info-details">
                          <div className="info-item">📂 {product.category}</div>
                        </div>
                      </div>
                      
                      <div className="card-section">
                        <h4>Description</h4>
                        <p>{product.description || 'No description available'}</p>
                      </div>
                      
                      <div className="card-footer">
                        <div className="status-section">
                          <span className="status-label">Status:</span>
                          <select 
                            value={product.status} 
                            onChange={(e) => updateProductStatus(product.id, e.target.value)} 
                            className={`status-select mobile ${getStatusClass(product.status)}`}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="out-of-stock">Out of Stock</option>
                          </select>
                        </div>
                        <div className="added-date">
                          <span className="date-label">Added:</span>
                          <span>{product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}</span>
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
            <div className="empty-icon">📦</div>
            <h3>No products found</h3>
            <p>Try adjusting your search criteria, or add a new product.</p>
            <button 
              className="btn-primary"
              onClick={handleAddProductClick}
            >
              Add Your First Product
            </button>
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
};

export default ProductManagement;