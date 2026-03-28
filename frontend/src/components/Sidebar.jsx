import { useState, useEffect } from 'react';
import { getScanHistory } from '../api/client';
import './Sidebar.css';

function Sidebar({ onSelectScan, activeScanId, onNewScan, scanHistory, setScanHistory }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const history = await getScanHistory();
      setScanHistory(history);
    } catch (err) {
      console.error('Failed to load scan history:', err);
    }
    setLoading(false);
  };

  const getScoreClass = (score) => {
    if (score >= 80) return 'good';
    if (score >= 50) return 'moderate';
    return 'poor';
  };

  const formatUrl = (url) => {
    try {
      const u = new URL(url);
      return u.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🔍</div>
          <h1>AccessiScan</h1>
        </div>
        <button className="new-scan-btn" onClick={onNewScan}>
          <span>⚡</span> New Scan
        </button>
      </div>

      <div className="sidebar-history">
        <div className="sidebar-history-title">Scan History</div>
        
        {loading && (
          <div className="sidebar-empty">
            <div className="sidebar-empty-icon">⏳</div>
            <p>Loading history...</p>
          </div>
        )}

        {!loading && scanHistory.length === 0 && (
          <div className="sidebar-empty">
            <div className="sidebar-empty-icon">📋</div>
            <p>No scans yet.<br />Start your first accessibility audit!</p>
          </div>
        )}

        {scanHistory.map((scan) => (
          <div
            key={scan.scan_id}
            className={`scan-history-item ${activeScanId === scan.scan_id ? 'active' : ''}`}
            onClick={() => onSelectScan(scan.scan_id)}
          >
            <div className={`scan-history-score ${getScoreClass(scan.score)}`}>
              {Math.round(scan.score)}
            </div>
            <div className="scan-history-info">
              <div className="scan-history-url">{formatUrl(scan.url)}</div>
              <div className="scan-history-date">{formatDate(scan.created_at)}</div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default Sidebar;
