// Authentication service for SaaS multi-tenancy

import { generateId, storageService } from "./indexedDBService";

const SESSION_KEY = "collection_session";

export const authService = {
  // Register a new company
  registerCompany: async (companyData) => {
    const company = {
      id: generateId(),
      name: companyData.name,
      email: companyData.email,
      phone: companyData.phone,
      address: companyData.address || "",
      createdAt: new Date().toISOString(),
    };

    await storageService.saveCompany(company);

    // Create admin user for the company
    const adminUser = {
      id: generateId(),
      companyId: company.id,
      name: companyData.adminName,
      email: companyData.email,
      password: companyData.password, // In production, this should be hashed
      role: "admin",
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await storageService.saveUser(adminUser);

    return { company, user: adminUser };
  },

  // Register a new agent (by admin)
  registerAgent: async (agentData, companyId) => {
    const agent = {
      id: generateId(),
      companyId: companyId,
      name: agentData.name,
      email: agentData.email,
      phone: agentData.phone || "",
      password: agentData.password, // In production, this should be hashed
      role: "agent",
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await storageService.saveUser(agent);
    return agent;
  },

  // Login
  login: async (email, password) => {
    const users = await storageService.getAllUsers();
    const user = users.find(
      (u) => u.email === email && u.password === password && u.isActive
    );

    navigator.storage.persist().then((granted) => {
      console.log(granted ? "Persistent storage granted" : "Not granted");
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const company = await storageService.getCompany(user.companyId);
    if (!company) {
      throw new Error("Company not found");
    }

    const session = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
      company: {
        id: company.id,
        name: company.name,
      },
      loginTime: new Date().toISOString(),
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  // Logout
  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  // Get current session
  getCurrentSession: () => {
    const sessionData = localStorage.getItem(SESSION_KEY);
    return sessionData ? JSON.parse(sessionData) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem(SESSION_KEY);
  },

  // Check if user is admin
  isAdmin: () => {
    const session = authService.getCurrentSession();
    return session?.user?.role === "admin";
  },

  // Get current user
  getCurrentUser: () => {
    const session = authService.getCurrentSession();
    return session?.user || null;
  },

  // Get current company
  getCurrentCompany: () => {
    const session = authService.getCurrentSession();
    return session?.company || null;
  },
};
