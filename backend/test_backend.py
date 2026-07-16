"""Quick smoke test: creates a fake text resume and hits all 3 endpoints."""
import sys, json

# Use the backend venv's packages
sys.path.insert(0, ".")

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

FAKE_RESUME = b"""
ALEX MORGAN
Senior Software Engineer | San Francisco, CA
alex@email.com | linkedin.com/in/alexmorgan | github.com/alexmorgan

SUMMARY
Experienced software engineer with 5+ years shipping distributed Node.js services.
Passionate about system design, API architecture, and building reliable platform tooling.

SKILLS
React \xc2\xb7 TypeScript \xc2\xb7 Node.js \xc2\xb7 Python \xc2\xb7 PostgreSQL \xc2\xb7 Redis \xc2\xb7 Docker \xc2\xb7 AWS \xc2\xb7 Kafka \xc2\xb7 Terraform \xc2\xb7 Git \xc2\xb7 CI/CD

EXPERIENCE

Senior Backend Engineer, Acme Corp (2021 - Present)
- Architected the checkout microservice serving 3M+ monthly transactions across 12 markets.
- Reduced p95 API latency by 42% (820ms to 475ms) by introducing Redis edge caching.
- Led migration of 14 REST endpoints to GraphQL, improving mobile payload sizes by 60%.
- Responsible for building the internal developer CLI used by 40+ engineers.

Software Engineer, StartupXYZ (2019 - 2021)
- Built analytics dashboards (React, D3, TypeScript) surfacing product KPIs.
- Deployed containerized services on AWS ECS with Terraform IaC.
- Worked on improving app performance and reliability.
- Shipped 8 features in 6 sprints, increasing DAU by 22%.

EDUCATION
B.S. Computer Science, UC Berkeley, 2019

CERTIFICATIONS
AWS Certified Solutions Architect - Associate
"""

def test_analyze():
    print("=== POST /api/analyze-resume ===")
    resp = client.post(
        "/api/analyze-resume",
        files={"file": ("resume.txt", FAKE_RESUME, "text/plain")},
    )
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    data = resp.json()
    print(json.dumps(data, indent=2))
    # Verify camelCase keys
    assert "score" in data
    assert "breakdown" in data
    assert "strengths" in data
    assert "improvements" in data
    assert "wordCount" in data
    assert "pageCount" in data
    for imp in data["improvements"]:
        assert "category" in imp
        assert "before" in imp
        assert "after" in imp
        assert "why" in imp
    print("PASS\n")

def test_match_role():
    print("=== POST /api/match-role ===")
    resp = client.post(
        "/api/match-role",
        files={"file": ("resume.txt", FAKE_RESUME, "text/plain")},
        data={"role": "Frontend Engineer"},
    )
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    data = resp.json()
    print(json.dumps(data, indent=2))
    assert "role" in data
    assert "score" in data
    assert "matched" in data
    assert "missing" in data
    assert "certs" in data
    assert "projects" in data
    assert "templateGuidelines" in data
    for g in data["templateGuidelines"]:
        assert "s" in g
        assert "d" in g
    print("PASS\n")

def test_explore_career():
    print("=== POST /api/explore-career ===")
    resp = client.post(
        "/api/explore-career",
        files={"file": ("resume.txt", FAKE_RESUME, "text/plain")},
    )
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    data = resp.json()
    print(json.dumps(data, indent=2))
    assert "archetype" in data
    assert "title" in data["archetype"]
    assert "description" in data["archetype"]
    assert "skills" in data["archetype"]
    assert "perfectFits" in data
    assert "pivotableRoles" in data
    assert "notAFit" in data
    for pf in data["perfectFits"]:
        assert "title" in pf
        assert "difficulty" in pf
        assert "reasons" in pf
    for pr in data["pivotableRoles"]:
        assert "title" in pr
        assert "bridge" in pr
    for nf in data["notAFit"]:
        assert "title" in nf
        assert "barriers" in nf
    print("PASS\n")

if __name__ == "__main__":
    test_analyze()
    test_match_role()
    test_explore_career()
    print("All tests passed!")
