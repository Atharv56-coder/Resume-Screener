"""
FastAPI backend for ResuRank AI Resume Screener.
Endpoints return camelCase JSON matching the Lovable frontend.

AI layer: Groq (Llama 3.3 70B) → falls back to rule-based parser if unavailable.
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from schemas import (
    AtsAnalysisResponse, AtsImprovement, AtsMetric,
    RoleMatchResponse, TemplateGuideline,
    CareerExplorerResponse, CareerArchetype,
    PerfectFitRole, PivotableRole, NotAFitRole,
)
from parser import (
    extract_text, detect_skills, compute_ats_score,
    match_role, explore_career, get_resume_stats,
)
import ai_engine

app = FastAPI(
    title="ResuRank AI API",
    description="Backend API for the AI Resume Screener & Career Copilot",
    version="2.0.0",
)

# CORS — allow the Lovable dev server and common local origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Helpers ───

async def _read_resume(file: UploadFile) -> tuple:
    """Read uploaded file and return (text, bytes, filename)."""
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    filename = file.filename
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ("pdf", "docx", "doc", "txt"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '.{ext}'. Please upload a PDF or DOCX.",
        )

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    text = extract_text(file_bytes, filename)
    if not text or len(text.strip()) < 20:
        raise HTTPException(
            status_code=422,
            detail="Could not extract meaningful text from the file. Is it a scanned image PDF?",
        )

    return text, file_bytes, filename


# ─── Endpoints ───

@app.post("/api/analyze-resume")
async def analyze_resume(file: UploadFile = File(...)):
    """
    ATS Dashboard endpoint.
    Tries Groq AI first; falls back to rule-based engine on error.
    """
    text, file_bytes, filename = await _read_resume(file)
    stats = get_resume_stats(text, file_bytes, filename)

    # Get layout/formatting facts
    from parser import extract_text_and_layout
    _, layout_info = extract_text_and_layout(file_bytes, filename)

    # --- Try AI first ---
    ai_result = ai_engine.analyze_resume_ai(text, layout_info)

    if ai_result:
        response = AtsAnalysisResponse(
            score=ai_result["score"],
            breakdown=[AtsMetric(**m) for m in ai_result["breakdown"]],
            strengths=ai_result["strengths"],
            improvements=[AtsImprovement(**imp) for imp in ai_result["improvements"]],
            filename=filename,
            word_count=stats["word_count"],
            page_count=stats["page_count"],
        )
    else:
        # Fallback: rule-based engine
        skills = detect_skills(text)
        ats = compute_ats_score(text, skills, layout_info)
        response = AtsAnalysisResponse(
            score=ats["score"],
            breakdown=[AtsMetric(**m) for m in ats["breakdown"]],
            strengths=ats["strengths"],
            improvements=[AtsImprovement(**imp) for imp in ats["improvements"]],
            filename=filename,
            word_count=stats["word_count"],
            page_count=stats["page_count"],
        )

    return JSONResponse(content=response.model_dump(by_alias=True))


@app.post("/api/match-role")
async def match_role_endpoint(
    file: UploadFile = File(...),
    role: str = Form("Frontend Engineer"),
):
    """
    Role Matcher endpoint.
    Tries Groq AI first; falls back to rule-based engine on error.
    """
    text, file_bytes, filename = await _read_resume(file)

    # --- Try AI first ---
    ai_result = ai_engine.match_role_ai(text, role)

    if ai_result:
        response = RoleMatchResponse(
            role=ai_result["role"],
            score=ai_result["score"],
            matched=ai_result["matched"],
            missing=ai_result["missing"],
            certs=ai_result["certs"],
            projects=ai_result["projects"],
            template_guidelines=[
                TemplateGuideline(**g) for g in ai_result["templateGuidelines"]
            ],
        )
    else:
        # Fallback: rule-based engine
        skills = detect_skills(text)
        result = match_role(skills, role)
        response = RoleMatchResponse(
            role=result["role"],
            score=result["score"],
            matched=result["matched"],
            missing=result["missing"],
            certs=result["certs"],
            projects=result["projects"],
            template_guidelines=[
                TemplateGuideline(**g) for g in result["templateGuidelines"]
            ],
        )

    return JSONResponse(content=response.model_dump(by_alias=True))


@app.post("/api/explore-career")
async def explore_career_endpoint(file: UploadFile = File(...)):
    """
    Career Explorer endpoint.
    Tries Groq AI first; falls back to rule-based engine on error.
    """
    text, file_bytes, filename = await _read_resume(file)

    # --- Try AI first ---
    ai_result = ai_engine.explore_career_ai(text)

    if ai_result:
        response = CareerExplorerResponse(
            archetype=CareerArchetype(**ai_result["archetype"]),
            perfect_fits=[PerfectFitRole(**p) for p in ai_result["perfectFits"]],
            pivotable_roles=[PivotableRole(**p) for p in ai_result["pivotableRoles"]],
            not_a_fit=[NotAFitRole(**n) for n in ai_result["notAFit"]],
        )
    else:
        # Fallback: rule-based engine
        skills = detect_skills(text)
        result = explore_career(skills)
        response = CareerExplorerResponse(
            archetype=CareerArchetype(**result["archetype"]),
            perfect_fits=[PerfectFitRole(**p) for p in result["perfectFits"]],
            pivotable_roles=[PivotableRole(**p) for p in result["pivotableRoles"]],
            not_a_fit=[NotAFitRole(**n) for n in result["notAFit"]],
        )

    return JSONResponse(content=response.model_dump(by_alias=True))


@app.get("/api/health")
async def health_check():
    """Health check — also reports whether the AI layer is active."""
    return {
        "status": "ok",
        "service": "ResuRank AI API",
        "ai_enabled": ai_engine.is_ai_enabled(),
        "ai_model": ai_engine.AI_MODEL if ai_engine.is_ai_enabled() else None,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
