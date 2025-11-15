import React, { useEffect, useState } from "react";
import {
  Link,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import AgentManagement from "./components/AgentManagement";
import CollectionLoans from "./components/CollectionLoans";
import CustomerLoanMapping from "./components/CustomerLoanMapping";
import CustomerMaster from "./components/CustomerMaster";
import Dashboard from "./components/Dashboard";
import LoanMaster from "./components/LoanMaster";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Register from "./components/Register";
import Reports from "./components/Reports";
import { authService } from "./services/authService";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [session, setSession] = useState(authService.getCurrentSession());

  useEffect(() => {
    // Update session on route change
    setSession(authService.getCurrentSession());
  }, [location]);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/customers", label: "Customers", icon: "👥" },
    { path: "/loans", label: "Loans", icon: "💰" },
    { path: "/mapping", label: "Mapping", icon: "🔗" },
    { path: "/collections", label: "Collections", icon: "💵" },
    { path: "/reports", label: "Reports", icon: "📈" },
  ];

  // Add admin-only menu item
  if (session?.user?.role === "admin") {
    navItems.push({
      path: "/agents",
      label: "Agents",
      icon: "👤",
    });
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <h1>Collection Agent</h1>
          {session && (
            <div className="nav-company-info">
              <span className="company-name">{session.company?.name}</span>
              <span className="user-name">{session.user?.name}</span>
            </div>
          )}
          <button
            className="menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
        </div>
        <ul className={`nav-menu ${isMenuOpen ? "active" : ""}`}>
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={location.pathname === item.path ? "active" : ""}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
          {session && (
            <li>
              <button
                className="nav-logout"
                onClick={handleLogout}
                title="Logout"
              >
                <span className="nav-icon">🚪</span>
                Logout
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Navigation />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/customers" element={<CustomerMaster />} />
                    <Route path="/loans" element={<LoanMaster />} />
                    <Route path="/mapping" element={<CustomerLoanMapping />} />
                    <Route path="/collections" element={<CollectionLoans />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route
                      path="/agents"
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <AgentManagement />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </main>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
