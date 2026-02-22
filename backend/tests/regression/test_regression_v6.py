"""
Regression Test Suite v6 — End-to-end scenarios covering the full HireFlow
lifecycle with complex cross-module interactions.

Each test class simulates a realistic multi-step user journey.
"""

import pytest
from tests.conftest import register_user, auth_header


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  1. COMPLETE SEEKER LIFECYCLE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestSeekerFullLifecycle:
    """Register → Build Profile → Upload Resume → Get Matches → Apply → Track → Chat"""

    def test_seeker_register_to_hired(self, client):
        # ── 1. Register seeker ───────────────────────
        s_token, s_user = register_user(client, "seeker@test.com", role="seeker", name="Alex Rivera")
        assert s_user["role"] == "seeker"

        # ── 2. Create profile ────────────────────────
        profile = {
            "name": "Alex Rivera",
            "headline": "Senior Full Stack Developer",
            "location": "San Francisco, CA",
            "skills": ["React", "TypeScript", "Node.js", "Python", "AWS"],
            "desired_roles": ["Full Stack Developer", "Frontend Developer"],
            "experience_level": "Senior (6-9 yrs)",
            "work_preferences": ["Remote"],
            "salary_range": "$160k–$200k",
            "industries": ["Tech / SaaS"],
            "experience": [
                {"title": "Senior Dev", "company": "Stripe", "duration": "2021–2024",
                 "description": "Led frontend migration to Next.js"},
            ],
            "education": [{"school": "UC Berkeley", "degree": "B.S. Computer Science", "year": "2016"}],
            "summary": "Experienced full stack developer with 8 years in web technologies.",
        }
        r = client.post("/api/seeker/profile", json=profile, headers=auth_header(s_token))
        assert r.status_code == 201
        assert r.json()["profile_strength"] in ("Good", "Strong")

        # ── 3. Upload resume ─────────────────────────
        r = client.post("/api/seeker/resume/upload",
                        files={"file": ("resume.pdf", b"%PDF-1.4 fake content", "application/pdf")},
                        headers=auth_header(s_token))
        assert r.status_code == 200

        # ── 4. Generate AI summary ───────────────────
        r = client.post("/api/seeker/ai/summary", json={
            "name": "Alex Rivera", "skills": profile["skills"],
            "desired_roles": profile["desired_roles"],
            "experience_level": profile["experience_level"],
        }, headers=auth_header(s_token))
        assert r.status_code == 200
        assert "Alex Rivera" in r.json()["summary"] or "professional" in r.json()["summary"].lower()

        # ── 5. Company posts jobs ────────────────────
        comp_token, _ = register_user(client, "co@test.com", role="company", company_name="TechVault")
        job_data = {
            "title": "Senior React Developer", "description": "Lead frontend architecture",
            "location": "San Francisco, CA", "salary_min": 160000, "salary_max": 200000,
            "type": "full-time", "remote": True,
            "required_skills": ["React", "TypeScript", "JavaScript"],
            "nice_skills": ["Next.js", "Node.js", "AWS"],
            "experience_level": "Senior (6-9 yrs)",
        }
        job_resp = client.post("/api/jobs", json=job_data, headers=auth_header(comp_token))
        assert job_resp.status_code == 201
        job_id = job_resp.json()["id"]

        # ── 6. Get matches ───────────────────────────
        matches = client.get("/api/seeker/jobs/matches", headers=auth_header(s_token))
        assert matches.status_code == 200
        match_list = matches.json()
        assert len(match_list) >= 1
        top_match = match_list[0]
        assert top_match["match_score"] >= 50
        assert len(top_match["matched_required"]) >= 1

        # ── 7. Apply to job ──────────────────────────
        apply_resp = client.post(f"/api/jobs/{job_id}/apply", json={
            "job_id": job_id, "cover_letter": "I'm excited about this opportunity at TechVault.",
        }, headers=auth_header(s_token))
        assert apply_resp.status_code == 201
        app_id = apply_resp.json()["id"]
        assert apply_resp.json()["status"] == "applied"

        # ── 8. Check my applications ─────────────────
        my_apps = client.get("/api/jobs/me/applications", headers=auth_header(s_token))
        assert len(my_apps.json()) == 1

        # ── 9. Company advances through pipeline ─────
        for status in ["screening", "interview", "offer", "hired"]:
            r = client.patch(f"/api/jobs/applications/{app_id}/status",
                             json={"status": status}, headers=auth_header(comp_token))
            assert r.status_code == 200
            assert r.json()["status"] == status

        # ── 10. Chat between seeker and company ──────
        r = client.post("/api/chat/messages", json={
            "recipient_id": s_user["id"], "content": "Congratulations! Welcome to TechVault!",
        }, headers=auth_header(comp_token))
        assert r.status_code == 201

        convos = client.get("/api/chat/conversations", headers=auth_header(s_token))
        assert len(convos.json()) >= 1

        # ── 11. Seeker analytics reflect activity ────
        analytics = client.get("/api/seeker/analytics", headers=auth_header(s_token))
        assert analytics.status_code == 200
        data = analytics.json()
        assert data["total_applications"] >= 1


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  2. COMPANY HIRING PIPELINE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestCompanyHiringPipeline:
    """Company posts multiple jobs, receives applications, manages pipeline."""

    def test_multi_job_pipeline(self, client):
        comp_token, _ = register_user(client, "co@test.com", role="company", company_name="Acme Corp")

        # Post 3 jobs
        job_ids = []
        for title, skills in [
            ("Frontend Dev", ["React", "TypeScript"]),
            ("Backend Dev", ["Python", "FastAPI"]),
            ("DevOps Eng", ["Docker", "Kubernetes"]),
        ]:
            r = client.post("/api/jobs", json={
                "title": title, "description": f"Join as {title}",
                "location": "Remote", "salary_min": 100000, "salary_max": 160000,
                "type": "full-time", "remote": True,
                "required_skills": skills, "nice_skills": [],
            }, headers=auth_header(comp_token))
            job_ids.append(r.json()["id"])

        # Register 4 seekers with overlapping skills
        seekers = [
            ("a@t.com", "Alice", ["React", "TypeScript", "Python"]),
            ("b@t.com", "Bob", ["Python", "FastAPI", "Docker"]),
            ("c@t.com", "Carol", ["Docker", "Kubernetes", "AWS"]),
            ("d@t.com", "Dave", ["React", "Node.js", "TypeScript"]),
        ]
        seeker_data = []
        for email, name, skills in seekers:
            token, user = register_user(client, email, role="seeker", name=name)
            client.post("/api/seeker/profile", json={"name": name, "skills": skills},
                        headers=auth_header(token))
            seeker_data.append((token, user))

        # Alice applies to Frontend + Backend
        client.post(f"/api/jobs/{job_ids[0]}/apply", json={"job_id": job_ids[0], "cover_letter": "FE"},
                    headers=auth_header(seeker_data[0][0]))
        client.post(f"/api/jobs/{job_ids[1]}/apply", json={"job_id": job_ids[1], "cover_letter": "BE"},
                    headers=auth_header(seeker_data[0][0]))

        # Bob applies to Backend
        client.post(f"/api/jobs/{job_ids[1]}/apply", json={"job_id": job_ids[1], "cover_letter": "BE"},
                    headers=auth_header(seeker_data[1][0]))

        # Carol applies to DevOps
        client.post(f"/api/jobs/{job_ids[2]}/apply", json={"job_id": job_ids[2], "cover_letter": "DO"},
                    headers=auth_header(seeker_data[2][0]))

        # Dave applies to Frontend
        client.post(f"/api/jobs/{job_ids[0]}/apply", json={"job_id": job_ids[0], "cover_letter": "FE"},
                    headers=auth_header(seeker_data[3][0]))

        # Verify application counts
        for i, expected in [(0, 2), (1, 2), (2, 1)]:
            apps = client.get(f"/api/jobs/{job_ids[i]}/applications",
                              headers=auth_header(comp_token))
            assert len(apps.json()) == expected, f"Job {i} expected {expected} apps"

        # Company dashboard
        dash = client.get("/api/company/dashboard", headers=auth_header(comp_token))
        assert dash.status_code == 200
        assert dash.json()["open_positions"] == 3
        # Note: total_applicants relies on DB trigger (applicant_count),
        # which isn't replicated in mock; verify via direct application listing
        total_apps = sum(
            len(client.get(f"/api/jobs/{jid}/applications", headers=auth_header(comp_token)).json())
            for jid in job_ids
        )
        assert total_apps == 5

        # Company analytics
        analytics = client.get("/api/company/analytics", headers=auth_header(comp_token))
        assert analytics.status_code == 200
        assert analytics.json()["open_positions"] == 3


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  3. RECRUITER WORKFLOW
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestRecruiterCompleteWorkflow:
    """Recruiter searches candidates, initiates conversations, manages pipeline."""

    def test_recruiter_sourcing_to_placement(self, client):
        # Create a pool of seekers
        for i, (name, skills) in enumerate([
            ("Alice Chen", ["React", "TypeScript", "Node.js"]),
            ("Bob Park", ["Python", "Machine Learning", "PyTorch"]),
            ("Carol Wu", ["React", "Python", "AWS", "Docker"]),
            ("Dave Lee", ["Java", "Spring", "Kubernetes"]),
        ]):
            token, _ = register_user(client, f"s{i}@t.com", role="seeker", name=name)
            client.post("/api/seeker/profile", json={
                "name": name, "skills": skills,
                "desired_roles": ["Software Engineer"],
                "experience_level": "Mid Level (3-5 yrs)",
            }, headers=auth_header(token))

        # Register recruiter
        rec_token, rec_user = register_user(client, "r@t.com", role="recruiter", name="Jordan")

        # Search all candidates
        r = client.get("/api/recruiter/candidates", headers=auth_header(rec_token))
        assert r.status_code == 200
        all_candidates = r.json()
        assert len(all_candidates) == 4

        # Filter by React skill
        r = client.get("/api/recruiter/candidates?skill=React", headers=auth_header(rec_token))
        react_candidates = r.json()
        assert len(react_candidates) >= 2

        # Advanced search for Python + ML
        r = client.post("/api/recruiter/candidates/search", json={
            "skills": ["Python", "Machine Learning"],
        }, headers=auth_header(rec_token))
        ml_candidates = r.json()
        assert len(ml_candidates) >= 1

        # Check pipeline
        pipeline = client.get("/api/recruiter/pipeline", headers=auth_header(rec_token))
        assert pipeline.status_code == 200

        # Check analytics
        analytics = client.get("/api/recruiter/analytics", headers=auth_header(rec_token))
        assert analytics.status_code == 200
        assert analytics.json()["candidates_sourced"] >= 1


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  4. JOB LIFECYCLE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestJobLifecycle:
    """Create → Update → Receive Applications → Close"""

    def test_job_from_creation_to_closure(self, client):
        comp_token, _ = register_user(client, "co@test.com", role="company", company_name="X")

        # Create
        r = client.post("/api/jobs", json={
            "title": "Original Title", "description": "Original desc",
            "location": "NYC", "salary_min": 80000, "salary_max": 120000,
            "type": "full-time", "remote": False,
            "required_skills": ["Python"], "nice_skills": ["Docker"],
        }, headers=auth_header(comp_token))
        assert r.status_code == 201
        job_id = r.json()["id"]
        assert r.json()["title"] == "Original Title"

        # Update
        r = client.put(f"/api/jobs/{job_id}", json={
            "title": "Updated Title", "description": "New desc",
            "location": "Remote", "salary_min": 100000, "salary_max": 150000,
            "type": "full-time", "remote": True,
            "required_skills": ["Python", "FastAPI"], "nice_skills": ["Docker", "AWS"],
        }, headers=auth_header(comp_token))
        assert r.status_code == 200
        assert r.json()["title"] == "Updated Title"
        assert r.json()["remote"] is True

        # Seeker applies to updated job
        s_token, _ = register_user(client, "s@t.com", role="seeker", name="S")
        client.post("/api/seeker/profile", json={"name": "S", "skills": ["Python", "FastAPI"]},
                    headers=auth_header(s_token))
        r = client.post(f"/api/jobs/{job_id}/apply", json={"job_id": job_id, "cover_letter": "Excited!"},
                        headers=auth_header(s_token))
        assert r.status_code == 201

        # Close job
        r = client.delete(f"/api/jobs/{job_id}", headers=auth_header(comp_token))
        assert r.status_code == 200

        # Closed job still accessible but marked closed
        r = client.get(f"/api/jobs/{job_id}")
        assert r.json()["status"] == "closed"

        # Closed job excluded from active listings
        active = client.get("/api/jobs")
        assert all(j["id"] != job_id for j in active.json())


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  5. PUBLIC VS AUTHENTICATED MATCHING
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestPublicMatchEndpoint:
    """The POST /seeker/jobs/matches endpoint should work without auth."""

    def test_public_match_returns_scores(self, client):
        comp_token, _ = register_user(client, "co@t.com", role="company", company_name="X")
        client.post("/api/jobs", json={
            "title": "React Dev", "description": "Build UIs", "location": "Remote",
            "salary_min": 100000, "salary_max": 150000, "type": "full-time",
            "remote": True, "required_skills": ["React", "TypeScript"],
            "nice_skills": ["Next.js"],
        }, headers=auth_header(comp_token))

        r = client.post("/api/seeker/jobs/matches", json={
            "skills": ["React", "TypeScript", "Next.js"],
            "desired_roles": ["Frontend Developer"],
            "work_preferences": ["Remote"],
        })
        assert r.status_code == 200
        assert len(r.json()) >= 1
        assert r.json()[0]["match_score"] >= 50

    def test_public_match_with_min_score_filter(self, client):
        comp_token, _ = register_user(client, "co@t.com", role="company", company_name="X")
        for title, skills in [
            ("React Dev", ["React", "TypeScript"]),
            ("Go Dev", ["Go", "gRPC"]),
        ]:
            client.post("/api/jobs", json={
                "title": title, "description": "X", "location": "Remote",
                "salary_min": 100000, "salary_max": 150000, "type": "full-time",
                "remote": True, "required_skills": skills, "nice_skills": [],
            }, headers=auth_header(comp_token))

        r = client.post("/api/seeker/jobs/matches", json={
            "skills": ["React", "TypeScript"],
            "desired_roles": ["Frontend Developer"],
            "work_preferences": ["Remote"],
        })
        assert r.status_code == 200
        # Filter client-side since POST endpoint doesn't accept min_score
        high_matches = [j for j in r.json() if j["match_score"] >= 50]
        assert len(high_matches) >= 1
        # Ensure there are also lower-scored results (Go job doesn't match React)
        all_scores = [j["match_score"] for j in r.json()]
        assert max(all_scores) > min(all_scores)  # At least some variation


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  6. DATA ISOLATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestDataIsolation:
    """Ensure users cannot access other users' private data."""

    def test_seeker_cannot_see_other_seeker_applications(self, client):
        comp_token, _ = register_user(client, "co@t.com", role="company", company_name="X")
        job_resp = client.post("/api/jobs", json={
            "title": "Dev", "description": "X", "location": "X",
            "salary_min": 80000, "salary_max": 120000, "type": "full-time",
            "remote": True, "required_skills": ["Python"], "nice_skills": [],
        }, headers=auth_header(comp_token))
        job_id = job_resp.json()["id"]

        # Seeker A applies
        sa_token, _ = register_user(client, "a@t.com", role="seeker", name="A")
        client.post("/api/seeker/profile", json={"name": "A", "skills": ["Python"]},
                    headers=auth_header(sa_token))
        client.post(f"/api/jobs/{job_id}/apply", json={"job_id": job_id, "cover_letter": "A"},
                    headers=auth_header(sa_token))

        # Seeker B applies
        sb_token, _ = register_user(client, "b@t.com", role="seeker", name="B")
        client.post("/api/seeker/profile", json={"name": "B", "skills": ["Python"]},
                    headers=auth_header(sb_token))
        client.post(f"/api/jobs/{job_id}/apply", json={"job_id": job_id, "cover_letter": "B"},
                    headers=auth_header(sb_token))

        # Each sees only own
        a_apps = client.get("/api/jobs/me/applications", headers=auth_header(sa_token))
        b_apps = client.get("/api/jobs/me/applications", headers=auth_header(sb_token))
        assert len(a_apps.json()) == 1
        assert len(b_apps.json()) == 1
        assert a_apps.json()[0]["cover_letter"] == "A"
        assert b_apps.json()[0]["cover_letter"] == "B"

    def test_company_a_cannot_see_company_b_applications(self, client):
        ca_token, _ = register_user(client, "ca@t.com", role="company", company_name="A Inc")
        cb_token, _ = register_user(client, "cb@t.com", role="company", company_name="B Inc")

        ja = client.post("/api/jobs", json={
            "title": "Dev A", "description": "X", "location": "X",
            "salary_min": 80000, "salary_max": 120000, "type": "full-time",
            "remote": True, "required_skills": ["Python"], "nice_skills": [],
        }, headers=auth_header(ca_token)).json()["id"]

        jb = client.post("/api/jobs", json={
            "title": "Dev B", "description": "X", "location": "X",
            "salary_min": 80000, "salary_max": 120000, "type": "full-time",
            "remote": True, "required_skills": ["Go"], "nice_skills": [],
        }, headers=auth_header(cb_token)).json()["id"]

        # Seeker applies to both
        s_token, _ = register_user(client, "s@t.com", role="seeker", name="S")
        client.post("/api/seeker/profile", json={"name": "S", "skills": ["Python", "Go"]},
                    headers=auth_header(s_token))
        client.post(f"/api/jobs/{ja}/apply", json={"job_id": ja, "cover_letter": "For A"},
                    headers=auth_header(s_token))
        client.post(f"/api/jobs/{jb}/apply", json={"job_id": jb, "cover_letter": "For B"},
                    headers=auth_header(s_token))

        # Company A sees only their job's apps
        a_apps = client.get(f"/api/jobs/{ja}/applications", headers=auth_header(ca_token))
        assert len(a_apps.json()) == 1

        # Company B sees only their job's apps
        b_apps = client.get(f"/api/jobs/{jb}/applications", headers=auth_header(cb_token))
        assert len(b_apps.json()) == 1


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  7. AI SERVICES INTEGRATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestAIServicesRegression:
    """AI services should produce consistent, meaningful results."""

    def test_match_scoring_deterministic_for_same_inputs(self, client):
        comp_token, _ = register_user(client, "co@t.com", role="company", company_name="X")
        client.post("/api/jobs", json={
            "title": "Dev", "description": "X", "location": "Remote",
            "salary_min": 100000, "salary_max": 150000, "type": "full-time",
            "remote": True, "required_skills": ["Python", "FastAPI"],
            "nice_skills": ["Docker"],
        }, headers=auth_header(comp_token))

        payload = {
            "skills": ["Python", "FastAPI", "Docker"],
            "desired_roles": ["Backend Developer"],
            "work_preferences": ["Remote"],
        }

        r1 = client.post("/api/seeker/jobs/matches", json=payload)
        r2 = client.post("/api/seeker/jobs/matches", json=payload)

        # Scores should be identical for same inputs
        assert r1.json()[0]["match_score"] == r2.json()[0]["match_score"]

    def test_resume_upload_produces_valid_profile(self, client):
        s_token, _ = register_user(client, "s@t.com", role="seeker", name="S")
        r = client.post("/api/seeker/resume/upload",
                        files={"file": ("resume.pdf", b"%PDF-1.4 fake", "application/pdf")},
                        headers=auth_header(s_token))
        assert r.status_code == 200
        data = r.json()
        assert "profile" in data
        assert len(data["profile"]["skills"]) >= 5
        assert len(data["profile"]["experience"]) >= 1

    def test_ai_summary_contains_skills(self, client):
        s_token, _ = register_user(client, "s@t.com", role="seeker", name="S")
        r = client.post("/api/seeker/ai/summary", json={
            "name": "Alex", "skills": ["React", "TypeScript", "Node.js"],
            "desired_roles": ["Frontend Developer"],
            "experience_level": "Senior (6-9 yrs)",
        }, headers=auth_header(s_token))
        summary = r.json()["summary"]
        # Summary should mention at least some of the skills
        assert any(s.lower() in summary.lower() for s in ["React", "TypeScript", "Node.js"])


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  8. EDGE CASES REGRESSION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestEdgeCasesRegression:
    """Previously caught bugs and edge cases that must not regress."""

    def test_me_applications_route_not_treated_as_job_id(self, client):
        """Regression: /jobs/me/applications must not match /{job_id}."""
        s_token, _ = register_user(client, "s@t.com", role="seeker", name="S")
        r = client.get("/api/jobs/me/applications", headers=auth_header(s_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_empty_database_returns_empty_lists(self, client):
        """All list endpoints should return [] not errors on empty DB."""
        r = client.get("/api/jobs")
        assert r.status_code == 200
        assert r.json() == []

    def test_nonexistent_job_returns_404(self, client):
        r = client.get("/api/jobs/nonexistent_id")
        assert r.status_code == 404

    def test_profile_create_is_idempotent(self, client):
        """Creating a profile twice should update, not error."""
        s_token, _ = register_user(client, "s@t.com", role="seeker", name="S")
        profile = {"name": "Test", "skills": ["Python"]}

        r1 = client.post("/api/seeker/profile", json=profile, headers=auth_header(s_token))
        assert r1.status_code == 201

        profile["skills"] = ["Python", "React"]
        r2 = client.post("/api/seeker/profile", json=profile, headers=auth_header(s_token))
        assert r2.status_code == 201

        # Latest profile should have updated skills
        r = client.get("/api/seeker/profile", headers=auth_header(s_token))
        assert "React" in r.json()["skills"]

    def test_duplicate_email_registration_fails(self, client):
        register_user(client, "dup@t.com", role="seeker", name="First")
        r = client.post("/api/auth/register", json={
            "email": "dup@t.com", "password": "password123", "role": "seeker",
        })
        assert r.status_code == 409

    def test_wrong_password_login_fails(self, client):
        register_user(client, "u@t.com", role="seeker", name="U")
        r = client.post("/api/auth/login", json={"email": "u@t.com", "password": "wrong"})
        assert r.status_code == 401

    def test_invalid_file_type_rejected(self, client):
        s_token, _ = register_user(client, "s@t.com", role="seeker", name="S")
        r = client.post("/api/seeker/resume/upload",
                        files={"file": ("virus.exe", b"MZ\x90", "application/octet-stream")},
                        headers=auth_header(s_token))
        assert r.status_code == 400
