"""
AI Engine — Groq-powered resume analysis using open-source Llama 3.3 70B.

All functions return dicts matching the existing schema exactly so no
frontend changes are needed.  If the Groq API is unavailable (no key,
quota exceeded, network error) every function returns None and the
caller falls back to the rule-based parser.py engine.
"""

import os
import json
import re
import logging
from typing import Optional, Dict, List, Any

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

_client = None
AI_MODEL = "llama-3.3-70b-versatile"


def _get_client():
    """Lazy-initialise the Groq client (once per process)."""
    global _client
    if _client is not None:
        return _client
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        return None
    try:
        from groq import Groq  # type: ignore

        _client = Groq(api_key=api_key)
        return _client
    except Exception as exc:
        logger.warning("Groq client init failed: %s", exc)
        return None


def is_ai_enabled() -> bool:
    return _get_client() is not None


def _chat(system: str, user: str, temperature: float = 0.3) -> Optional[str]:
    """Send a chat message and return the raw text response."""
    client = _get_client()
    if client is None:
        return None
    try:
        resp = client.chat.completions.create(
            model=AI_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=temperature,
            max_tokens=2048,
        )
        return resp.choices[0].message.content
    except Exception as exc:
        logger.warning("Groq API call failed: %s", exc)
        return None


def _extract_json(text: str) -> Any:
    """Extract the first JSON object or array from a string."""
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Try to find JSON inside markdown code fence
    match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*```", text)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    # Last resort: find first { ... } or [ ... ] block
    match = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", text)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    return None


# ─────────────────────── ATS Analysis ───────────────────────

_ATS_SYSTEM = """You are an expert ATS (Applicant Tracking System) resume grader.
Analyze the resume text and formatting metadata provided to evaluate ATS compatibility.

You MUST calculate the overall score and the sub-category values (Keywords, Formatting, Impact) using this strict scoring rubric:

1. KEYWORDS SCORE (0-100):
   - Start at 100.
   - For every critical technology or framework expected for the candidate's target role domain (e.g. frontend, backend) that is missing, deduct 8 points (up to 40 points).
   - If the skills list is completely unorganized or mixed together without categorization or clear delimiters, deduct 10 points.
   - If no relevant keywords are found, score 0.

2. FORMATTING SCORE (0-100):
   - Start at 100.
   - Deduct 25 points if layout tables or multi-column grids are detected. (Make sure to list this in the improvements: "Table/grid layout detected").
   - Deduct 15 points if dates are formatted inconsistently (e.g., mixing "05/2021", "June 2021", "2021 - Present").
   - Deduct 10 points if links (GitHub, LinkedIn, Portfolio) are missing or poorly formatted.
   - Deduct 15 points if capitalization of tech is sloppy (e.g. Reactjs, nodejs, javascript, html).

3. IMPACT SCORE (0-100):
   - Start at 100.
   - Calculate the percentage of experience bullet points that are quantified with metrics/numbers/rates of improvement.
   - If fewer than 20% are quantified: deduct 50 points.
   - If 20% to 40% are quantified: deduct 35 points.
   - If 40% to 60% are quantified: deduct 20 points.
   - If 60% to 80% are quantified: deduct 10 points.
   - If >80% are quantified: deduct 0 points.
   - Deduct 5 points for every weak passive phrase found (e.g., "responsible for", "assisted in", "worked on", "helped with") (up to 20 points).

4. OVERALL SCORE:
   - Overall Score = (Keywords Score * 0.40) + (Formatting Score * 0.30) + (Impact Score * 0.30)

CRITICAL RULES:
- If a user has made changes to address your previous feedback (e.g., removed a weak phrase, added metrics, removed tables, corrected capitalization), YOU MUST NOT list that issue again, and you MUST award a higher score (i.e. remove the corresponding deduction).
- Your analysis must be extremely realistic. Do NOT suggest improvements for issues that are NOT present in the text.
- "before" in the improvements array MUST be an exact quote of a phrase from the resume. Do NOT hallucinate weak phrases that do not exist.
- If no improvements are needed, you can leave the "improvements" array empty.

The JSON response must match this exact schema:
{
  "score": <calculated overall score as integer>,
  "breakdown": [
    {"l": "Keywords",   "v": <calculated keywords score>,   "tone": "<success|warning|danger>"},
    {"l": "Formatting", "v": <calculated formatting score>, "tone": "<success|warning|danger>"},
    {"l": "Impact",     "v": <calculated impact score>,     "tone": "<success|warning|danger>"}
  ],
  "strengths": ["<strength sentence>", ...],
  "improvements": [
    {
      "category": "<category name>",
      "color": "<info|accent|warning|success>",
      "before": "<exact weak/problematic phrase from resume, or 'Table/grid layout detected'>",
      "after": "<AI-rewritten stronger/better version, or 'Reformat to a single-column layout without tables'>",
      "why": "<one sentence explaining why this boosts ATS compatibility>"
    },
    ...
  ]
}

Return ONLY the JSON, nothing else."""


def analyze_resume_ai(text: str, layout_info: Dict[str, Any]) -> Optional[Dict]:
    """Return ATS analysis dict or None on failure."""
    prompt = f"Layout metadata: {json.dumps(layout_info)}\n\nResume text:\n\n{text[:6000]}"
    raw = _chat(_ATS_SYSTEM, prompt)
    if not raw:
        return None
    data = _extract_json(raw)
    if not isinstance(data, dict):
        return None
    # Basic schema validation
    required = {"score", "breakdown", "strengths", "improvements"}
    if not required.issubset(data.keys()):
        return None
    return data


# ─────────────────────── Role Matching ───────────────────────

_ROLE_SYSTEM = """You are a senior technical recruiter and career coach.
Given a resume and a target job role, return ONLY a valid JSON object — no markdown, no commentary.

The JSON must match this exact schema:
{
  "role": "<target role name>",
  "score": <integer 0-100 representing match percentage>,
  "matched": ["<skill>", ...],
  "missing": ["<skill>", ...],
  "certs": ["<certification name>", ...],
  "projects": ["<project idea sentence>", ...],
  "templateGuidelines": [
    {"s": "<section title>", "d": "<description>"},
    ...
  ]
}

Rules:
- "matched" = skills/technologies present in both the resume and required for the role.
- "missing" = important skills for the role that are absent from the resume.
- "certs" = 3 real, obtainable certifications that would boost the candidate for this role.
- "projects" = 3 concrete portfolio project ideas to fill the skill gaps.
- "templateGuidelines" = 6 resume sections with tailored advice for this specific role.
- score = len(matched) / (len(matched) + len(missing)) * 100, rounded.
- Return ONLY the JSON, nothing else."""


def match_role_ai(text: str, role: str) -> Optional[Dict]:
    """Return role match dict or None on failure."""
    prompt = f"Target role: {role}\n\nResume text:\n\n{text[:5000]}"
    raw = _chat(_ROLE_SYSTEM, prompt)
    if not raw:
        return None
    data = _extract_json(raw)
    if not isinstance(data, dict):
        return None
    required = {"role", "score", "matched", "missing", "certs", "projects", "templateGuidelines"}
    if not required.issubset(data.keys()):
        return None
    # Ensure role field matches what was requested
    data["role"] = role
    return data


# ─────────────────────── Career Explorer ───────────────────────

_CAREER_SYSTEM = """You are an expert career strategist and talent advisor.
Analyse the resume and return ONLY a valid JSON object — no markdown, no commentary.

The JSON must match this exact schema:
{
  "archetype": {
    "title": "<2-5 word archetype title, e.g. 'Backend Heavy · System Design Architect'>",
    "description": "<2-3 sentence description of the candidate's profile and strengths>",
    "skills": ["<top skill>", "<top skill>", "<top skill>", "<top skill>", "<top skill>", "<top skill>"]
  },
  "perfectFits": [
    {
      "title": "<job title>",
      "difficulty": "<Very Easy|Easy|Medium>",
      "reasons": ["<reason>", "<reason>", "<reason>"]
    }
  ],
  "pivotableRoles": [
    {
      "title": "<job title>",
      "difficulty": "Medium — Requires Upskilling",
      "bridge": ["<action step>", "<action step>", "<action step>"]
    }
  ],
  "notAFit": [
    {
      "title": "<job title>",
      "difficulty": "Extremely Hard",
      "barriers": ["<barrier>", "<barrier>", "<barrier>"]
    }
  ]
}

Rules:
- perfectFits: 3 roles the candidate can get NOW with minimal effort.
- pivotableRoles: 2 roles reachable with 6-12 months of targeted upskilling.
- notAFit: 2 roles with major structural barriers (wrong background entirely).
- Be honest, specific, and grounded in the actual resume content.
- Return ONLY the JSON, nothing else."""


def explore_career_ai(text: str) -> Optional[Dict]:
    """Return career explorer dict or None on failure."""
    raw = _chat(_CAREER_SYSTEM, f"Resume text:\n\n{text[:6000]}")
    if not raw:
        return None
    data = _extract_json(raw)
    if not isinstance(data, dict):
        return None
    required = {"archetype", "perfectFits", "pivotableRoles", "notAFit"}
    if not required.issubset(data.keys()):
        return None
    return data
