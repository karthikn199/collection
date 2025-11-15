import React, { useState, useEffect } from 'react';
import { storageService, generateId } from '../services/storageService';
import { authService } from '../services/authService';
import './LoanMaster.css';

const LoanMaster = () => {
  const [loans, setLoans] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [formData, setFormData] = useState({
    loanAmount: 10000,
    dailyCollection: 100,
    description: ''
  });

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    try {
      const session = authService.getCurrentSession();
      const companyId = session?.user?.companyId;
      if (!companyId) {
        console.error('Company ID not found');
        return;
      }
      const data = await storageService.getLoans(companyId);
      setLoans(data);
    } catch (error) {
      console.error('Error loading loans:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const session = authService.getCurrentSession();
    const companyId = session?.user?.companyId;
    if (!companyId) {
      alert('Company ID not found. Please login again.');
      return;
    }
    
    const loan = {
      id: editingLoan ? editingLoan.id : generateId(),
      companyId: companyId,
      loanAmount: parseFloat(formData.loanAmount),
      dailyCollection: parseFloat(formData.dailyCollection),
      description: formData.description,
      createdAt: editingLoan ? editingLoan.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await storageService.saveLoan(loan);
      await loadLoans();
      resetForm();
    } catch (error) {
      console.error('Error saving loan:', error);
      alert('Failed to save loan. Please try again.');
    }
  };

  const handleEdit = (loan) => {
    setEditingLoan(loan);
    setFormData({
      loanAmount: loan.loanAmount,
      dailyCollection: loan.dailyCollection,
      description: loan.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this loan template?')) {
      try {
        await storageService.deleteLoan(id);
        await loadLoans();
      } catch (error) {
        console.error('Error deleting loan:', error);
        alert('Failed to delete loan. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({ loanAmount: 10000, dailyCollection: 100, description: '' });
    setEditingLoan(null);
    setShowForm(false);
  };

  return (
    <div className="loan-master">
      <div className="page-header">
        <h2>Loan Master</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Add Loan Template
        </button>
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-container">
            <h3>{editingLoan ? 'Edit Loan Template' : 'Add New Loan Template'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Loan Amount (Rs) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.loanAmount}
                  onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Daily Collection (Rs) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.dailyCollection}
                  onChange={(e) => setFormData({ ...formData, dailyCollection: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  placeholder="Optional description for this loan template"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingLoan ? 'Update' : 'Save'}
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
        {loans.length === 0 ? (
          <div className="empty-state">
            <p>No loan templates found. Add your first loan template.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Loan Amount (Rs)</th>
                <th>Daily Collection (Rs)</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td data-label="Loan Amount (Rs)">₹{loan.loanAmount.toLocaleString()}</td>
                  <td data-label="Daily Collection (Rs)">₹{loan.dailyCollection.toLocaleString()}</td>
                  <td data-label="Description">{loan.description || '-'}</td>
                  <td data-label="Actions">
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-edit"
                        onClick={() => handleEdit(loan)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(loan.id)}
                      >
                        Delete
                      </button>
                    </div>
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

export default LoanMaster;


