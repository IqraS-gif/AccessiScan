import './Infrastructure.css';

function Infrastructure() {
  const services = [
    {
      id: 'ec2',
      name: 'Amazon EC2',
      icon: '🖥️',
      role: 'Compute Engine',
      description: 'Hosts the FastAPI backend and Python AI engines. Handles all requests, orchestrates Playwright browsers for scanning, and runs the Llama 3 analysis.',
      color: '#FF9900', // AWS Compute Color
      details: ['t2.micro / t3.micro', 'Amazon Linux 2023', 'Playwright + Chromium', 'Uvicorn ASGI Server']
    },
    {
      id: 's3',
      name: 'Amazon S3',
      icon: '🪣',
      role: 'Object Storage',
      description: 'Stores generated PDF audit reports and full-page screenshots of scanned websites. Delivers assets securely via presigned URLs.',
      color: '#569A31', // AWS Storage Color
      details: ['accessiscan-reports', 'Presigned URLs', 'Image / PDF Storage', 'Private Access Only']
    },
    {
      id: 'dynamodb',
      name: 'Amazon DynamoDB',
      icon: '⚡',
      role: 'NoSQL Database',
      description: 'Stores all scan results, POUR scores, and violation details. Enables blazing fast retrieval of scan history in the sidebar.',
      color: '#4053D6', // AWS Database Color
      details: ['AccessiScanResults Table', 'Key-Value Store', 'On-Demand Capacity', 'UUID Partition Keys']
    },
    {
      id: 'iam',
      name: 'AWS IAM',
      icon: '🔐',
      role: 'Security & Auth',
      description: 'Manages secure, short-lived access credentials. Ensures the EC2 instance can strictly only read/write to the designated S3 bucket and DynamoDB table.',
      color: '#DD344C', // AWS Security Color
      details: ['Temporary Credentials', 'Least Privilege Policies', 'Role-Based Access', 'API Key Protection']
    },
    {
      id: 'sns',
      name: 'Amazon SNS',
      icon: '✉️',
      role: 'Push Notifications',
      description: 'Provides event-driven messaging. Automatically triggers and delivers branded email notifications to the user the moment an accessibility scan completes.',
      color: '#FF4F8B', // AWS App Integration Pink
      details: ['Pub/Sub Messaging', 'Email Delivery', 'Event-Driven', 'Asynchronous Workloads']
    }
  ];

  return (
    <div className="infrastructure-page">
      <div className="infra-header">
        <div className="infra-header-icon">☁️</div>
        <h2>Cloud Architecture</h2>
        <p>AccessiScan is powered by a robust, serverless-hybrid AWS infrastructure designed for speed, scale, and security.</p>
      </div>

      <div className="infra-grid">
        {services.map(service => (
          <div className="infra-card" key={service.id} style={{ '--service-color': service.color }}>
            <div className="infra-card-inner">
              <div className="infra-card-front">
                <div className="infra-icon" style={{ backgroundColor: `${service.color}15`, color: service.color }}>
                  {service.icon}
                </div>
                <h3>{service.name}</h3>
                <span className="infra-role">{service.role}</span>
                <p>{service.description}</p>
                <div className="infra-hint">Hover to see technical specs →</div>
              </div>
              <div className="infra-card-back" style={{ backgroundColor: service.color }}>
                <h3>Tech Specs</h3>
                <ul className="infra-details-list">
                  {service.details.map((detail, idx) => (
                    <li key={idx}>✓ {detail}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="infra-diagram">
        <div className="diagram-title">System Flow</div>
        <div className="diagram-container">
          <div className="diagram-node user-node">
            <span className="node-icon">👤</span>
            <span>Frontend (React)</span>
          </div>
          <div className="diagram-arrow">➔</div>
          <div className="diagram-node ec2-node">
            <span className="node-icon">🖥️</span>
            <span>EC2 Backend</span>
          </div>
          <div className="diagram-split">
            <div className="split-branch">
              <div className="diagram-arrow down-right">↘</div>
              <div className="diagram-node db-node">
                <span className="node-icon">⚡</span>
                <span>DynamoDB</span>
              </div>
            </div>
            <div className="split-branch">
              <div className="diagram-arrow down">↓</div>
              <div className="diagram-node ai-node">
                <span className="node-icon">🧠</span>
                <span>Groq API</span>
              </div>
            </div>
            <div className="split-branch">
              <div className="diagram-arrow down-left">↙</div>
              <div className="diagram-node s3-node">
                <span className="node-icon">🪣</span>
                <span>S3 Bucket</span>
              </div>
            </div>
          </div>
          
          {/* New Event-Driven Flow for SNS */}
          <div className="diagram-arrow down-long">↓</div>
          <div className="diagram-node sns-node">
            <span className="node-icon">✉️</span>
            <span>Amazon SNS</span>
          </div>
          <div className="diagram-arrow down-short">↓</div>
          <div className="diagram-node user-email-node">
            <span className="node-icon">📧</span>
            <span>User Inbox</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Infrastructure;
