import { useState } from 'react';
import './NewScanModal.css';

function NewScanModal({ isOpen, onClose, onScan, isScanning }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const validateUrl = (value) => {
    try {
      new URL(value.startsWith('http') ? value : `https://${value}`);
      return true;
    } catch {
      return false;
    }
  };

  const handleScan = () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }
    if (!validateUrl(url)) {
      setError('Please enter a valid URL');
      return;
    }
    setError('');
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    onScan(fullUrl);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isScanning) {
      handleScan();
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !isScanning && onClose()}>
      <div className="modal-content">
        {!isScanning ? (
          <>
            <div className="modal-header">
              <h2 className="modal-title">🔍 New Accessibility Scan</h2>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>

            <div className="modal-input-group">
              <label className="modal-input-label">Website URL</label>
              <input
                type="text"
                className={`modal-input ${error ? 'error' : ''}`}
                placeholder="e.g., https://example.com"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(''); }}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              {error && <div className="modal-error">{error}</div>}
            </div>

            <button className="modal-scan-btn" onClick={handleScan}>
              <span>⚡</span> Start Scan
            </button>
          </>
        ) : (
          <div className="modal-scanning">
            <div className="modal-scanning-spinner"></div>
            <div className="modal-scanning-text">Scanning website...</div>
            <div className="modal-scanning-subtext">
              Loading page • Running axe-core • Analyzing with AI
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NewScanModal;
