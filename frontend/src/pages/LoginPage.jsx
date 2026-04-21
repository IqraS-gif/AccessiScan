import { useAuth } from 'react-oidc-context';
import { useState, useEffect } from 'react';
import './LoginPage.css';

function LoginPage() {
  const auth = useAuth();
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate floating particles for background animation
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  const handleSignIn = () => {
    auth.signinRedirect();
  };

  if (auth.isLoading) {
    return (
      <div className="login-page">
        <div className="login-loading">
          <div className="login-spinner"></div>
          <p>Authenticating...</p>
        </div>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-error">
            <div className="login-error-icon">⚠️</div>
            <h3>Authentication Error</h3>
            <p>{auth.error.message}</p>
            <button className="login-btn" onClick={handleSignIn}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      {/* Animated background particles */}
      <div className="login-particles">
        {particles.map((p) => (
          <div
            key={p.id}
            className="login-particle"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Gradient orbs */}
      <div className="login-orb login-orb-1"></div>
      <div className="login-orb login-orb-2"></div>
      <div className="login-orb login-orb-3"></div>

      {/* Main login card */}
      <div className="login-card">
        <div className="login-card-glow"></div>

        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <span className="login-logo-emoji">🔍</span>
            <div className="login-logo-ring"></div>
          </div>
          <h1 className="login-title">AccessiScan</h1>
          <p className="login-subtitle">AI-Powered Web Accessibility Auditor</p>
        </div>

        {/* Feature highlights */}
        <div className="login-features">
          <div className="login-feature">
            <span className="login-feature-icon">⚡</span>
            <span>Instant WCAG Analysis</span>
          </div>
          <div className="login-feature">
            <span className="login-feature-icon">🧠</span>
            <span>AI Remediation Tips</span>
          </div>
          <div className="login-feature">
            <span className="login-feature-icon">📊</span>
            <span>POUR Score Tracking</span>
          </div>
        </div>

        {/* Sign in button */}
        <button className="login-btn" onClick={handleSignIn} id="sign-in-btn">
          <span className="login-btn-text">Sign in with AWS</span>
          <span className="login-btn-icon">🔐</span>
          <div className="login-btn-shine"></div>
        </button>

        <p className="login-footer">
          Secured by <strong>AWS Cognito</strong> · IAM Identity Management
        </p>

        {/* AWS services badges */}
        <div className="login-badges">
          <span className="login-badge">EC2</span>
          <span className="login-badge">S3</span>
          <span className="login-badge">DynamoDB</span>
          <span className="login-badge login-badge-active">Cognito</span>
          <span className="login-badge">SNS</span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
