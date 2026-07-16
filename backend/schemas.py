from pydantic import BaseModel, ConfigDict, Field
from typing import List, Dict, Optional, Any

# BaseModel with camelCase alias generator
class CamelModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=lambda string: "".join(
            word.capitalize() if i > 0 else word 
            for i, word in enumerate(string.split("_"))
        )
    )

# --- ATS Dashboard Schemas ---

class AtsMetric(BaseModel):
    # No camelCase needed since it matches exact keys l, v, tone
    l: str
    v: int
    tone: str  # "success", "warning", "danger"

class AtsImprovement(CamelModel):
    category: str
    color: str  # "info", "accent", "warning", "success"
    before: str
    after: str
    why: str

class AtsAnalysisResponse(CamelModel):
    score: int
    breakdown: List[AtsMetric]
    strengths: List[str]
    improvements: List[AtsImprovement]
    filename: str
    word_count: int
    page_count: int

# --- Role Matcher Schemas ---

class TemplateGuideline(BaseModel):
    # No camelCase needed, exact keys s and d
    s: str  # section title (e.g. Header, Experience)
    d: str  # description

class RoleMatchResponse(CamelModel):
    role: str
    score: int
    matched: List[str]  # MATCHED_SKILLS
    missing: List[str]  # MISSING_SKILLS
    certs: List[str]    # CERTS
    projects: List[str]  # PROJECTS
    template_guidelines: List[TemplateGuideline]

# --- Career Explorer Schemas ---

class CareerArchetype(CamelModel):
    title: str
    description: str
    skills: List[str]

class PerfectFitRole(CamelModel):
    title: str
    difficulty: str
    reasons: List[str]

class PivotableRole(CamelModel):
    title: str
    difficulty: str
    bridge: List[str]

class NotAFitRole(CamelModel):
    title: str
    difficulty: str
    barriers: List[str]

class CareerExplorerResponse(CamelModel):
    archetype: CareerArchetype
    perfect_fits: List[PerfectFitRole]
    pivotable_roles: List[PivotableRole]
    not_a_fit: List[NotAFitRole]
