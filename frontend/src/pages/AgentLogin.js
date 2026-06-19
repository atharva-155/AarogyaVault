import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function AgentLogin() {
  const [form, setForm] = useState({ employee_id: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.employee_id || !form.password) { setError('All fields required'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('https://aarogyavault.onrender.com/api/agent/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); return; }
      localStorage.setItem('agent_token', data.token);
      localStorage.setItem('agent_info', JSON.stringify(data.agent));
      navigate('/agent/dashboard');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '80px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🏥</div>
          <div className="page-title" style={{ fontSize: '1.5rem' }}>Agent Login</div>
          <p className="text-muted text-small">For registered government employees and hospital staff</p>
        </div>

        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="field" style={{ marginBottom: '16px' }}>
              <label>Employee ID</label>
              <input type="text" value={form.employee_id}
                onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}
                placeholder="e.g. GOV-IND-001" />
            </div>
            <div className="field" style={{ marginBottom: '24px' }}>
              <label>Password</label>
              <input type="password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Enter password" />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <><span className="spinner" /> Authenticating...</> : 'Login to Dashboard'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p className="text-muted text-small">
            Demo credentials: <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>GOV-IND-001</span> / <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>agent123</span>
          </p>
          <p className="text-muted text-small" style={{ marginTop: '12px' }}>
            New agent? <Link to="/agent/register">Register your department</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
