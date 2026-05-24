import React, { useState, useRef, useCallback } from 'react';

export default function FaceCapture({ onCapture, label = "Take Photo or Upload" }) {
  const [preview, setPreview] = useState(null);
  const [mode, setMode] = useState(null); // 'camera' | 'upload'
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
      setMode('camera');
    } catch {
      alert('Camera access denied. Please use file upload instead.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setPreview(dataUrl);
    onCapture(dataUrl);
    stopCamera();
    setMode(null);
  }, [onCapture, stopCamera]);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      onCapture(ev.target.result);
    };
    reader.readAsDataURL(file);
  }, [onCapture]);

  const reset = () => {
    setPreview(null);
    setMode(null);
    stopCamera();
    onCapture(null);
  };

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
      {!preview && !cameraActive && (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📷</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>{label}</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button type="button" className="btn btn-outline" style={{ fontSize: '0.82rem', padding: '8px 16px' }}
              onClick={startCamera}>
              📸 Use Camera
            </button>
            <label className="btn btn-outline" style={{ fontSize: '0.82rem', padding: '8px 16px', cursor: 'pointer' }}>
              📁 Upload Photo
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      )}

      {cameraActive && (
        <div style={{ position: 'relative' }}>
          <video ref={videoRef} autoPlay playsInline
            style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', bottom: '12px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button type="button" className="btn btn-primary" onClick={capturePhoto}>📸 Capture</button>
            <button type="button" className="btn btn-outline" onClick={() => { stopCamera(); setMode(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {preview && (
        <div style={{ position: 'relative' }}>
          <img src={preview} alt="Preview"
            style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', display: 'block' }} />
          <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card)' }}>
            <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>✅ Photo captured</span>
            <button type="button" className="btn btn-outline" style={{ fontSize: '0.78rem', padding: '5px 12px' }} onClick={reset}>
              Retake
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
