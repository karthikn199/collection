import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalLoans: 0,
    activeMappings: 0,
    totalCollections: 0,
    todayCollections: 0,
    monthlyCollections: 0,
    pendingAmount: 0
  });

  const [recentCollections, setRecentCollections] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);

  useEffect(() => {
    loadStats();
    loadRecentCollections();
    loadTopCustomers();
  }, []);

  const getCompanyId = () => {
    const session = authService.getCurrentSession();
    return session?.user?.companyId;
  };

  const loadStats = async () => {
    try {
      const companyId = getCompanyId();
      if (!companyId) return;
      
      const [customers, loans, mappings, collections] = await Promise.all([
        storageService.getCustomers(companyId),
        storageService.getLoans(companyId),
        storageService.getMappings(companyId),
        storageService.getCollections(companyId)
      ]);
      
      const today = new Date().toISOString().split('T')[0];
      const todayCollections = collections.filter(c => c.collectionDate === today);
      
      const currentMonth = new Date().toISOString().substring(0, 7);
      const monthlyCollections = collections.filter(
        c => c.collectionDate.startsWith(currentMonth)
      );

      const totalCollected = collections.reduce((sum, c) => sum + parseFloat(c.amount), 0);
      const totalLoanAmount = mappings.reduce((sum, m) => sum + m.loanAmount, 0);
      const pendingAmount = totalLoanAmount - totalCollected;

      setStats({
        totalCustomers: customers.length,
        totalLoans: loans.length,
        activeMappings: mappings.length,
        totalCollections: collections.length,
        todayCollections: todayCollections.reduce((sum, c) => sum + parseFloat(c.amount), 0),
        monthlyCollections: monthlyCollections.reduce((sum, c) => sum + parseFloat(c.amount), 0),
        pendingAmount: pendingAmount > 0 ? pendingAmount : 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentCollections = async () => {
    try {
      const companyId = getCompanyId();
      if (!companyId) return;
      const collections = await storageService.getCollections(companyId);
      const recent = collections
        .sort((a, b) => new Date(b.collectionDate) - new Date(a.collectionDate))
        .slice(0, 5);
      setRecentCollections(recent);
    } catch (error) {
      console.error('Error loading recent collections:', error);
    }
  };

  const loadTopCustomers = async () => {
    try {
      const companyId = getCompanyId();
      if (!companyId) return;
      const collections = await storageService.getCollections(companyId);
      const customerTotals = {};
      
      collections.forEach(c => {
        if (!customerTotals[c.customerId]) {
          customerTotals[c.customerId] = {
            name: c.customerName,
            total: 0
          };
        }
        customerTotals[c.customerId].total += parseFloat(c.amount);
      });

      const top = Object.values(customerTotals)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      setTopCustomers(top);
    } catch (error) {
      console.error('Error loading top customers:', error);
    }
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <h2>Dashboard</h2>
        <button className="btn btn-secondary" onClick={() => {
          loadStats();
          loadRecentCollections();
          loadTopCustomers();
        }}>
          Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Customers</h3>
            <p className="stat-value">{stats.totalCustomers}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Active Loans</h3>
            <p className="stat-value">{stats.activeMappings}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Today's Collection</h3>
            <p className="stat-value">₹{stats.todayCollections.toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Monthly Collection</h3>
            <p className="stat-value">₹{stats.monthlyCollections.toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Pending Amount</h3>
            <p className="stat-value">₹{stats.pendingAmount.toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Total Collections</h3>
            <p className="stat-value">{stats.totalCollections}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h3>Recent Collections</h3>
          <div className="table-container">
            {recentCollections.length === 0 ? (
              <div className="empty-state">
                <p>No recent collections found.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCollections.map((collection) => (
                    <tr key={collection.id}>
                      <td>{new Date(collection.collectionDate).toLocaleDateString()}</td>
                      <td>{collection.customerName}</td>
                      <td className="amount">₹{collection.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="dashboard-section">
          <h3>Top Customers</h3>
          <div className="table-container">
            {topCustomers.length === 0 ? (
              <div className="empty-state">
                <p>No customer data available.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Total Collected</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((customer, index) => (
                    <tr key={index}>
                      <td>{customer.name}</td>
                      <td className="amount">₹{customer.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


