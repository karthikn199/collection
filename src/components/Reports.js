import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';
import './Reports.css';

const Reports = () => {
  const [reportType, setReportType] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().substring(0, 7)
  );
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({ total: 0, count: 0 });

  useEffect(() => {
    generateReport();
  }, [reportType, selectedDate, selectedMonth]);

  const generateReport = async () => {
    try {
      const session = authService.getCurrentSession();
      const companyId = session?.user?.companyId;
      if (!companyId) {
        console.error('Company ID not found');
        return;
      }
      const collections = await storageService.getCollections(companyId);
      let filtered = [];

      if (reportType === 'daily') {
        filtered = collections.filter(
          c => c.collectionDate === selectedDate
        );
      } else {
        const monthStart = `${selectedMonth}-01`;
        const monthEnd = `${selectedMonth}-31`;
        filtered = collections.filter(
          c => c.collectionDate >= monthStart && c.collectionDate <= monthEnd
        );
      }

      const total = filtered.reduce((sum, c) => sum + parseFloat(c.amount), 0);
      setSummary({ total, count: filtered.length });
      setReportData(filtered);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const exportReport = () => {
    const data = reportData.map(c => ({
      Date: c.collectionDate,
      Customer: c.customerName,
      Agent: c.agentName || 'Not Assigned',
      'Loan Amount': c.loanAmount,
      'Collection Amount': c.amount,
      Notes: c.notes || ''
    }));

    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${reportType === 'daily' ? selectedDate : selectedMonth}.csv`;
    a.click();
  };

  return (
    <div className="reports">
      <div className="page-header">
        <h2>Reports</h2>
      </div>

      <div className="report-controls">
        <div className="report-type-selector">
          <button
            className={`btn ${reportType === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setReportType('daily')}
          >
            Daily Report
          </button>
          <button
            className={`btn ${reportType === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setReportType('monthly')}
          >
            Monthly Report
          </button>
        </div>

        <div className="date-selector">
          {reportType === 'daily' ? (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-input"
            />
          ) : (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="date-input"
            />
          )}
        </div>

        {reportData.length > 0 && (
          <button className="btn btn-primary" onClick={exportReport}>
            Export CSV
          </button>
        )}
      </div>

      <div className="report-summary">
        <div className="summary-card">
          <h3>Total Collections</h3>
          <p className="summary-value">₹{summary.total.toLocaleString()}</p>
        </div>
        <div className="summary-card">
          <h3>Number of Collections</h3>
          <p className="summary-value">{summary.count}</p>
        </div>
        <div className="summary-card">
          <h3>Average Collection</h3>
          <p className="summary-value">
            ₹{summary.count > 0 ? (summary.total / summary.count).toFixed(2) : 0}
          </p>
        </div>
      </div>

      <div className="table-container">
        {reportData.length === 0 ? (
          <div className="empty-state">
            <p>No collections found for the selected {reportType === 'daily' ? 'date' : 'month'}.</p>
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
              </tr>
            </thead>
            <tbody>
              {reportData
                .sort((a, b) => new Date(b.collectionDate) - new Date(a.collectionDate))
                .map((collection) => (
                  <tr key={collection.id}>
                    <td data-label="Date">{new Date(collection.collectionDate).toLocaleDateString()}</td>
                    <td data-label="Customer">{collection.customerName}</td>
                    <td data-label="Agent">{collection.agentName || 'Not Assigned'}</td>
                    <td data-label="Loan Amount">₹{collection.loanAmount.toLocaleString()}</td>
                    <td data-label="Collection Amount" className="amount">₹{collection.amount.toLocaleString()}</td>
                    <td data-label="Notes">{collection.notes || '-'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Reports;


