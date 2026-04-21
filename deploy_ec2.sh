#!/bin/bash

# AccessiScan EC2 Deployment Script
# Targets: Amazon Linux 2023

echo "🚀 Starting AccessiScan Production Deployment..."

# 1. Update and install basic dependencies
sudo dnf update -y
sudo dnf install -y git python3.11 python3.11-pip nodejs npm nginx libX11 libXcomposite libXcursor libXdamage libXext libXi libXrender libXtst cups-libs libXrandr alsa-lib pango at-spi2-atk atk at-spi2-core libxkbcommon-x11

# Install PM2 globally
sudo npm install -g pm2

# 2. Setup Backend
echo "📦 Setting up Backend..."
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Install Playwright browsers and dependencies
echo "🎭 Installing Playwright (Chromium)..."
playwright install chromium
playwright install-deps chromium
cd ..

# 3. Setup Frontend
echo "💻 Setting up Frontend..."
cd frontend
npm install
echo "🏗️ Building Frontend..."
# Note: Ensure .env is set if needed for VITE_API_URL, 
# but Nginx proxy handles /api typically.
npm run build
cd ..

# 4. Configure Nginx
echo "⚙️ Configuring Nginx..."
sudo cp nginx.conf /etc/nginx/conf.d/accessiscan.conf
# Remove default config if it exists and conflicts
sudo rm -f /etc/nginx/nginx.conf.default
sudo systemctl enable nginx
sudo systemctl restart nginx

# 5. Start Backend with PM2
echo "🏃 Starting Backend with PM2..."
pm2 start ecosystem.config.cjs
pm2 save

# 6. Success Message
echo "✅ Deployment setup complete!"
echo "--------------------------------------------------"
echo "NEXT STEPS:"
echo "1. Edit backend/.env with your API keys (Groq, etc.)"
echo "2. Your application should be live at: http://$(curl -s http://checkip.amazonaws.com)"
echo "3. If you see Nginx errors, check permissions: sudo chmod -R 755 /home/ec2-user"
echo "--------------------------------------------------"

