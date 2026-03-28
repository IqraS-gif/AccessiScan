import './ReportSection.css';

function ReportSection({ icon, title, children }) {
  return (
    <div className="report-section">
      <div className="report-section-header">
        <span className="report-section-icon">{icon}</span>
        <h3 className="report-section-title">{title}</h3>
      </div>
      <div className="report-section-content">
        {children}
      </div>
    </div>
  );
}

export default ReportSection;
