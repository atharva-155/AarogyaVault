import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CitizenRegister from './pages/CitizenRegister';
import AgentLogin from './pages/AgentLogin';
import AgentRegister from './pages/AgentRegister';
import AgentDashboard from './pages/AgentDashboard';
import EmergencyLookup from './pages/EmergencyLookup';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('agent_token');
  return token ? children : <Navigate to="/agent/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register/citizen" element={<CitizenRegister />} />
        <Route path="/agent/login" element={<AgentLogin />} />
        <Route path="/agent/register" element={<AgentRegister />} />
        <Route path="/agent/dashboard" element={
          <ProtectedRoute><AgentDashboard /></ProtectedRoute>
        } />
        <Route path="/emergency-lookup" element={<EmergencyLookup />} />
      </Routes>
    </BrowserRouter>
  );
}
