import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const [stats, setStats] = useState({ citizens: 6, agents: 2 });

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {});
  }, []);

  return (
    <div className="home">
      <div className="home-hero">
        <div className="home-emblem">⚕</div>
        <div className="home-gov-label">Government of India — Ministry of Health & Family Welfare</div>
        <h1 className="home-title">AarogyaVault</h1>
        <p className="home-tagline">India's Emergency Medical Identity System</p>
        <p className="home-subtitle">
          Ensuring the right care reaches every citizen —<br />
          even when they cannot speak for themselves.
        </p>
        <div className="home-actions">
          <Link to="/register/citizen" className="btn btn-primary btn-lg">
            Register as Citizen
          </Link>
          <Link to="/agent/login" className="btn btn-outline btn-lg">
            Agent / Hospital Login
          </Link>
        </div>
        <div className="home-emergency-link">
          <span className="text-muted">Emergency situation? &nbsp;</span>
          <Link to="/emergency-lookup">Access Public Lookup →</Link>
        </div>
      </div>

      <div className="home-stats-bar">
        <div className="stat-item">
          <span className="stat-value">{stats.citizens}</span>
          <span className="stat-label">Citizens Registered</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-value">{stats.agents}</span>
          <span className="stat-label">Active Agents</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-value">MP</span>
          <span className="stat-label">Madhya Pradesh Pilot Zone</span>
        </div>
      </div>

      <div className="home-features">
        <div className="feature-card">
          <div className="feature-icon">🔐</div>
          <h3>Aadhaar-Linked Identity</h3>
          <p>Biometric-grade identity verification. Your Aadhaar number is hashed and never stored in plain text.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🚨</div>
          <h3>Instant Emergency Access</h3>
          <p>First responders get critical data in seconds — blood group, allergies, medications, emergency contacts.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🏥</div>
          <h3>Agent-Verified Registration</h3>
          <p>Government-approved hospital agents can register patients on their behalf at any PHC or district hospital.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📋</div>
          <h3>Complete Medical Profile</h3>
          <p>Allergies, chronic conditions, medications, insurance, organ donor status — one secure vault.</p>
        </div>
      </div>

      <div className="home-footer">
        <p>Developed under the National Digital Health Mission (NDHM) · Pilot Phase — Madhya Pradesh</p>
        <p>Data protected under the Digital Personal Data Protection Act, 2023</p>
      </div>
    </div>
  );
}
