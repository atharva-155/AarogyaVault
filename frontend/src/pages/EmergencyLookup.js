import React, { useState } from 'react';
import PatientCard from '../components/PatientCard';
import FaceMatchLookup from '../components/FaceMatchLookup';
 
export default function EmergencyLookup() {
  const [tab, setTab] = useState('aadhaar'); // 'aadhaar' | 'face'
  const [aadhaar, setAadhaar] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
 
  async function handleLookup(e) {
    e.preventDefault();
    if (!aadhaar || aadhaar.length !== 12) { setError('Enter a valid 12-digit Aadhaar number'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch(`https://aarogyavault.onrender.com/api/citizen/lookup/public?aadhaar=${aadhaar}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'No record found'); return; }
      setResult(data);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }
 
  return (
    <div className="page" style={{ maxWidth: '720px' }}>
      <div className="alert alert-info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>⚠</span>
        <span><strong>Demo Mode</strong> — In production, this lookup requires verified agent authentication. Insurance and address details are hidden.</span>
      </div>
 
      <div className="page-title">Emergency Patient Lookup</div>
      <p className="page-subtitle">Retrieve critical medical information instantly during an emergency.</p>
 
      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          className={`btn ${tab === 'aadhaar' ? 'btn-primary' : 'btn-outline'}`}
          style={{ flex: 1, justifyContent: 'center' }}
          onClick={() => { setTab('aadhaar'); setResult(null); setError(''); }}>
          🪪 Aadhaar Lookup
        </button>
        <button
          className={`btn ${tab === 'face' ? 'btn-primary' : 'btn-outline'}`}
          style={{ flex: 1, justifyContent: 'center' }}
          onClick={() => { setTab('face'); setResult(null); setError(''); }}>
          🤖 AI Face Match
        </button>
      </div>
 
      {/* Aadhaar Tab */}
      {tab === 'aadhaar' && (
        <>
          <div className="card" style={{ marginBottom: '28px' }}>
            <form onSubmit={handleLookup} style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={aadhaar}
                onChange={e => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="Enter 12-digit Aadhaar number"
                style={{
                  flex: 1, background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: '5px', color: 'white', fontFamily: 'var(--mono)',
                  fontSize: '1rem', padding: '12px 16px', outline: 'none', letterSpacing: '0.05em'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
                maxLength={12}
              />
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flexShrink: 0 }}>
                {loading ? <><span className="spinner" /> Searching...</> : 'Lookup Patient'}
              </button>
            </form>
 
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
              <p className="text-small text-muted">Test Aadhaar numbers (seed data):</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {['234567890123','345678901234','456789012345','567890123456','678901234567','789012345678'].map(n => (
                  <button key={n} type="button"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '4px',
                      color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: '0.78rem',
                      padding: '4px 10px', cursor: 'pointer' }}
                    onClick={() => setAadhaar(n)}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
 
          {error && <div className="alert alert-error">{error}</div>}
          {result && <PatientCard citizen={result} showInsurance={false} />}
        </>
      )}
 
      {/* Face Match Tab */}
      {tab === 'face' && <FaceMatchLookup />}
    </div>
  );
}
