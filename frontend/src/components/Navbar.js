import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const agent = JSON.parse(localStorage.getItem('agent_info') || 'null');

  function logout() {
    localStorage.removeItem('agent_token');
    localStorage.removeItem('agent_info');
    navigate('/');
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <span className="logo-icon">⚕</span>
        <span className="logo-text">AarogyaVault</span>
      </Link>
      <div className="navbar-links">
        <Link to="/emergency-lookup" className={`nav-link ${location.pathname === '/emergency-lookup' ? 'active' : ''}`}>
          Emergency Lookup
        </Link>
        {agent ? (
          <>
            <Link to="/agent/dashboard" className={`nav-link ${location.pathname === '/agent/dashboard' ? 'active' : ''}`}>
              Dashboard
            </Link>
            <span className="nav-agent">{agent.full_name}</span>
            <button className="btn btn-outline btn-sm" onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/register/citizen" className={`nav-link ${location.pathname === '/register/citizen' ? 'active' : ''}`}>
              Register
            </Link>
            <Link to="/agent/login" className="btn btn-outline btn-sm">Agent Login</Link>
          </>
        )}
      </div>
    </nav>
  );
}
