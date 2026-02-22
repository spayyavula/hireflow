"""
Regression Test Suite — Backend
================================

End-to-end tests that simulate full user journeys:
1. Seeker registration → profile → matching → application → messaging
2. Company registration → job posting → applicant review → pipeline
3. Recruiter login → candidate search → pipeline management
4. Edge cases and boundary conditions that previously caused bugs

Run with: pytest tests/test_regression.py -m regression -v
"""

import pytest
from tests.conftest import register_user, auth_header


# ═════════════════════════════════════════════════════════
#  FLOW 1: Complete Seeker Journey
# ═════════════════════════════════════════════════════════
class TestSeekerJourneyRegression:
    """Full seeker flow from registration to job application to messaging."""

    @pytest.mark.regression
    def test_complete_seeker_journey(self, seeded_client):
        c = seeded_client

        # Step 1: Register
        resp = c.post("/api/auth/register", json={
            "email": "journey@test.com", "password": "journey123",
            "role": "seeker", "name": "Journey User",
        })
        assert resp.status_code == 201
        token = resp.json()["access_token"]
        user_id = resp.json()["user"]["id"]
        headers = auth_header(token)

        # Step 2: Profile not created yet
        resp = c.get("/api/seeker/profile", headers=headers)
        assert resp.status_code == 404

        # Step 3: Upload resume
        resp = c.post("/api/seeker/resume/upload",
            files={"file": ("resume.pdf", b"fake", "application/pdf")},
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["skills_extracted"] >= 5

        # Step 4: Profile now exists
        resp = c.get("/api/seeker/profile", headers=headers)
        assert resp.status_code == 200
        profile = resp.json()
        assert profile["profile_strength"] == "Strong"
        assert len(profile["skills"]) >= 5

        # Step 5: Get AI-matched jobs
        resp = c.get("/api/seeker/jobs/matches", headers=headers)
        assert resp.status_code == 200
        matches = resp.json()
        assert len(matches) >= 1
        top_match = matches[0]
        assert top_match["match_score"] >= 15
        assert top_match["match_reasons"]

        # Step 6: Apply to top match
        job_id = top_match["id"]
        resp = c.post(f"/api/jobs/{job_id}/apply", json={
            "job_id": job_id, "cover_letter": "I'm a great fit!",
        }, headers=headers)
        assert resp.status_code == 201
        assert resp.json()["status"] == "applied"

        # Step 7: Verify application appears in "my applications"
        resp = c.get("/api/jobs/me/applications", headers=headers)
        assert resp.status_code == 200
        apps = resp.json()
        assert len(apps) == 1
        assert apps[0]["job_id"] == job_id

        # Step 8: Send message to recruiter
        resp = c.post("/api/chat/messages", json={
            "recipient_id": "rec_1", "content": "Hey, I just applied!",
        }, headers=headers)
        assert resp.status_code == 201

        # Step 9: Check conversations
        resp = c.get("/api/chat/conversations", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 1

        # Step 10: Analytics should reflect the application
        resp = c.get("/api/seeker/analytics", headers=headers)
        assert resp.status_code == 200
        analytics = resp.json()
        assert analytics["total_applications"] == 1


# ═════════════════════════════════════════════════════════
#  FLOW 2: Complete Company Journey
# ═════════════════════════════════════════════════════════
class TestCompanyJourneyRegression:
    """Company: login → post job → review applicants → advance pipeline."""

    @pytest.mark.regression
    def test_complete_company_journey(self, seeded_client):
        c = seeded_client

        # Step 1: Login as TechVault
        resp = c.post("/api/auth/login", json={
            "email": "techvault@demo.com", "password": "demo1234",
        })
        assert resp.status_code == 200
        co_token = resp.json()["access_token"]
        co_headers = auth_header(co_token)

        # Step 2: Check dashboard
        resp = c.get("/api/company/dashboard", headers=co_headers)
        assert resp.status_code == 200
        assert resp.json()["open_positions"] >= 1

        # Step 3: Post a new job
        resp = c.post("/api/jobs", json={
            "title": "QA Engineer",
            "location": "Remote",
            "salary_min": 100000, "salary_max": 140000,
            "type": "full-time", "remote": True,
            "description": "Automated testing for our platform.",
            "required_skills": ["Cypress", "Selenium", "JavaScript"],
            "experience_level": "Mid Level (3-5 yrs)",
        }, headers=co_headers)
        assert resp.status_code == 201
        new_job_id = resp.json()["id"]

        # Step 4: Verify it appears in job list
        resp = c.get("/api/jobs")
        all_ids = [j["id"] for j in resp.json()]
        assert new_job_id in all_ids

        # Step 5: Seeker applies to the new job
        seeker_token, _ = register_user(c, email="qa_seeker@test.com", role="seeker", name="QA Seeker")
        resp = c.post(f"/api/jobs/{new_job_id}/apply", json={
            "job_id": new_job_id,
        }, headers=auth_header(seeker_token))
        assert resp.status_code == 201
        app_id = resp.json()["id"]

        # Step 6: Company views applications
        resp = c.get(f"/api/jobs/{new_job_id}/applications", headers=co_headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 1

        # Step 7: Move candidate through pipeline
        for stage in ["screening", "interview", "offer", "hired"]:
            resp = c.patch(f"/api/jobs/applications/{app_id}/status", json={
                "status": stage,
            }, headers=co_headers)
            assert resp.status_code == 200
            assert resp.json()["status"] == stage

        # Step 8: Close the job
        resp = c.delete(f"/api/jobs/{new_job_id}", headers=co_headers)
        assert resp.status_code == 200

        # Step 9: Analytics
        resp = c.get("/api/company/analytics", headers=co_headers)
        assert resp.status_code == 200


# ═════════════════════════════════════════════════════════
#  FLOW 3: Recruiter Journey
# ═════════════════════════════════════════════════════════
class TestRecruiterJourneyRegression:
    """Recruiter: login → search candidates → view pipeline → analytics."""

    @pytest.mark.regression
    def test_complete_recruiter_journey(self, seeded_client):
        c = seeded_client

        # Create a seeker so there's someone to find
        seeker_token, _ = register_user(c, email="findme@test.com", role="seeker", name="Find Me")
        c.post("/api/seeker/profile", json={
            "name": "Find Me",
            "skills": ["React", "TypeScript", "JavaScript", "Next.js", "Redux"],
            "desired_roles": ["Frontend Developer"],
            "experience_level": "Senior (6-9 yrs)",
            "work_preferences": ["Remote"],
            "experience": [{"title": "Dev", "company": "X", "duration": "5y"}],
            "education": [{"school": "Stanford", "degree": "BS CS"}],
            "summary": "Expert React developer.",
        }, headers=auth_header(seeker_token))

        # Apply to job so pipeline has data
        c.post("/api/jobs/job_1/apply", json={"job_id": "job_1"}, headers=auth_header(seeker_token))

        # Login as recruiter
        resp = c.post("/api/auth/login", json={
            "email": "recruiter@demo.com", "password": "demo1234",
        })
        rec_token = resp.json()["access_token"]
        rec_headers = auth_header(rec_token)

        # Search candidates
        resp = c.get("/api/recruiter/candidates", headers=rec_headers)
        assert resp.status_code == 200
        candidates = resp.json()
        assert len(candidates) >= 1
        assert candidates[0]["name"] == "Find Me"

        # Search by skill
        resp = c.get("/api/recruiter/candidates?skills=React", headers=rec_headers)
        assert resp.status_code == 200
        assert all(any("React" in s for s in c["skills"]) for c in resp.json())

        # View pipeline
        resp = c.get("/api/recruiter/pipeline", headers=rec_headers)
        assert resp.status_code == 200
        assert resp.json()["total"] >= 1

        # Analytics
        resp = c.get("/api/recruiter/analytics", headers=rec_headers)
        assert resp.status_code == 200


# ═════════════════════════════════════════════════════════
#  EDGE CASES & BOUNDARY CONDITIONS
# ═════════════════════════════════════════════════════════
class TestEdgeCasesRegression:
    """Tests for edge cases and previously observed issues."""

    @pytest.mark.regression
    def test_health_endpoint(self, seeded_client):
        resp = seeded_client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["database"] == "supabase"

    @pytest.mark.regression
    def test_register_all_three_roles(self, client):
        """Ensure all three roles can register."""
        for role, extra in [
            ("seeker", {}),
            ("recruiter", {}),
            ("company", {"company_name": "TestCo"}),
        ]:
            resp = client.post("/api/auth/register", json={
                "email": f"{role}@roles.com", "password": "password123",
                "role": role, "name": f"{role} user", **extra,
            })
            assert resp.status_code == 201, f"Failed to register {role}"
            assert resp.json()["user"]["role"] == role

    @pytest.mark.regression
    def test_empty_skills_matching_doesnt_crash(self, seeded_client):
        """A seeker with empty profile can still attempt matching."""
        token, _ = register_user(seeded_client, email="empty@test.com")
        resp = seeded_client.post("/api/seeker/jobs/matches", json={
            "skills": [],
        })
        assert resp.status_code == 200

    @pytest.mark.regression
    def test_large_skill_set(self, seeded_client):
        """50 skills should not crash or slow down matching."""
        skills = [f"Skill{i}" for i in range(50)]
        resp = seeded_client.post("/api/seeker/jobs/matches", json={
            "skills": skills, "desired_roles": ["Developer"],
        })
        assert resp.status_code == 200

    @pytest.mark.regression
    def test_special_characters_in_names(self, client):
        """Names with special characters should work."""
        token, user = register_user(client, email="special@test.com", name="O'Brien-García")
        assert user["name"] == "O'Brien-García"

    @pytest.mark.regression
    def test_concurrent_applications_to_different_jobs(self, seeded_client):
        """Seeker applies to multiple jobs — no interference."""
        token, _ = register_user(seeded_client, email="multi@test.com", role="seeker")
        for job_id in ["job_1", "job_2", "job_3"]:
            resp = seeded_client.post(f"/api/jobs/{job_id}/apply", json={
                "job_id": job_id,
            }, headers=auth_header(token))
            assert resp.status_code == 201

        resp = seeded_client.get("/api/jobs/me/applications", headers=auth_header(token))
        assert len(resp.json()) == 3

    @pytest.mark.regression
    def test_job_salary_display_formatting(self, seeded_client):
        """Salary display should be formatted correctly."""
        resp = seeded_client.get("/api/jobs/job_1")
        data = resp.json()
        assert data["salary_display"] == "$160k–$200k"

    @pytest.mark.regression
    def test_match_score_always_in_valid_range(self, seeded_client):
        """All match scores should be between 15 and 99."""
        resp = seeded_client.post("/api/seeker/jobs/matches", json={
            "skills": ["React", "TypeScript", "Python", "AWS"],
            "desired_roles": ["Software Engineer"],
            "work_preferences": ["Remote"],
            "experience_level": "Senior (6-9 yrs)",
        })
        for m in resp.json():
            assert 15 <= m["match_score"] <= 99, f"Score {m['match_score']} out of range"

    @pytest.mark.regression
    def test_two_way_chat(self, seeded_client):
        """Both parties in a conversation can send and see messages."""
        c = seeded_client

        # Seeker sends
        seeker_token, seeker = register_user(c, email="chat_a@test.com", role="seeker", name="Chat A")
        seeker_headers = auth_header(seeker_token)
        resp = c.post("/api/chat/messages", json={
            "recipient_id": "rec_1", "content": "Hello from seeker",
        }, headers=seeker_headers)
        conv_id = resp.json()["conversation_id"]

        # Recruiter sees it and replies
        rec_resp = c.post("/api/auth/login", json={
            "email": "recruiter@demo.com", "password": "demo1234",
        })
        rec_token = rec_resp.json()["access_token"]
        rec_headers = auth_header(rec_token)

        resp = c.get(f"/api/chat/conversations/{conv_id}/messages", headers=rec_headers)
        assert len(resp.json()) == 1
        assert resp.json()[0]["content"] == "Hello from seeker"

        c.post("/api/chat/messages", json={
            "recipient_id": seeker["id"], "content": "Reply from recruiter",
        }, headers=rec_headers)

        # Seeker sees both messages
        resp = c.get(f"/api/chat/conversations/{conv_id}/messages", headers=seeker_headers)
        assert len(resp.json()) == 2

    @pytest.mark.regression
    def test_profile_update_overwrites_fields(self, seeded_client):
        """Updating profile should overwrite, not append."""
        token, _ = register_user(seeded_client, email="overwrite@test.com", role="seeker", name="Overwriter")
        headers = auth_header(token)

        # Create profile with 3 skills
        seeded_client.post("/api/seeker/profile", json={
            "name": "Overwriter", "skills": ["A", "B", "C"],
            "desired_roles": ["Dev"], "experience_level": "Senior (6-9 yrs)",
        }, headers=headers)

        # Update with 2 different skills
        seeded_client.post("/api/seeker/profile", json={
            "name": "Overwriter", "skills": ["X", "Y"],
            "desired_roles": ["Dev"], "experience_level": "Senior (6-9 yrs)",
        }, headers=headers)

        resp = seeded_client.get("/api/seeker/profile", headers=headers)
        assert resp.json()["skills"] == ["X", "Y"]

    @pytest.mark.regression
    def test_closed_job_excluded_from_listings(self, seeded_client):
        """Closed jobs should not appear in the active job list."""
        co_resp = seeded_client.post("/api/auth/login", json={
            "email": "techvault@demo.com", "password": "demo1234",
        })
        co_token = co_resp.json()["access_token"]

        seeded_client.delete("/api/jobs/job_1", headers=auth_header(co_token))

        resp = seeded_client.get("/api/jobs")
        ids = [j["id"] for j in resp.json()]
        assert "job_1" not in ids
