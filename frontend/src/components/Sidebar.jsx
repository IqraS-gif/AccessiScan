import { useState, useEffect } from 'react';
import { getScanHistory } from '../api/client';
import './Sidebar.css';

function Sidebar({ onSelectScan, activeScanId, onNewScan, scanHistory, setScanHistory, currentTab, setCurrentTab, user, onLogout }) {
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

  const userEmail = user?.profile?.email || 'User';
  const userInitial = userEmail.charAt(0).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🔍</div>
          <h1>AccessiScan</h1>
        </div>
        <button className="new-scan-btn" onClick={() => { setCurrentTab('dashboard'); onNewScan(); }}>
          <span>⚡</span> New Scan
        </button>
      </div>

      <div className="sidebar-nav">
        <div 
          className={`sidebar-nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentTab('dashboard')}
        >
          <span className="nav-icon">📊</span>
          <span>Dashboard</span>
        </div>
        <div 
          className={`sidebar-nav-item ${currentTab === 'infrastructure' ? 'active' : ''}`}
          onClick={() => setCurrentTab('infrastructure')}
        >
          <span className="nav-icon">☁️</span>
          <span>Cloud Architecture</span>
        </div>
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

        {Array.isArray(scanHistory) && scanHistory.map((scan) => (
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

      {/* User Profile Section */}
      <div className="sidebar-user">
        <div className="sidebar-user-info">
          <div className="sidebar-user-avatar">{userInitial}</div>
          <div className="sidebar-user-details">
            <div className="sidebar-user-email" title={userEmail}>{userEmail}</div>
            <div className="sidebar-user-tag">🔐 Cognito IAM</div>
          </div>
        </div>
        <button className="sidebar-logout-btn" onClick={onLogout} title="Sign out">
          ⏻
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
