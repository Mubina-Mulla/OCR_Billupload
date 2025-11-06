import React, { useState } from "react";
import { db } from "../../firebase/config";
import { ref, push, set } from "firebase/database";
import "./CustomerHistory.css";

const CustomerHistory = ({ technician, transactions, onClose, onTransactionAdded }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    type: "debit",
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter transactions for this technician
  const techTransactions = transactions.filter(t => t.technicianId === technician.id);

  // Sort by date (newest first)
  const sortedTransactions = [...techTransactions].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);

    try {
      const transactionsRef = ref(db, "customerTransactions");
      const newTransactionRef = push(transactionsRef);
      
      await set(newTransactionRef, {
        technicianId: technician.id,
        technicianName: technician.name,
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: formData.date,
        createdAt: new Date().toISOString()
      });

      // Reset form
      setFormData({
        type: "debit",
        amount: "",
        description: "",
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddForm(false);
      
      if (onTransactionAdded) {
        onTransactionAdded();
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Failed to add transaction. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateBalance = () => {
    let balance = 0;
    sortedTransactions.forEach(trans => {
      if (trans.type === 'credit') {
        balance += parseFloat(trans.amount || 0);
      } else {
        balance -= parseFloat(trans.amount || 0);
      }
    });
    return balance;
  };

  return (
    <div className="history-modal-overlay" onClick={onClose}>
      <div className="history-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="history-modal-header">
          <h2>Transaction History - {technician.name}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="history-modal-body">
          <div className="history-actions">
            <button 
              className="btn-primary add-transaction-btn"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? "Cancel" : "+ Add Transaction"}
            </button>
          </div>

          {showAddForm && (
            <div className="transaction-form">
              <h3>Add New Transaction</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Amount (₹)</label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="Enter amount"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter description (optional)"
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Adding..." : "Add Transaction"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="transactions-list">
            <h3>Transaction History</h3>
            {sortedTransactions.length > 0 ? (
              <div className="transactions-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Balance Effect</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTransactions.map((trans) => (
                      <tr key={trans.id}>
                        <td>{new Date(trans.date).toLocaleDateString('en-GB')}</td>
                        <td>
                          <span className={`type-badge ${trans.type}`}>
                            {trans.type === 'credit' ? '➕ Credit' : '➖ Debit'}
                          </span>
                        </td>
                        <td>{trans.description || '-'}</td>
                        <td className="amount">₹{parseFloat(trans.amount).toFixed(2)}</td>
                        <td className={trans.type === 'credit' ? 'positive' : 'negative'}>
                          {trans.type === 'credit' ? '+' : '-'}₹{parseFloat(trans.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-transactions">
                <p>No transactions found</p>
              </div>
            )}
          </div>

          <div className="history-summary">
            <div className="summary-item">
              <span className="summary-label">Total Transactions:</span>
              <span className="summary-value">{sortedTransactions.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Net Balance Effect:</span>
              <span className={`summary-value ${calculateBalance() >= 0 ? 'positive' : 'negative'}`}>
                ₹{calculateBalance().toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerHistory;
