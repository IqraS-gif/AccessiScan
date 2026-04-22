import React, { useState, useRef } from 'react';
import { getScreenshotUrl, getPdfUrl } from '../api/client';
import ScoreCircle from '../components/ScoreCircle';
import PourBars from '../components/PourBars';
import ViolationList from '../components/ViolationList';
import ReportSection from '../components/ReportSection';
import MarkdownText from '../components/MarkdownText';
import RealImpact from '../components/RealImpact';
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

  const [isPlaying, setIsPlaying] = useState(false);
  const synthRef = useRef(null);

  const toggleAudio = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    // Construct the script
    const ai = scanData.ai_analysis || {};
    let script = `AccessiScan Accessibility Report for ${formatUrl(scanData.url)}. `;
    script += `Overall Score is ${scanData.score} out of 100. `;
    script += `We found ${scanData.violation_count || 0} accessibility issues. `;
    
    if (ai.overview) script += `Overview: ${ai.overview.replace(/[#*`]/g, '')} `;
    if (ai.human_impact) script += `Human Impact: ${ai.human_impact.replace(/[#*`]/g, '')} `;

    // Use Browser Native Synthesis
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Choose a nice voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Female') || v.lang === 'en-US');
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handleExportPdf = () => {
    const url = getPdfUrl(scanData.scan_id);
    window.open(url, '_blank');
  };

  return (
    <div className="dashboard">
      {/* 1. Header (Premium HUD style) */}
      <div className="dashboard-header">
        <div className="dashboard-header-info">
          <div className="dashboard-url">{formatUrl(scanData.url)}</div>
          <div className="dashboard-date">
            Accessibility Audit • {scanData.violation_count || scanData.violations?.length || 0} issues identified
          </div>
        </div>
        <div className="dashboard-actions">
          <button className={`export-btn ${isPlaying ? 'active' : ''}`} onClick={toggleAudio}>
            {isPlaying ? '⏸ Rendering Speech...' : '🔊 Listen to Report'}
          </button>
          <button className="export-btn" onClick={handleExportPdf}>
            📄 Download PDF
          </button>
          <button className="export-btn" onClick={onNewScan}>
            ⚡ New Audit
          </button>
        </div>
      </div>

      {/* 2. Real Impact Dynamics (New Section) */}
      {scanData.ai_analysis?.human_impact && (
        <RealImpact 
          impactData={scanData.ai_analysis.human_impact} 
          score={scanData.score} 
        />
      )}

      {/* 3. Core Metrics Section */}
      <div className="dashboard-top-section">
        <div className="score-card">
          <ScoreCircle score={scanData.score} />
        </div>
        <div className="pour-card">
          <PourBars scores={scanData.pour_scores} />
        </div>
      </div>

      {/* 4. Analysis Breakdown */}
      {scanData.ai_analysis?.overview && (
        <ReportSection icon="🤖" title="AI Strategic Overview">
          <MarkdownText content={scanData.ai_analysis.overview} />
        </ReportSection>
      )}

      {/* 5. Detailed Audit Findings */}
      <ReportSection icon="📋" title="Technical Audit Findings">
        <ViolationList violations={scanData.violations || []} />
      </ReportSection>

      {/* 6. Visual Evidence */}
      <ReportSection icon="📸" title="Visual Evidence Map">
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

      {/* 7. Remediation Roadmap */}
      {scanData.ai_analysis?.remediation_strategy && (
        <ReportSection icon="🔧" title="Prioritized Remediation Roadmap">
          <MarkdownText content={scanData.ai_analysis.remediation_strategy} />
        </ReportSection>
      )}
    </div>
  );
}

export default Dashboard;
