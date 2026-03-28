# AccessiScan

AI-powered web accessibility audit platform built with FastAPI, React, Playwright, axe-core, and Groq AI.

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Groq API Key (free at https://console.groq.com)
- AWS credentials (from Learner Lab)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate    # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium

# Copy and fill in .env
copy .env.example .env
# Edit .env with your keys

# Run the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Open http://localhost:5173 in your browser.

## Architecture

- **Backend**: FastAPI (Python) with Playwright + axe-core scanning engine
- **Frontend**: React + Vite with premium dark dashboard UI
- **AI**: Groq API (Llama 3 70B) for intelligent accessibility analysis
- **Cloud**: AWS S3 (reports/screenshots), DynamoDB (scan history)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/scan | Start a new accessibility scan |
| GET | /api/scans | List all scan history |
| GET | /api/scan/{id} | Get full scan report |
| GET | /api/scan/{id}/screenshot | Get page screenshot |
| GET | /api/scan/{id}/pdf | Download PDF report |
