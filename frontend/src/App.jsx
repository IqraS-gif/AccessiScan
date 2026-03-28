import { useState } from 'react';
import Sidebar from './components/Sidebar';
import NewScanModal from './components/NewScanModal';
import Dashboard from './pages/Dashboard';
import Infrastructure from './pages/Infrastructure';
import { startScan, getScanById } from './api/client';
import './App.css';

function App() {
  const [currentScan, setCurrentScan] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');

  const handleNewScan = () => {
    setShowModal(true);
  };

  const handleScan = async (url) => {
    setIsScanning(true);
    setError(null);
    try {
      const result = await startScan(url);
      setCurrentScan(result);
      // Add to history
      setScanHistory(prev => [{
        scan_id: result.scan_id,
        user_id: result.user_id,
        url: result.url,
        score: result.score,
        violation_count: result.violation_count || result.violations?.length || 0,
        created_at: result.created_at,
      }, ...prev]);
      setShowModal(false);
    } catch (err) {
      console.error('Scan failed:', err);
      setError(err.response?.data?.detail || 'Scan failed. Please check the URL and try again.');
      setShowModal(false);
    }
    setIsScanning(false);
  };

  const handleSelectScan = async (scanId) => {
    try {
      const data = await getScanById(scanId);
      setCurrentScan(data);
      setCurrentTab('dashboard');
      setSidebarOpen(false);
    } catch (err) {
      console.error('Failed to load scan:', err);
      setError('Failed to load scan data.');
    }
  };

  return (
    <div className="app">
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        ☰
      </button>

      <Sidebar
        onSelectScan={handleSelectScan}
        activeScanId={currentScan?.scan_id}
        onNewScan={handleNewScan}
        scanHistory={scanHistory}
        setScanHistory={setScanHistory}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

      <main className="app-main">
        {currentTab === 'infrastructure' ? (
          <Infrastructure />
        ) : (
          <Dashboard
            scanData={currentScan}
            onNewScan={handleNewScan}
          />
        )}
      </main>

      <NewScanModal
        isOpen={showModal}
        onClose={() => !isScanning && setShowModal(false)}
        onScan={handleScan}
        isScanning={isScanning}
      />

      {error && (
        <div className="error-toast">
          <span>⚠️ {error}</span>
          <button className="error-toast-close" onClick={() => setError(null)}>✕</button>
        </div>
      )}
    </div>
  );
}

export default App;
