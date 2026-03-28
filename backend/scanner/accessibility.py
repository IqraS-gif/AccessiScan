import asyncio
import json
import os
import uuid
from datetime import datetime, timezone
from playwright.async_api import async_playwright

# POUR principle mapping: axe-core tag prefixes to POUR categories
POUR_TAG_MAP = {
    "wcag2a": None,  # generic, we check sub-tags
    "wcag2aa": None,
    "wcag21a": None,
    "wcag21aa": None,
    # Perceivable (1.x)
    "wcag1": "perceivable",
    # Operable (2.x)
    "wcag2": "operable",
    # Understandable (3.x)
    "wcag3": "understandable",
    # Robust (4.x)
    "wcag4": "robust",
}

IMPACT_WEIGHTS = {
    "critical": 10,
    "serious": 5,
    "moderate": 3,
    "minor": 1,
}


def classify_pour(tags: list[str]) -> str:
    """Classify a violation into a POUR category based on its WCAG tags."""
    for tag in tags:
        # Check for specific WCAG criterion references like wcag111, wcag211, etc.
        if tag.startswith("wcag") and len(tag) >= 6:
            section = tag[4]  # The first digit after 'wcag'
            if section == "1":
                return "perceivable"
            elif section == "2":
                return "operable"
            elif section == "3":
                return "understandable"
            elif section == "4":
                return "robust"
    return "perceivable"  # default


def calculate_score(violations: list[dict]) -> float:
    """Calculate accessibility score (0-100) based on violations."""
    if not violations:
        return 100.0
    total_penalty = 0
    for v in violations:
        impact = v.get("impact", "minor")
        weight = IMPACT_WEIGHTS.get(impact, 1)
        node_count = len(v.get("nodes", []))
        total_penalty += weight * max(node_count, 1)
    score = max(0, 100 - total_penalty)
    return round(score, 1)


def calculate_pour_scores(violations: list[dict]) -> dict:
    """Calculate per-POUR-category scores."""
    pour_penalties = {
        "perceivable": 0,
        "operable": 0,
        "understandable": 0,
        "robust": 0,
    }
    pour_counts = {
        "perceivable": 0,
        "operable": 0,
        "understandable": 0,
        "robust": 0,
    }

    for v in violations:
        tags = v.get("tags", [])
        category = classify_pour(tags)
        impact = v.get("impact", "minor")
        weight = IMPACT_WEIGHTS.get(impact, 1)
        node_count = len(v.get("nodes", []))
        pour_penalties[category] += weight * max(node_count, 1)
        pour_counts[category] += 1

    scores = {}
    for cat in pour_penalties:
        scores[cat] = round(max(0, 100 - pour_penalties[cat]), 1)
    return scores


def parse_violations(raw_violations: list[dict]) -> list[dict]:
    """Parse axe-core violations into our structured format."""
    parsed = []
    for v in raw_violations:
        nodes = []
        for node in v.get("nodes", []):
            nodes.append({
                "html": node.get("html", ""),
                "target": node.get("target", []),
                "failure_summary": node.get("failureSummary", ""),
            })

        # Extract WCAG tags
        tags = v.get("tags", [])
        wcag_tags = [t for t in tags if t.startswith("wcag") or t.startswith("best-practice")]

        parsed.append({
            "id": v.get("id", ""),
            "impact": v.get("impact", "minor"),
            "description": v.get("description", ""),
            "help": v.get("help", ""),
            "help_url": v.get("helpUrl", ""),
            "wcag_tags": wcag_tags,
            "nodes": nodes,
        })
    return parsed


async def run_accessibility_scan(url: str, scan_id: str) -> dict:
    """
    Launch Playwright, navigate to URL, take screenshot, inject axe-core, run scan.
    Returns structured scan data.
    """
    screenshot_path = None
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 720},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        page = await context.new_page()

        try:
            await page.goto(url, wait_until="networkidle", timeout=30000)
        except Exception:
            # Fallback: try with just domcontentloaded
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)

        # Take screenshot
        screenshots_dir = os.path.join(os.path.dirname(__file__), "..", "screenshots")
        os.makedirs(screenshots_dir, exist_ok=True)
        screenshot_path = os.path.join(screenshots_dir, f"{scan_id}.png")
        await page.screenshot(path=screenshot_path, full_page=True)

        # Inject axe-core from CDN
        await page.add_script_tag(url="https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js")

        # Run axe
        results = await page.evaluate("""
            () => {
                return new Promise((resolve, reject) => {
                    axe.run(document, {
                        runOnly: {
                            type: 'tag',
                            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
                        }
                    }).then(results => {
                        resolve(JSON.stringify(results));
                    }).catch(err => {
                        reject(err.toString());
                    });
                });
            }
        """)

        await browser.close()

    axe_results = json.loads(results)
    raw_violations = axe_results.get("violations", [])
    violations = parse_violations(raw_violations)
    score = calculate_score(raw_violations)
    pour_scores = calculate_pour_scores(raw_violations)

    # Count by severity
    critical_count = sum(1 for v in violations if v["impact"] == "critical")
    serious_count = sum(1 for v in violations if v["impact"] == "serious")
    moderate_count = sum(1 for v in violations if v["impact"] == "moderate")
    minor_count = sum(1 for v in violations if v["impact"] == "minor")

    return {
        "scan_id": scan_id,
        "url": url,
        "score": score,
        "violations": violations,
        "pour_scores": pour_scores,
        "screenshot_path": screenshot_path,
        "violation_count": len(violations),
        "critical_count": critical_count,
        "serious_count": serious_count,
        "moderate_count": moderate_count,
        "minor_count": minor_count,
        "passes_count": len(axe_results.get("passes", [])),
        "inapplicable_count": len(axe_results.get("inapplicable", [])),
    }
