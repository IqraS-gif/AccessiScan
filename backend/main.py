import os
import uuid
import json
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, FileResponse
from dotenv import load_dotenv

load_dotenv()

from models.schemas import ScanRequest, ScanResult, ScanSummary
from scanner.accessibility import run_accessibility_scan
from ai.groq_analysis import generate_ai_analysis
from storage.s3 import upload_screenshot, upload_report, get_presigned_url, upload_pdf
from storage.dynamo import put_scan, get_scan, list_scans
from reports.pdf_export import generate_pdf_report

# In-memory cache for scans (fallback when AWS is unavailable)
scan_cache: dict[str, dict] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Install playwright browsers on startup if needed
    import subprocess
    try:
        subprocess.run(["playwright", "install", "chromium"], check=True, capture_output=True)
    except Exception as e:
        print(f"Playwright browser install note: {e}")
    yield


app = FastAPI(
    title="AccessiScan API",
    description="AI-powered web accessibility audit platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "AccessiScan API is running", "version": "1.0.0"}


@app.post("/api/scan")
async def create_scan(request: ScanRequest):
    """Run a full accessibility scan on the given URL."""
    scan_id = str(uuid.uuid4())
    user_id = request.user_id
    created_at = datetime.now(timezone.utc).isoformat()

    # 1. Run Playwright + axe-core scan
    try:
        scan_data = await run_accessibility_scan(request.url, scan_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")

    # 2. Upload screenshot to S3
    screenshot_url = None
    screenshot_path = scan_data.get("screenshot_path")
    if screenshot_path and os.path.exists(screenshot_path):
        s3_key = upload_screenshot(scan_id, user_id, screenshot_path)
        if s3_key:
            screenshot_url = s3_key

    # 3. Generate AI analysis via Groq
    try:
        ai_analysis = await generate_ai_analysis(
            url=request.url,
            violations=scan_data["violations"],
            score=scan_data["score"],
            pour_scores=scan_data["pour_scores"],
        )
    except Exception as e:
        print(f"AI analysis error: {e}")
        ai_analysis = {
            "overview": "AI analysis unavailable.",
            "human_impact": "",
            "remediation_strategy": "",
        }

    # 4. Build full result
    result = {
        "scan_id": scan_id,
        "user_id": user_id,
        "url": request.url,
        "score": scan_data["score"],
        "violations": scan_data["violations"],
        "pour_scores": scan_data["pour_scores"],
        "ai_analysis": ai_analysis,
        "screenshot_url": screenshot_url,
        "created_at": created_at,
        "violation_count": scan_data["violation_count"],
        "critical_count": scan_data["critical_count"],
        "serious_count": scan_data["serious_count"],
        "moderate_count": scan_data["moderate_count"],
        "minor_count": scan_data["minor_count"],
    }

    # 5. Upload JSON report to S3
    report_key = upload_report(scan_id, user_id, result)
    if report_key:
        result["report_url"] = report_key

    # 6. Store in DynamoDB
    put_scan(result)

    # 7. Always cache locally as fallback
    scan_cache[scan_id] = result

    return result


@app.get("/api/scans")
async def get_scans(user_id: str = None):
    """List all scan history."""
    # Try DynamoDB first
    scans = list_scans(user_id)
    if scans:
        return scans

    # Fallback to local cache
    summaries = []
    for sid, data in scan_cache.items():
        if user_id and data.get("user_id") != user_id:
            continue
        summaries.append({
            "scan_id": data["scan_id"],
            "user_id": data.get("user_id", ""),
            "url": data["url"],
            "score": data["score"],
            "violation_count": data.get("violation_count", 0),
            "created_at": data.get("created_at", ""),
        })
    summaries.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return summaries


@app.get("/api/scan/{scan_id}")
async def get_scan_by_id(scan_id: str):
    """Get a full scan report."""
    # Try DynamoDB first
    item = get_scan(scan_id)
    if item:
        return {
            "scan_id": item.get("ScanID", ""),
            "user_id": item.get("UserID", ""),
            "url": item.get("URL", ""),
            "score": item.get("Score", 0),
            "violations": item.get("Issues", []),
            "pour_scores": item.get("PourScores", {}),
            "ai_analysis": item.get("AiAnalysis", {}),
            "screenshot_url": item.get("S3ScreenshotPath", ""),
            "created_at": item.get("CreatedAt", ""),
            "violation_count": item.get("ViolationCount", 0),
            "critical_count": item.get("CriticalCount", 0),
            "serious_count": item.get("SeriousCount", 0),
        }

    # Fallback to cache
    if scan_id in scan_cache:
        return scan_cache[scan_id]

    raise HTTPException(status_code=404, detail="Scan not found")


@app.get("/api/scan/{scan_id}/screenshot")
async def get_screenshot(scan_id: str):
    """Get the screenshot for a scan."""
    # Try local file first
    screenshot_path = os.path.join(
        os.path.dirname(__file__), "screenshots", f"{scan_id}.png"
    )
    if os.path.exists(screenshot_path):
        return FileResponse(screenshot_path, media_type="image/png")

    # Try S3 presigned URL
    s3_key = f"reports/default_user/{scan_id}/screenshot.png"
    url = get_presigned_url(s3_key)
    if url:
        return {"screenshot_url": url}

    raise HTTPException(status_code=404, detail="Screenshot not found")


@app.get("/api/scan/{scan_id}/pdf")
async def get_pdf_report(scan_id: str):
    """Generate and return a PDF report."""
    # Get scan data
    scan_data = scan_cache.get(scan_id)
    if not scan_data:
        item = get_scan(scan_id)
        if item:
            scan_data = {
                "scan_id": item.get("ScanID", ""),
                "user_id": item.get("UserID", ""),
                "url": item.get("URL", ""),
                "score": item.get("Score", 0),
                "violations": item.get("Issues", []),
                "pour_scores": item.get("PourScores", {}),
                "ai_analysis": item.get("AiAnalysis", {}),
                "created_at": item.get("CreatedAt", ""),
                "violation_count": item.get("ViolationCount", 0),
                "critical_count": item.get("CriticalCount", 0),
                "serious_count": item.get("SeriousCount", 0),
                "moderate_count": item.get("ModerateCount", 0),
                "minor_count": item.get("MinorCount", 0),
            }

    if not scan_data:
        raise HTTPException(status_code=404, detail="Scan not found")

    # Generate PDF
    pdf_bytes = generate_pdf_report(scan_data)

    # Upload to S3
    upload_pdf(scan_id, scan_data.get("user_id", "default_user"), pdf_bytes)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="accessiscan-report-{scan_id[:8]}.pdf"'
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
