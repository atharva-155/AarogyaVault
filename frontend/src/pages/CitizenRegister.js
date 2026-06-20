import React, { useState } from 'react';
import FaceCapture from '../components/FaceCapture';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function CitizenRegister({ agentMode = false, agentId = null, onSuccess = null }) {
  const [form, setForm] = useState({
    full_name: '', aadhaar_number: '', dob: '', gender: '',
    blood_group: '', phone: '', address: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    allergies: '', chronic_conditions: '', current_medications: '',
    insurance_provider: '', insurance_policy_number: '',
    organ_donor: false, notes: '', faceImage: null
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [aadhaarMasked, setAadhaarMasked] = useState(false);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  }

  function validate() {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Required';
    if (!/^\d{12}$/.test(form.aadhaar_number)) e.aadhaar_number = 'Must be exactly 12 digits';
    if (!form.dob) e.dob = 'Required';
    if (!form.gender) e.gender = 'Required';
    if (!form.blood_group) e.blood_group = 'Required';
    if (!form.phone || !/^\d{10}$/.test(form.phone)) e.phone = 'Enter valid 10-digit phone';
    if (!form.emergency_contact_name.trim()) e.emergency_contact_name = 'Required';
    if (!form.emergency_contact_phone || !/^\d{10}$/.test(form.emergency_contact_phone))
      e.emergency_contact_phone = 'Enter valid 10-digit phone';
    if (!form.faceImage) e.faceImage = 'Face photo is required for AI identification';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiError('');
    try {
      const token = localStorage.getItem('agent_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = { ...form, registered_by: agentId || 'self' };
      delete payload.faceImage; // don't send image in registration payload

      const res = await fetch('https://aarogyavault.onrender.com/api/citizen/register', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error || 'Registration failed'); return; }

      // Upload face image separately
      if (form.faceImage && data.vault_id) {
        await fetch(`/api/citizen/upload-face/${data.vault_id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: form.faceImage })
        });
      }

      setSuccess(data);
      if (onSuccess) onSuccess(data);
    } catch {
      setApiError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className={agentMode ? '' : 'page page-narrow'}>
        {!agentMode && <div className="page-title">Registration Successful</div>}
        <div className="card fade-in" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>✅</div>
          <h2 style={{ marginBottom: '8px' }}>Profile Secured</h2>
          <p className="text-muted" style={{ marginBottom: '28px' }}>
            Your AarogyaVault profile has been created. Present this ID to any registered hospital during an emergency.
          </p>
          <div className="vault-id-box" style={{ marginBottom: '24px' }}>
            <div className="vault-id-label">AarogyaVault ID</div>
            <div className="vault-id-value">{success.vault_id}</div>
          </div>
          <button className="btn btn-primary" onClick={() => setSuccess(null)}>Register Another</button>
        </div>
      </div>
    );
  }

  const content = (
    <form onSubmit={handleSubmit} noValidate>
      {apiError && <div className="alert alert-error">{apiError}</div>}

      <div className="form-section">
        <div className="form-section-title">Section 1 — Identity</div>
        <div className="form-grid">
          <div className="field form-full">
            <label>Full Name <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input type="text" value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              placeholder="As per Aadhaar"
              className={errors.full_name ? 'error' : ''} />
            {errors.full_name && <span className="field-error">{errors.full_name}</span>}
          </div>
          <div className="field">
            <label>Aadhaar Number <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              type={aadhaarMasked ? 'password' : 'text'}
              value={form.aadhaar_number}
              onChange={e => set('aadhaar_number', e.target.value.replace(/\D/g, '').slice(0, 12))}
              placeholder="12-digit Aadhaar number"
              className={errors.aadhaar_number ? 'error' : ''}
              onBlur={() => setAadhaarMasked(true)}
              onFocus={() => setAadhaarMasked(false)}
              maxLength={12}
            />
            {errors.aadhaar_number && <span className="field-error">{errors.aadhaar_number}</span>}
          </div>
          <div className="field">
            <label>Date of Birth <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input type="date" value={form.dob}
              onChange={e => set('dob', e.target.value)}
              className={errors.dob ? 'error' : ''} />
            {errors.dob && <span className="field-error">{errors.dob}</span>}
          </div>
          <div className="field">
            <label>Gender <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select value={form.gender} onChange={e => set('gender', e.target.value)}
              className={errors.gender ? 'error' : ''}>
              <option value="">Select</option>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
            {errors.gender && <span className="field-error">{errors.gender}</span>}
          </div>
          <div className="field">
            <label>Phone Number <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input type="text" value={form.phone}
              onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile"
              className={errors.phone ? 'error' : ''} />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>
          <div className="field form-full">
            <label>Address</label>
            <input type="text" value={form.address}
              onChange={e => set('address', e.target.value)}
              placeholder="Full residential address" />
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">Section 2 — Medical Information</div>
        <div className="form-grid">
          <div className="field">
            <label>Blood Group <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select value={form.blood_group} onChange={e => set('blood_group', e.target.value)}
              className={errors.blood_group ? 'error' : ''}>
              <option value="">Select</option>
              {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
            </select>
            {errors.blood_group && <span className="field-error">{errors.blood_group}</span>}
          </div>
          <div className="field">
            <label>Known Allergies</label>
            <input type="text" value={form.allergies}
              onChange={e => set('allergies', e.target.value)}
              placeholder="e.g. Penicillin, Latex (or None)" />
          </div>
          <div className="field">
            <label>Chronic Conditions</label>
            <input type="text" value={form.chronic_conditions}
              onChange={e => set('chronic_conditions', e.target.value)}
              placeholder="e.g. Hypertension, Diabetes" />
          </div>
          <div className="field">
            <label>Current Medications</label>
            <input type="text" value={form.current_medications}
              onChange={e => set('current_medications', e.target.value)}
              placeholder="e.g. Metformin 500mg" />
          </div>
          <div className="field form-full toggle-wrap">
            <button type="button" className={`toggle ${form.organ_donor ? 'on' : ''}`}
              onClick={() => set('organ_donor', !form.organ_donor)} />
            <span className="toggle-label">Registered Organ Donor</span>
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">Section 3 — Emergency Contact</div>
        <div className="form-grid">
          <div className="field">
            <label>Contact Name <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input type="text" value={form.emergency_contact_name}
              onChange={e => set('emergency_contact_name', e.target.value)}
              className={errors.emergency_contact_name ? 'error' : ''} />
            {errors.emergency_contact_name && <span className="field-error">{errors.emergency_contact_name}</span>}
          </div>
          <div className="field">
            <label>Contact Phone <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input type="text" value={form.emergency_contact_phone}
              onChange={e => set('emergency_contact_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile"
              className={errors.emergency_contact_phone ? 'error' : ''} />
            {errors.emergency_contact_phone && <span className="field-error">{errors.emergency_contact_phone}</span>}
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">Section 4 — Insurance (Optional)</div>
        <div className="form-grid">
          <div className="field">
            <label>Insurance Provider</label>
            <input type="text" value={form.insurance_provider}
              onChange={e => set('insurance_provider', e.target.value)}
              placeholder="e.g. Star Health, PMJAY" />
          </div>
          <div className="field">
            <label>Policy Number</label>
            <input type="text" value={form.insurance_policy_number}
              onChange={e => set('insurance_policy_number', e.target.value)}
              placeholder="Policy / Scheme number" />
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">Section 5 — Face Photo <span style={{ color: 'var(--danger)' }}>*</span></div>
        <p className="text-muted text-small" style={{ marginBottom: '12px' }}>
          Required for AI-powered emergency identification. Take a clear front-facing photo.
        </p>
        <FaceCapture
          label="Take or upload a clear front-facing photo"
          onCapture={(img) => set('faceImage', img)}
        />
        {errors.faceImage && <span className="field-error" style={{ marginTop: '8px', display: 'block' }}>{errors.faceImage}</span>}
      </div>

      {agentMode && (
        <div className="form-section">
          <div className="form-section-title">Agent Notes</div>
          <div className="field">
            <label>Registration Notes / Reason</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Reason for agent-side registration..." />
          </div>
        </div>
      )}

      <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
        {loading ? <><span className="spinner" /> Processing...</> : 'Register & Secure Health Profile'}
      </button>
    </form>
  );

  if (agentMode) return content;

  return (
    <div className="page page-narrow">
      <div className="page-title">Citizen Registration</div>
      <p className="page-subtitle">Register your medical profile with AarogyaVault. Your data is encrypted and accessed only during verified emergencies.</p>
      <div className="card">{content}</div>
    </div>
  );
}