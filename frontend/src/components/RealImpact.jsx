import './RealImpact.css';
import MarkdownText from './MarkdownText';

/**
 * Component to display the human consequences of accessibility violations.
 */
function RealImpact({ impactData, score }) {
  if (!impactData) return null;

  // Determine an overall "Impact Level" based on the score
  let impactLevel = "Low";
  let impactClass = "low";
  if (score < 50) {
    impactLevel = "Extreme";
    impactClass = "extreme";
  } else if (score < 75) {
    impactLevel = "Significant";
    impactClass = "significant";
  }

  return (
    <div className={`real-impact-card ${impactClass}`}>
      <div className="real-impact-badge">
        <span className="impact-pulse"></span>
        Human Impact Level: {impactLevel}
      </div>
      
      <div className="impact-grid">
        <div className="impact-item">
          <div className="impact-icon">👓</div>
          <div className="impact-label">Screen Readers</div>
          <div className="impact-status">
            {score < 60 ? "Critical Barriers" : score < 85 ? "Major Obstacles" : "Minor Issues"}
          </div>
        </div>
        <div className="impact-item">
          <div className="impact-icon">⌨️</div>
          <div className="impact-label">Keyboard Only</div>
          <div className="impact-status">
            {score < 50 ? "Locked Out" : score < 80 ? "Limited Access" : "Full Access"}
          </div>
        </div>
        <div className="impact-item">
          <div className="impact-icon">🎨</div>
          <div className="impact-label">Visual Clarity</div>
          <div className="impact-status">
             {score < 70 ? "Unreadable" : "Readable"}
          </div>
        </div>
        <div className="impact-item">
          <div className="impact-icon">🧠</div>
          <div className="impact-label">Cognitive</div>
          <div className="impact-status">
            {score < 75 ? "Confusing" : "Clear"}
          </div>
        </div>
      </div>

      <div className="impact-narrative">
        <h3>Specific Consequences for Disabled Users</h3>
        <div className="narrative-content">
          <MarkdownText content={impactData} />
        </div>
      </div>
    </div>
  );
}

export default RealImpact;
