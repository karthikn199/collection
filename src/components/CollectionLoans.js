import React, { useState, useEffect } from 'react';
import { storageService, generateId } from '../services/storageService';
import { authService } from '../services/authService';
import './CollectionLoans.css';

const CollectionLoans = () => {
  const [mappings, setMappings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [collections, setCollections] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    loanId: '',
    amount: '',
    collectionDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const session = authService.getCurrentSession();
      const companyId = session?.user?.companyId;
      if (!companyId) {
        console.error('Company ID not found');
        return;
      }
      const [customersData, loansData, mappingsData, collectionsData] = await Promise.all([
        storageService.getCustomers(companyId),
        storageService.getLoans(companyId),
        storageService.getMappings(companyId),
        storageService.getCollections(companyId)
      ]);
      setCustomers(customersData);
      setLoans(loansData);
      setMappings(mappingsData);
      setCollections(collectionsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const mapping = mappings.find(
      m => m.customerId === formData.customerId && m.loanId === formData.loanId
    );
    
    if (!mapping) {
      alert('Please select a valid customer-loan mapping');
      return;
    }

    const customer = customers.find(c => c.id === formData.customerId);
    const loan = loans.find(l => l.id === formData.loanId);

    const session = authService.getCurrentSession();
    const companyId = session?.user?.companyId;
    if (!companyId) {
      alert('Company ID not found. Please login again.');
      return;
    }

    const collection = {
      id: generateId(),
      companyId: companyId,
      customerId: formData.customerId,
      loanId: formData.loanId,
      agentId: mapping?.agentId || null,
      agentName: mapping?.agentName || 'Not Assigned',
      customerName: customer.name,
      loanAmount: loan.loanAmount,
      amount: parseFloat(formData.amount),
      collectionDate: formData.collectionDate,
      notes: formData.notes,
      createdAt: new Date().toISOString()
    };

    try {
      await storageService.saveCollection(collection);
      await loadData();
      resetForm();
    } catch (error) {
      console.error('Error saving collection:', error);
      alert('Failed to save collection. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this collection record?')) {
      try {
        await storageService.deleteCollection(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting collection:', error);
        alert('Failed to delete collection. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      loanId: '',
      amount: '',
      collectionDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowForm(false);
  };

  const handleMappingChange = (customerId, loanId) => {
    const mapping = mappings.find(m => m.customerId === customerId && m.loanId === loanId);
    if (mapping) {
      setFormData({ ...formData, customerId, loanId, amount: mapping.dailyCollection });
    }
  };

  const getAvailableMappings = () => {
    return mappings.map(m => {
      const customer = customers.find(c => c.id === m.customerId);
      const loan = loans.find(l => l.id === m.loanId);
      return {
        ...m,
        customerName: customer ? customer.name : 'Unknown',
        loanDetails: loan ? `₹${loan.loanAmount} (₹${loan.dailyCollection}/day)` : 'Unknown'
      };
    });
  };

  return (
    <div className="collection-loans">
      <div className="page-header">
        <h2>Collection Loans</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Record Collection
        </button>
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-container">
            <h3>Record Collection</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Customer-Loan Mapping *</label>
                <select
                  required
                  value={`${formData.customerId}-${formData.loanId}`}
                  onChange={(e) => {
                    const [customerId, loanId] = e.target.value.split('-');
                    handleMappingChange(customerId, loanId);
                  }}
                >
                  <option value="">Select Customer-Loan</option>
                  {getAvailableMappings().map(mapping => (
                    <option key={mapping.id} value={`${mapping.customerId}-${mapping.loanId}`}>
                      {mapping.customerName} - {mapping.loanDetails}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Collection Amount (Rs) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Collection Date *</label>
                <input
                  type="date"
                  required
                  value={formData.collectionDate}
                  onChange={(e) => setFormData({ ...formData, collectionDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                  placeholder="Optional notes about this collection"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Save Collection
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        {collections.length === 0 ? (
          <div className="empty-state">
            <p>No collection records found. Record your first collection.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Agent</th>
                <th>Loan Amount</th>
                <th>Collection Amount</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {collections
                .sort((a, b) => new Date(b.collectionDate) - new Date(a.collectionDate))
                .map((collection) => (
                  <tr key={collection.id}>
                    <td>{new Date(collection.collectionDate).toLocaleDateString()}</td>
                    <td>{collection.customerName}</td>
                    <td>{collection.agentName || 'Not Assigned'}</td>
                    <td>₹{collection.loanAmount.toLocaleString()}</td>
                    <td className="amount">₹{collection.amount.toLocaleString()}</td>
                    <td>{collection.notes || '-'}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(collection.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CollectionLoans;


