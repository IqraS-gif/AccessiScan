import { getScreenshotUrl, getPdfUrl } from '../api/client';
import ScoreCircle from '../components/ScoreCircle';
import PourBars from '../components/PourBars';
import ViolationList from '../components/ViolationList';
import ReportSection from '../components/ReportSection';
import MarkdownText from '../components/MarkdownText';
import './Dashboard.css';

function Dashboard({ scanData, onNewScan }) {
  if (!scanData) {
    return (
      <div className="dashboard">
        <div className="dashboard-welcome">
          <div className="dashboard-welcome-icon">🌐</div>
          <h2>Welcome to AccessiScan</h2>
          <p>
            Scan any website for accessibility issues powered by axe-core and AI analysis.
            Get actionable insights to make the web accessible for everyone.
          </p>
          <button className="dashboard-welcome-btn" onClick={onNewScan}>
            <span>⚡</span> Start Your First Scan
          </button>
        </div>
      </div>
    );
  }

  const formatUrl = (url) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const handleExportPdf = () => {
    const url = getPdfUrl(scanData.scan_id);
    window.open(url, '_blank');
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-info">
          <div className="dashboard-url">{formatUrl(scanData.url)}</div>
          <div className="dashboard-date">
            Scanned on {formatDate(scanData.created_at)} • {scanData.violation_count || scanData.violations?.length || 0} issues found
          </div>
        </div>
        <div className="dashboard-actions">
          <button className="export-btn" onClick={handleExportPdf}>
            📄 Export PDF
          </button>
          <button className="export-btn" onClick={onNewScan}>
            ⚡ New Scan
          </button>
        </div>
      </div>

      {/* Score + POUR */}
      <div className="dashboard-top-section">
        <div className="score-card">
          <ScoreCircle score={scanData.score} />
        </div>
        <div className="pour-card">
          <PourBars scores={scanData.pour_scores} />
        </div>
      </div>

      {/* Audit Report - Violations */}
      <ReportSection icon="📋" title="Audit Report">
        <ViolationList violations={scanData.violations || []} />
      </ReportSection>

      {/* AI Analysis Overview */}
      {scanData.ai_analysis?.overview && (
        <ReportSection icon="🤖" title="Analysis Overview">
          <MarkdownText content={scanData.ai_analysis.overview} />
        </ReportSection>
      )}

      {/* Visual Evidence */}
      <ReportSection icon="📸" title="Visual Evidence">
        <div className="screenshot-container">
          <img
            src={getScreenshotUrl(scanData.scan_id)}
            alt={`Screenshot of ${scanData.url}`}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<p style="padding: 40px; text-align: center; color: var(--text-muted);">Screenshot unavailable</p>';
            }}
          />
        </div>
      </ReportSection>

      {/* Human Impact */}
      {scanData.ai_analysis?.human_impact && (
        <ReportSection icon="♿" title="Human Impact Dynamics">
          <MarkdownText content={scanData.ai_analysis.human_impact} />
        </ReportSection>
      )}

      {/* Remediation Strategy */}
      {scanData.ai_analysis?.remediation_strategy && (
        <ReportSection icon="🔧" title="Remediation Strategy">
          <MarkdownText content={scanData.ai_analysis.remediation_strategy} />
        </ReportSection>
      )}
    </div>
  );
}

export default Dashboard;
