import { useState } from 'react';
import TerminalCode from './TerminalCode';
import './ViolationList.css';

function ViolationList({ violations = [] }) {
  const [severityFilter, setSeverityFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const filteredViolations = severityFilter === 'all'
    ? violations
    : violations.filter(v => v.impact === severityFilter);

  const counts = {
    critical: violations.filter(v => v.impact === 'critical').length,
    serious: violations.filter(v => v.impact === 'serious').length,
    moderate: violations.filter(v => v.impact === 'moderate').length,
    minor: violations.filter(v => v.impact === 'minor').length,
  };

  return (
    <div className="violation-list-container">
      {/* Stats */}
      <div className="violation-stats">
        <div className="violation-stat">
          <div className="violation-stat-dot critical"></div>
          <span>Critical: {counts.critical}</span>
        </div>
        <div className="violation-stat">
          <div className="violation-stat-dot serious"></div>
          <span>Serious: {counts.serious}</span>
        </div>
        <div className="violation-stat">
          <div className="violation-stat-dot moderate"></div>
          <span>Moderate: {counts.moderate}</span>
        </div>
        <div className="violation-stat">
          <div className="violation-stat-dot minor"></div>
          <span>Minor: {counts.minor}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="violation-filters">
        <select
          className="violation-filter-select"
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
        >
          <option value="all">All Severities ({violations.length})</option>
          <option value="critical">Critical ({counts.critical})</option>
          <option value="serious">Serious ({counts.serious})</option>
          <option value="moderate">Moderate ({counts.moderate})</option>
          <option value="minor">Minor ({counts.minor})</option>
        </select>
      </div>

      {/* Violations */}
      {filteredViolations.length === 0 && violations.length === 0 && (
        <div className="violation-empty">
          <div className="violation-empty-icon">✅</div>
          <h3>No Violations Found!</h3>
          <p>This page passed all accessibility checks.</p>
        </div>
      )}

      {filteredViolations.length === 0 && violations.length > 0 && (
        <div className="violation-empty">
          <p>No violations match the current filter.</p>
        </div>
      )}

      {filteredViolations.map((v, idx) => {
        const isExpanded = expandedId === idx;
        return (
          <div key={idx} className="violation-card" onClick={() => setExpandedId(isExpanded ? null : idx)}>
            <div className="violation-card-header">
              <div className={`violation-severity-bar ${v.impact}`}></div>
              <div className="violation-card-content">
                <div className="violation-card-title">{v.help || v.description}</div>
                <div className="violation-card-meta">
                  <span className={`badge badge-${v.impact}`}>{v.impact}</span>
                  {v.wcag_tags && v.wcag_tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="badge badge-minor" style={{ opacity: 0.7 }}>{tag}</span>
                  ))}
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                    {v.nodes?.length || 0} element{(v.nodes?.length || 0) !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <span className={`violation-card-expand ${isExpanded ? 'open' : ''}`}>▼</span>
            </div>

            {isExpanded && (
              <div className="violation-card-details">
                <div className="violation-detail-section">
                  <div className="violation-detail-label">Description</div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {v.description}
                  </p>
                </div>

                {v.help_url && (
                  <div className="violation-detail-section">
                    <div className="violation-detail-label">Learn More</div>
                    <a href={v.help_url} target="_blank" rel="noopener noreferrer" className="violation-wcag-link">
                      {v.help_url}
                    </a>
                  </div>
                )}

                {v.nodes && v.nodes.length > 0 && (
                  <div className="violation-detail-section">
                    <div className="violation-detail-label">Affected Elements</div>
                    {v.nodes.slice(0, 5).map((node, ni) => (
                      <div key={ni} style={{ marginBottom: '16px' }}>
                        <TerminalCode code={node.html} title="element-source.html" />
                        {node.failure_summary && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {node.failure_summary}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ViolationList;
