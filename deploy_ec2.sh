#!/bin/bash

# AccessiScan EC2 Deployment Script
# Targets: Amazon Linux 2023

echo "🚀 Starting AccessiScan Deployment..."

# 1. Update and install basic dependencies
sudo yum update -y
sudo yum install -y git python3.11 python3.11-pip nodejs npm libX11 libXcomposite libXcursor libXdamage libXext libXi libXrender libXtst cups-libs libXrandr alsa-lib pango at-spi2-atk atk at-spi2-core libxkbcommon-x11

# 2. Setup Backend
echo "📦 Setting up Backend..."
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Install Playwright browsers and dependencies
echo "🎭 Installing Playwright browsers..."
playwright install chromium
playwright install-deps chromium

# 3. Setup Frontend
echo "💻 Setting up Frontend..."
cd ../frontend
npm install

# 4. Success Message
echo "✅ Deployment setup complete!"
echo "--------------------------------------------------"
echo "NEXT STEPS:"
echo "1. Edit backend/.env with your API keys (Groq, AWS)"
echo "2. Start Backend: uvicorn main:app --host 0.0.0.0 --port 8000"
echo "3. Start Frontend: npm run dev -- --host 0.0.0.0"
echo "--------------------------------------------------"
