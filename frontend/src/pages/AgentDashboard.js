import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CitizenRegister from './CitizenRegister';
import PatientCard from '../components/PatientCard';
import FaceMatchLookup from '../components/FaceMatchLookup';

export default function AgentDashboard() {
  const navigate = useNavigate();
  const agent = JSON.parse(localStorage.getItem('agent_info') || '{}');
  const token = localStorage.getItem('agent_token');

  const [lookupTab, setLookupTab] = useState('aadhaar'); // 'aadhaar' | 'face'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('aadhaar');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupResults, setLookupResults] = useState([]);
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [recentLookups, setRecentLookups] = useState([]);
  const [allCitizens, setAllCitizens] = useState([]);
  const [dbTab, setDbTab] = useState(false);

  const loadRecent = useCallback(async () => {
    try {
      const res = await fetch('https://aarogyavault.onrender.com/api/lookups/recent', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setRecentLookups(await res.json());
    } catch {}
  }, [token]);

  const loadAllCitizens = useCallback(async () => {
    try {
      const res = await fetch('https://aarogyavault.onrender.com/api/citizens/all');
      if (res.ok) setAllCitizens(await res.json());
    } catch {}
  }, []);

  useEffect(() => { loadRecent(); }, [loadRecent]);

  async function handleLookup(e) {
    e.preventDefault();
    if (!searchQuery.trim()) { setLookupError('Enter search query'); return; }
    setLookupLoading(true); setLookupError(''); setLookupResult(null); setLookupResults([]);
    try {
      const param = searchType === 'aadhaar' ? `aadhaar=${searchQuery}` : `name=${searchQuery}`;
      const res = await fetch(`https://aarogyavault.onrender.com/api/citizen/lookup?${param}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) { setLookupError(data.error || 'Not found'); return; }

      if (Array.isArray(data)) {
        setLookupResults(data);
      } else {
        setLookupResult(data);
        await fetch('https://aarogyavault.onrender.com/api/lookup/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ citizen_id: data.id, reason: reason || 'Emergency lookup' })
        });
        loadRecent();
      }
    } catch {
      setLookupError('Network error.');
    } finally {
      setLookupLoading(false);
    }
  }

  async function selectCitizen(c) {
    setLookupResult(c);
    setLookupResults([]);
    await fetch('https://aarogyavault.onrender.com/api/lookup/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ citizen_id: c.id, reason: reason || 'Emergency lookup' })
    });
    loadRecent();
  }

  function handleDbTab() {
    setDbTab(true);
    loadAllCitizens();
  }

  return (
    <div className="page" style={{ maxWidth: '1200px' }}>
      {/* Header */}
      <div className="card card-sm" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: '4px' }}>
            Authenticated Agent
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{agent.full_name}</div>
          <div className="text-muted text-small">{agent.department} · {agent.employee_id}</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className={`btn ${dbTab ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.82rem', padding: '8px 16px' }}
            onClick={handleDbTab}>
            View All Records
          </button>
          <button className="btn btn-outline" style={{ fontSize: '0.82rem', padding: '8px 16px' }}
            onClick={() => setDbTab(false)}>
            Main Dashboard
          </button>
        </div>
      </div>

      {/* DB View */}
      {dbTab ? (
        <div className="card">
          <div className="section-title" style={{ marginBottom: '4px' }}>All Registered Citizens</div>
          <p className="text-muted text-small" style={{ marginBottom: '20px' }}>{allCitizens.length} records in database</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Blood</th><th>Gender</th><th>Phone</th>
                  <th>Allergies</th><th>Conditions</th><th>Insurance</th>
                  <th>Face Photo</th><th>Registered By</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {allCitizens.map(c => (
                  <tr key={c.id}>
                    <td style={{ color: 'white', fontWeight: 500 }}>{c.full_name}</td>
                    <td><span className="tag" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--accent)', fontFamily: 'var(--mono)', fontWeight: 700 }}>{c.blood_group}</span></td>
                    <td>{c.gender}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: '0.82rem' }}>{c.phone}</td>
                    <td style={{ color: c.allergies && c.allergies !== 'None' ? '#fca5a5' : 'var(--text-muted)' }}>{c.allergies || '—'}</td>
                    <td>{c.chronic_conditions || '—'}</td>
                    <td>{c.insurance_provider || '—'}</td>
                    <td>
                      {c.face_image
                        ? <span className="tag tag-success">✅ Yes</span>
                        : <span className="tag tag-muted">No</span>}
                    </td>
                    <td><span className={`tag ${c.registered_by === 'self' ? 'tag-success' : 'tag-muted'}`}>{c.registered_by === 'self' ? 'Self' : c.registered_by}</span></td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: '0.78rem' }}>{c.created_at ? c.created_at.slice(0, 10) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          <div className="two-col" style={{ marginBottom: '24px' }}>
            {/* Lookup Panel */}
            <div className="card">
              {/* Lookup Tab Switcher */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <button
                  className={`btn ${lookupTab === 'aadhaar' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.82rem', padding: '8px 14px', flex: 1 }}
                  onClick={() => { setLookupTab('aadhaar'); setLookupResult(null); setLookupError(''); }}>
                  🔍 Aadhaar / Name
                </button>
                <button
                  className={`btn ${lookupTab === 'face' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.82rem', padding: '8px 14px', flex: 1 }}
                  onClick={() => { setLookupTab('face'); setLookupResult(null); setLookupError(''); }}>
                  🤖 AI Face Match
                </button>
              </div>

              {/* Aadhaar / Name Lookup */}
              {lookupTab === 'aadhaar' && (
                <>
                  <div className="section-title" style={{ fontSize: '1rem', marginBottom: '16px' }}>
                    🔍 Emergency Patient Lookup
                  </div>
                  <form onSubmit={handleLookup} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <button type="button"
                        className={`btn ${searchType === 'aadhaar' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                        onClick={() => setSearchType('aadhaar')}>By Aadhaar</button>
                      <button type="button"
                        className={`btn ${searchType === 'name' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                        onClick={() => setSearchType('name')}>By Name</button>
                    </div>
                    <div className="field" style={{ marginBottom: '10px' }}>
                      <input type="text" value={searchQuery}
                        onChange={e => setSearchQuery(searchType === 'aadhaar'
                          ? e.target.value.replace(/\D/g, '').slice(0, 12)
                          : e.target.value)}
                        placeholder={searchType === 'aadhaar' ? '12-digit Aadhaar number' : 'Patient full name'}
                        style={{ fontFamily: searchType === 'aadhaar' ? 'var(--mono)' : 'var(--font)' }}
                      />
                    </div>
                    <div className="field" style={{ marginBottom: '12px' }}>
                      <input type="text" value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="Reason for lookup (optional)" />
                    </div>
                    <button type="submit" className="btn btn-danger btn-full" disabled={lookupLoading}>
                      {lookupLoading ? <><span className="spinner" /> Searching...</> : '⚡ Emergency Lookup'}
                    </button>
                  </form>

                  {lookupError && <div className="alert alert-error">{lookupError}</div>}

                  {lookupResults.length > 0 && (
                    <div>
                      <p className="text-muted text-small" style={{ marginBottom: '10px' }}>
                        {lookupResults.length} results. Select a patient:
                      </p>
                      {lookupResults.map(c => (
                        <div key={c.id} className="card card-sm"
                          style={{ marginBottom: '8px', cursor: 'pointer' }}
                          onClick={() => selectCitizen(c)}>
                          <div style={{ fontWeight: 600 }}>{c.full_name}</div>
                          <div className="text-muted text-small">{c.gender} · {c.blood_group} · {c.phone}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {lookupResult && <PatientCard citizen={lookupResult} showInsurance={true} />}
                </>
              )}

              {/* Face Match Lookup */}
              {lookupTab === 'face' && <FaceMatchLookup />}
            </div>

            {/* Register Patient Panel */}
            <div className="card" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              <div className="section-title">➕ Register New Patient</div>
              <CitizenRegister agentMode={true} agentId={agent.employee_id} />
            </div>
          </div>

          {/* Recent Lookups */}
          {recentLookups.length > 0 && (
            <div className="card">
              <div className="section-title">📋 Recent Emergency Lookups</div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Patient</th><th>Reason</th><th>Timestamp</th></tr>
                  </thead>
                  <tbody>
                    {recentLookups.map((l, i) => (
                      <tr key={i}>
                        <td style={{ color: 'white', fontWeight: 500 }}>{l.patient_name}</td>
                        <td>{l.reason || '—'}</td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: '0.82rem' }}>
                          {l.lookup_time.slice(0, 19).replace('T', ' ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
