import React, { useEffect, useState } from "react";
import { authService } from "../services/authService";
import { generateId, storageService } from "../services/storageService";
import "./CustomerLoanMapping.css";

const CustomerLoanMapping = () => {
  const [mappings, setMappings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [agents, setAgents] = useState([]);
  const [collectionsMap, setCollectionsMap] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customerId: "",
    loanId: "",
    agentId: "",
    startDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const session = authService.getCurrentSession();
      const companyId = session?.user?.companyId;
      if (!companyId) {
        console.error("Company ID not found");
        return;
      }
      const [customersData, loansData, mappingsData, agentsData] =
        await Promise.all([
          storageService.getCustomers(companyId),
          storageService.getLoans(companyId),
          storageService.getMappings(companyId),
          storageService.getUsersByCompany(companyId),
        ]);
      setCustomers(customersData);
      setLoans(loansData);
      setMappings(mappingsData);
      // Filter only active agents
      setAgents(agentsData.filter((u) => u.role === "agent" && u.isActive));
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const customer = customers.find((c) => c.id === formData.customerId);
    const loan = loans.find((l) => l.id === formData.loanId);

    if (!customer || !loan) {
      alert("Please select valid customer and loan");
      return;
    }

    const session = authService.getCurrentSession();
    const companyId = session?.user?.companyId;
    if (!companyId) {
      alert("Company ID not found. Please login again.");
      return;
    }

    if (!formData.agentId) {
      alert("Please select an agent");
      return;
    }

    const agent = agents.find((a) => a.id === formData.agentId);
    if (!agent) {
      alert("Selected agent not found");
      return;
    }

    const mapping = {
      id: generateId(),
      companyId: companyId,
      customerId: formData.customerId,
      loanId: formData.loanId,
      agentId: formData.agentId,
      agentName: agent.name,
      customerName: customer.name,
      loanAmount: loan.loanAmount,
      dailyCollection: loan.dailyCollection,
      startDate: formData.startDate,
      createdAt: new Date().toISOString(),
    };

    try {
      await storageService.saveMapping(mapping);
      await loadData();
      resetForm();
    } catch (error) {
      console.error("Error saving mapping:", error);
      alert("Failed to save mapping. Please try again.");
    }
  };

  const handleDelete = async (mapping) => {
    if (
      window.confirm(
        "Are you sure you want to delete this mapping? This will also delete all collection records."
      )
    ) {
      try {
        await storageService.deleteMapping(mapping.customerId, mapping.loanId);
        await loadData();
      } catch (error) {
        console.error("Error deleting mapping:", error);
        alert("Failed to delete mapping. Please try again.");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: "",
      loanId: "",
      agentId: "",
      startDate: new Date().toISOString().split("T")[0],
    });
    setShowForm(false);
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer ? customer.name : "Unknown";
  };

  const getLoanDetails = (loanId) => {
    const loan = loans.find((l) => l.id === loanId);
    return loan
      ? `₹${loan.loanAmount} (₹${loan.dailyCollection}/day)`
      : "Unknown";
  };

  useEffect(() => {
    loadCollections();
  }, [mappings]);

  const loadCollections = async () => {
    try {
      const map = {};
      for (const mapping of mappings) {
        const collections = await storageService.getCollectionsByMapping(
          mapping.customerId,
          mapping.loanId
        );
        const key = `${mapping.customerId}-${mapping.loanId}`;
        map[key] = collections.reduce(
          (sum, c) => sum + parseFloat(c.amount),
          0
        );
      }
      setCollectionsMap(map);
    } catch (error) {
      console.error("Error loading collections:", error);
    }
  };

  const getTotalCollected = (mapping) => {
    const key = `${mapping.customerId}-${mapping.loanId}`;
    return collectionsMap[key] || 0;
  };

  const getRemainingAmount = (mapping) => {
    const totalCollected = getTotalCollected(mapping);
    return mapping.loanAmount - totalCollected;
  };

  return (
    <div className="customer-loan-mapping">
      <div className="page-header">
        <h2>Customer-Loan Mapping</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Create Mapping
        </button>
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-container">
            <h3>Create Customer-Loan Mapping</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Customer *</label>
                <select
                  required
                  value={formData.customerId}
                  onChange={(e) =>
                    setFormData({ ...formData, customerId: e.target.value })
                  }
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Loan Template *</label>
                <select
                  required
                  value={formData.loanId}
                  onChange={(e) =>
                    setFormData({ ...formData, loanId: e.target.value })
                  }
                >
                  <option value="">Select Loan Template</option>
                  {loans.map((loan) => (
                    <option key={loan.id} value={loan.id}>
                      ₹{loan.loanAmount} - ₹{loan.dailyCollection}/day
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Assign Agent *</label>
                <select
                  required
                  value={formData.agentId}
                  onChange={(e) =>
                    setFormData({ ...formData, agentId: e.target.value })
                  }
                >
                  <option value="">Select Agent</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} - {agent.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Create Mapping
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        {mappings.length === 0 ? (
          <div className="empty-state">
            <p>
              No mappings found. Create a mapping to link customers with loans.
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Agent</th>
                <th>Loan Amount</th>
                <th>Daily Collection</th>
                <th>Start Date</th>
                <th>Collected</th>
                <th>Remaining</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((mapping) => {
                const totalCollected = getTotalCollected(mapping);
                const remaining = getRemainingAmount(mapping);
                return (
                  <tr key={mapping.id}>
                    <td data-label="Customer">{mapping.customerName}</td>
                    <td data-label="Agent">
                      {mapping.agentName || "Not Assigned"}
                    </td>
                    <td data-label="Loan Amount">
                      ₹{mapping.loanAmount.toLocaleString()}
                    </td>
                    <td data-label="Daily Collection">
                      ₹{mapping.dailyCollection.toLocaleString()}
                    </td>
                    <td data-label="Start Date">
                      {new Date(mapping.startDate).toLocaleDateString()}
                    </td>
                    <td data-label="Collected">
                      ₹{totalCollected.toLocaleString()}
                    </td>
                    <td
                      data-label="Remaining"
                      className={remaining > 0 ? "remaining" : "completed"}
                    >
                      ₹{remaining.toLocaleString()}
                    </td>
                    <td data-label="Actions">
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-delete"
                          onClick={() => handleDelete(mapping)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CustomerLoanMapping;
