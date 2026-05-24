import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function AgentRegister() {
  const [form, setForm] = useState({
    employee_id: '', full_name: '', department: '', email: '', password: '', confirm_password: ''
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  }

  function validate() {
    const e = {};
    if (!form.employee_id.trim()) e.employee_id = 'Required';
    if (!form.full_name.trim()) e.full_name = 'Required';
    if (!form.department.trim()) e.department = 'Required';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.password || form.password.length < 6) e.password = 'Min 6 characters';
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setApiError('');
    try {
      const res = await fetch('/api/agent/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error || 'Registration failed'); return; }
      setSuccess(true);
    } catch {
      setApiError('Network error.');
    } finally {
      setLoading(false);
    }
  }

  if (success) return (
    <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}>
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div className="card fade-in" style={{ padding: '40px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>📋</div>
          <h2 style={{ marginBottom: '12px' }}>Submitted for Approval</h2>
          <p className="text-muted" style={{ marginBottom: '24px' }}>
            Your agent registration has been submitted. An AarogyaVault administrator will review and approve your account within 1–2 business days.
          </p>
          <Link to="/agent/login" className="btn btn-outline">Back to Login</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        <div className="page-title" style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Agent Registration</div>
        <p className="page-subtitle text-small">For government employees and hospital staff. Accounts require admin approval.</p>
        <div className="card">
          {apiError && <div className="alert alert-error">{apiError}</div>}
          <form onSubmit={handleSubmit} noValidate>
            {[
              ['employee_id', 'Employee / Staff ID', 'text', 'e.g. GOV-IND-003'],
              ['full_name', 'Full Name', 'text', 'As per official records'],
              ['department', 'Department / Hospital', 'text', 'e.g. District Hospital Indore'],
              ['email', 'Official Email', 'email', 'Official government or hospital email'],
              ['password', 'Password', 'password', 'Minimum 6 characters'],
              ['confirm_password', 'Confirm Password', 'password', ''],
            ].map(([name, label, type, placeholder]) => (
              <div className="field" key={name} style={{ marginBottom: '16px' }}>
                <label>{label} <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type={type} value={form[name]}
                  onChange={e => set(name, e.target.value)}
                  placeholder={placeholder}
                  className={errors[name] ? 'error' : ''} />
                {errors[name] && <span className="field-error">{errors[name]}</span>}
              </div>
            ))}
            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '8px' }} disabled={loading}>
              {loading ? <><span className="spinner" /> Submitting...</> : 'Submit Registration'}
            </button>
          </form>
        </div>
        <p className="text-muted text-small" style={{ textAlign: 'center', marginTop: '16px' }}>
          Already registered? <Link to="/agent/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}
