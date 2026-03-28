import { useEffect, useState } from 'react';
import './PourBars.css';

const POUR_INFO = [
  { key: 'perceivable', label: 'Perceivable', icon: '👁️', desc: 'Content can be perceived by all users' },
  { key: 'operable', label: 'Operable', icon: '🖱️', desc: 'Interface is operable by all users' },
  { key: 'understandable', label: 'Understandable', icon: '🧠', desc: 'Content is understandable' },
  { key: 'robust', label: 'Robust', icon: '⚙️', desc: 'Content works with assistive tech' },
];

function PourBars({ scores = {} }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(timer);
  }, [scores]);

  return (
    <div className="pour-bars-container">
      <div className="pour-bars-title">POUR Principles</div>
      {POUR_INFO.map((item) => {
        const value = scores[item.key] ?? 0;
        return (
          <div key={item.key} className="pour-bar-item">
            <div className="pour-bar-header">
              <span className="pour-bar-label">
                <span className="pour-bar-icon">{item.icon}</span>
                {item.label}
              </span>
              <span className="pour-bar-value">{Math.round(value)}%</span>
            </div>
            <div className="pour-bar-track">
              <div
                className={`pour-bar-fill ${item.key}`}
                style={{ width: animated ? `${value}%` : '0%' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PourBars;
