import os
import json
import httpx
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


async def generate_ai_analysis(url: str, violations: list[dict], score: float, pour_scores: dict) -> dict:
    """
    Send violation data to Groq API and get human-readable analysis.
    Returns structured analysis with overview, human impact, and remediation.
    """
    if not GROQ_API_KEY:
        return {
            "overview": "AI analysis unavailable — no Groq API key configured.",
            "human_impact": "",
            "remediation_strategy": "",
        }

    # Build a concise summary of violations for the prompt
    violation_summary = []
    for v in violations[:15]:  # Limit to top 15 to stay within token limits
        nodes_preview = []
        for node in v.get("nodes", [])[:3]:
            nodes_preview.append(node.get("html", "")[:200])

        violation_summary.append({
            "rule": v.get("id", ""),
            "severity": v.get("impact", ""),
            "description": v.get("help", ""),
            "wcag": v.get("wcag_tags", []),
            "affected_elements": nodes_preview,
        })

    prompt = f"""You are an expert web accessibility consultant. Analyze the following accessibility scan results for the website: {url}

**Overall Score:** {score}/100
**POUR Scores:** Perceivable: {pour_scores.get('perceivable', 0)}, Operable: {pour_scores.get('operable', 0)}, Understandable: {pour_scores.get('understandable', 0)}, Robust: {pour_scores.get('robust', 0)}
**Total Violations Found:** {len(violations)}

**Violation Details:**
{json.dumps(violation_summary, indent=2)}

Provide a structured analysis in the following JSON format. 
IMPORTANT: Ensure all strings are properly escaped. Do not include literal newlines within strings; use \\n instead.

{{
    "overview": "A comprehensive analysis overview (2-3 paragraphs).",
    "human_impact": "Detailed explanation of how issues affect specific disability groups.",
    "remediation_strategy": "Prioritized fix steps with markdown code blocks for the top 5 issues."
}}

Return ONLY the JSON object. No preamble, no postscript."""

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": "You are a web accessibility expert who only speaks in valid JSON objects. Never include text outside the JSON structure."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 4000,
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(GROQ_API_URL, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"].strip()

            # More robust JSON extraction
            # Find the first '{' and the last '}'
            start_idx = content.find('{')
            end_idx = content.rfind('}')
            
            if start_idx != -1 and end_idx != -1:
                json_str = content[start_idx:end_idx+1]
                # Replace literal newlines inside strings if they exist (common LLM error)
                # This is a bit risky but can help
                # json_str = json_str.replace('\n', '\\n') # This would break if we have proper indentation
            else:
                json_str = content

            try:
                analysis = json.loads(json_str)
            except json.JSONDecodeError:
                # Fallback: remove markdown block markers if present
                if "```json" in content:
                    json_str = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    json_str = content.split("```")[1].split("```")[0]
                analysis = json.loads(json_str.strip())

            return {
                "overview": analysis.get("overview", "Analysis received but failed to parse fully."),
                "human_impact": analysis.get("human_impact", ""),
                "remediation_strategy": analysis.get("remediation_strategy", ""),
            }
    except Exception as e:
        print(f"❌ Groq API error: {e}")
        # Log the full content for debugging
        if 'content' in locals():
            print(f"Content that failed: {content[:500]}...")
        return {
            "overview": f"AI analysis encountered an error: {str(e)}",
            "human_impact": "",
            "remediation_strategy": "",
        }
