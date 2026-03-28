import { useEffect, useState } from 'react';
import './ScoreCircle.css';

function ScoreCircle({ score = 0 }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  const radius = 76;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    // Animate score counting
    const duration = 1500;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(score * eased));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [score]);

  const getColor = () => {
    if (score >= 80) return '#2ed573';
    if (score >= 50) return '#ffc048';
    return '#ff4757';
  };

  const getStatus = () => {
    if (score >= 80) return { text: 'Good', class: 'good' };
    if (score >= 50) return { text: 'Needs Work', class: 'moderate' };
    return { text: 'Poor', class: 'poor' };
  };

  const color = getColor();
  const status = getStatus();

  return (
    <div className="score-circle-container">
      <div className="score-circle-wrapper" style={{ '--glow-color': `${color}40` }}>
        <svg className="score-circle-svg" viewBox="0 0 180 180">
          <circle className="score-circle-bg" cx="90" cy="90" r={radius} />
          <circle
            className="score-circle-progress"
            cx="90"
            cy="90"
            r={radius}
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="score-circle-text">
          <div className="score-circle-number" style={{ color }}>
            {animatedScore}
          </div>
          <div className="score-circle-label">Score</div>
        </div>
      </div>
      <div className={`score-circle-status ${status.class}`}>
        {status.text}
      </div>
    </div>
  );
}

export default ScoreCircle;
