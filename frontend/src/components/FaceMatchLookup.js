import React, { useState, useRef, useCallback } from 'react';
import PatientCard from './PatientCard';
 
export default function FaceMatchLookup() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [selectedCitizen, setSelectedCitizen] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
 
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch {
      setError('Camera access denied. Use file upload instead.');
    }
  };
 
  const stopCamera = useCallback(() => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setCameraActive(false);
  }, []);
 
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setPreview(dataUrl);
    setImage(dataUrl);
    stopCamera();
  };
 
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setPreview(ev.target.result); setImage(ev.target.result); };
    reader.readAsDataURL(file);
  };
 
  const handleMatch = async () => {
    if (!image) { setError('Please provide an image first'); return; }
    setLoading(true); setError(''); setResult(null); setSelectedCitizen(null);
    try {
      const token = localStorage.getItem('agent_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/face-match', {
        method: 'POST',
        headers,
        body: JSON.stringify({ image })
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setResult(data);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
 
  const reset = () => {
    setPreview(null); setImage(null);
    setResult(null); setError('');
    setSelectedCitizen(null);
  };
 
  // Confidence color
  function confidenceColor(score) {
    if (score >= 80) return '#10B981'; // green
    if (score >= 65) return '#F59E0B'; // amber
    return '#EF4444';                  // red
  }
 
  function confidenceLabel(score) {
    if (score >= 80) return 'High Match';
    if (score >= 65) return 'Likely Match';
    return 'Possible Match';
  }
 
  return (
    <div>
      {/* Image Input Section */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="section-title" style={{ fontSize: '1rem', marginBottom: '16px' }}>
          🤖 AI Face Match Lookup
        </div>
 
        {!preview && !cameraActive && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>👤</div>
            <p className="text-muted text-small" style={{ marginBottom: '16px' }}>
              Upload or capture a photo to find matching records in the database
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={startCamera}>📸 Open Camera</button>
              <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
                📁 Upload Image
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
              </label>
            </div>
          </div>
        )}
 
        {cameraActive && (
          <div style={{ position: 'relative', borderRadius: '6px', overflow: 'hidden' }}>
            <video ref={videoRef} autoPlay playsInline
              style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', bottom: '12px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button className="btn btn-primary" onClick={capturePhoto}>📸 Capture Photo</button>
              <button className="btn btn-outline" onClick={stopCamera}>Cancel</button>
            </div>
          </div>
        )}
 
        {preview && (
          <div>
            <img src={preview} alt="Query"
              style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', borderRadius: '6px', marginBottom: '14px' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleMatch} disabled={loading}>
                {loading
                  ? <><span className="spinner" /> Scanning database...</>
                  : '🔍 Find All Matches'}
              </button>
              <button className="btn btn-outline" onClick={reset}>Reset</button>
            </div>
          </div>
        )}
      </div>
 
      {error && <div className="alert alert-error">{error}</div>}
 
      {/* No Match Found */}
      {result && !result.found && (
        <div className="card fade-in" style={{ textAlign: 'center', padding: '32px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>❌</div>
          <h3 style={{ marginBottom: '8px', color: 'var(--danger)' }}>Data Not Found</h3>
          <p className="text-muted">No match found above 50% confidence in the database.</p>
        </div>
      )}
 
      {/* Matches List */}
      {result && result.found && !selectedCitizen && (
        <div className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
              {result.total_matches} Match{result.total_matches > 1 ? 'es' : ''} Found
            </h3>
            <span className="text-muted text-small">Sorted by confidence — highest first</span>
          </div>
 
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {result.matches.map((match, index) => (
              <div key={match.citizen.id}
                className="card card-sm"
                style={{ cursor: 'pointer', border: '1px solid var(--border)', transition: 'border-color 0.15s' }}
                onClick={() => setSelectedCitizen(match)}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Rank Badge */}
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: index === 0 ? 'var(--accent)' : 'var(--border)',
                      color: index === 0 ? '#0A1628' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.85rem', flexShrink: 0
                    }}>
                      #{index + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'white', marginBottom: '2px' }}>
                        {match.citizen.full_name}
                      </div>
                      <div className="text-muted text-small">
                        {match.citizen.gender} · Blood Group: <strong style={{ color: 'var(--accent)' }}>{match.citizen.blood_group}</strong>
                        {match.citizen.allergies && match.citizen.allergies !== 'None' &&
                          <span style={{ color: '#fca5a5', marginLeft: '8px' }}>⚠ {match.citizen.allergies}</span>
                        }
                      </div>
                    </div>
                  </div>
 
                  {/* Confidence Score */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontSize: '1.4rem', fontWeight: 700,
                      color: confidenceColor(match.confidence),
                      fontFamily: 'var(--mono)'
                    }}>
                      {match.confidence}%
                    </div>
                    <div style={{ fontSize: '0.72rem', color: confidenceColor(match.confidence), fontWeight: 600 }}>
                      {confidenceLabel(match.confidence)}
                    </div>
                  </div>
                </div>
 
                {/* Confidence Bar */}
                <div style={{ marginTop: '12px', background: 'var(--bg)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '4px',
                    width: `${match.confidence}%`,
                    background: confidenceColor(match.confidence),
                    transition: 'width 0.5s ease'
                  }} />
                </div>
 
                <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-dim)', textAlign: 'right' }}>
                  Click to view full medical profile →
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
 
      {/* Full Profile View */}
      {selectedCitizen && (
        <div className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <button className="btn btn-outline" style={{ fontSize: '0.82rem', padding: '7px 14px' }}
              onClick={() => setSelectedCitizen(null)}>
              ← Back to Results
            </button>
            <span className="tag tag-success" style={{ fontSize: '0.85rem', padding: '5px 12px' }}>
              ✅ {selectedCitizen.confidence}% Confidence Match
            </span>
          </div>
          <PatientCard citizen={selectedCitizen.citizen} showInsurance={true} />
        </div>
      )}
    </div>
  );
}
