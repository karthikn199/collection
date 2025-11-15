import React, { useState, useEffect } from "react";
import { authService } from "../services/authService";
import { storageService, generateId } from "../services/storageService";
import "./AgentManagement.css";

const AgentManagement = () => {
  const [agents, setAgents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const session = authService.getCurrentSession();
      if (session?.user?.companyId) {
        const users = await storageService.getUsersByCompany(
          session.user.companyId
        );
        // Filter only agents (not admins)
        setAgents(users.filter((u) => u.role === "agent"));
      }
    } catch (error) {
      console.error("Error loading agents:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!editingAgent && !formData.password) {
      setError("Password is required for new agents");
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      const session = authService.getCurrentSession();
      if (!session?.user?.companyId) {
        setError("Company not found");
        return;
      }

      const agentData = {
        id: editingAgent ? editingAgent.id : generateId(),
        companyId: session.user.companyId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || "",
        role: "agent",
        isActive: editingAgent ? editingAgent.isActive : true,
        createdAt: editingAgent ? editingAgent.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (formData.password) {
        agentData.password = formData.password; // In production, hash this
      } else if (editingAgent) {
        agentData.password = editingAgent.password;
      }

      await storageService.saveUser(agentData);
      await loadAgents();
      resetForm();
    } catch (error) {
      console.error("Error saving agent:", error);
      setError("Failed to save agent. Please try again.");
    }
  };

  const handleEdit = (agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      email: agent.email,
      phone: agent.phone || "",
      password: "", // Don't show password
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this agent?")) {
      try {
        await storageService.deleteUser(id);
        await loadAgents();
      } catch (error) {
        console.error("Error deleting agent:", error);
        alert("Failed to delete agent. Please try again.");
      }
    }
  };

  const handleToggleActive = async (agent) => {
    try {
      const updatedAgent = {
        ...agent,
        isActive: !agent.isActive,
        updatedAt: new Date().toISOString(),
      };
      await storageService.saveUser(updatedAgent);
      await loadAgents();
    } catch (error) {
      console.error("Error updating agent:", error);
      alert("Failed to update agent status. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", password: "" });
    setEditingAgent(null);
    setShowForm(false);
    setError("");
  };

  return (
    <div className="agent-management">
      <div className="page-header">
        <h2>Agent Management</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Add Agent
        </button>
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-container">
            <h3>{editingAgent ? "Edit Agent" : "Add New Agent"}</h3>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>
                  Password {editingAgent ? "(leave blank to keep current)" : "*"}
                </label>
                <input
                  type="password"
                  required={!editingAgent}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  minLength={6}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingAgent ? "Update" : "Save"}
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
        {agents.length === 0 ? (
          <div className="empty-state">
            <p>No agents found. Add your first agent to get started.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id}>
                  <td data-label="Name">{agent.name}</td>
                  <td data-label="Email">{agent.email}</td>
                  <td data-label="Phone">{agent.phone || "-"}</td>
                  <td data-label="Status">
                    <span
                      className={`status-badge ${
                        agent.isActive ? "active" : "inactive"
                      }`}
                    >
                      {agent.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td data-label="Actions">
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-edit"
                        onClick={() => handleEdit(agent)}
                      >
                        Edit
                      </button>
                      <button
                        className={`btn btn-sm ${
                          agent.isActive ? "btn-warning" : "btn-success"
                        }`}
                        onClick={() => handleToggleActive(agent)}
                      >
                        {agent.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(agent.id)}
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

export default AgentManagement;

