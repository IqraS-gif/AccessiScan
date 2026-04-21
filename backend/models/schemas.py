from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict, Any
from datetime import datetime


class ScanRequest(BaseModel):
    url: str
    user_id: str = "default_user"  # Kept for backwards compatibility; overridden by JWT sub


class ViolationNode(BaseModel):
    html: str
    target: List[str]
    failure_summary: Optional[str] = None


class Violation(BaseModel):
    id: str
    impact: str  # critical, serious, moderate, minor
    description: str
    help: str
    help_url: str
    wcag_tags: List[str]
    nodes: List[ViolationNode]


class PourScores(BaseModel):
    perceivable: float = 100.0
    operable: float = 100.0
    understandable: float = 100.0
    robust: float = 100.0


class AiAnalysis(BaseModel):
    overview: str = ""
    human_impact: str = ""
    remediation_strategy: str = ""


class ScanResult(BaseModel):
    scan_id: str
    user_id: str
    url: str
    score: float
    violations: List[Violation]
    pour_scores: PourScores
    ai_analysis: Optional[AiAnalysis] = None
    screenshot_url: Optional[str] = None
    report_url: Optional[str] = None
    created_at: str
    violation_count: int = 0
    critical_count: int = 0
    serious_count: int = 0
    moderate_count: int = 0
    minor_count: int = 0


class ScanSummary(BaseModel):
    scan_id: str
    user_id: str
    url: str
    score: float
    violation_count: int
    created_at: str
