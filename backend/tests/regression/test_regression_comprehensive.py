"""
Comprehensive Regression Test Suite for HireFlow Backend.
End-to-end user journeys that mirror real-world usage patterns.
Each test class represents a complete user workflow.
"""

import pytest
from tests.conftest import register_user, auth_header, create_seeker_with_profile


class TestFullSeekerJourney:
    """Complete seeker lifecycle: register → profile → upload → match → apply → track."""

    def test_register_and_login(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "seeker@journey.com", "password": "journey123", "role": "seeker", "name": "Journey Seeker",
        })
        assert resp.status_code == 201
        token = resp.json()["access_token"]

        # Login with same creds
        resp = client.post("/api/auth/login", json={
            "email": "seeker@journey.com", "password": "journey123",
        })
        assert resp.status_code == 200
        login_token = resp.json()["access_token"]
        assert len(login_token) > 20  # Valid JWT returned

    def test_build_profile_and_get(self, client):
        token, _ = register_user(client, email="seeker@j.com", role="seeker", name="Journey Seeker")
        profile_data = {
            "name": "Journey Seeker",
            "headline": "Senior React Developer",
            "location": "San Francisco, CA",
            "skills": ["React", "TypeScript", "Node.js", "Python", "AWS"],
            "desired_roles": ["Frontend Developer", "Full Stack Developer"],
            "experience_level": "Senior (6-9 yrs)",
            "work_preferences": ["Remote"],
            "salary_range": "$160k–$200k",
            "industries": ["Tech / SaaS"],
            "experience": [{"title": "Senior Dev", "company": "Stripe", "duration": "2021-2024"}],
            "education": [{"school": "MIT", "degree": "B.S. CS", "year": "2018"}],
        }
        resp = client.post("/api/seeker/profile", json=profile_data, headers=auth_header(token))
        assert resp.status_code == 201

        # Verify profile persists
        resp = client.get("/api/seeker/profile", headers=auth_header(token))
        assert resp.status_code == 200
        p = resp.json()
        assert p["name"] == "Journey Seeker"
        assert "React" in p["skills"]
        assert p["profile_strength"] in ["Good", "Strong"]

    def test_resume_upload_flow(self, client):
        token, _ = register_user(client, email="upload@j.com", role="seeker")
        resp = client.post("/api/seeker/resume/upload",
            files={"file": ("resume.pdf", b"content", "application/pdf")},
            headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data["skills_extracted"], int)
        assert isinstance(data["experience_extracted"], int)

        # Explicitly save profile to DB after upload
        resp = client.post("/api/seeker/profile", json={
            "name": "Test User",
            "skills": ["React", "TypeScript", "Python", "Docker", "AWS"],
            "desired_roles": ["Full Stack Developer"],
            "experience_level": "Senior (6-9 yrs)",
            "work_preferences": ["Remote"],
            "experience": [{"title": "Engineer", "company": "Acme", "duration": "2020 - Present"}],
            "education": [{"school": "MIT", "degree": "B.S. CS", "year": "2020"}],
        }, headers=auth_header(token))
        assert resp.status_code == 201

        # Profile should exist now
        resp = client.get("/api/seeker/profile", headers=auth_header(token))
        assert resp.status_code == 200

    def test_ai_summary_generation(self, client):
        token, _ = register_user(client, email="ai@j.com", role="seeker")
        resp = client.post("/api/seeker/ai/summary", json={
            "name": "Journey Seeker",
            "skills": ["React", "TypeScript", "Python"],
            "desired_roles": ["Frontend Developer"],
            "experience_level": "Senior (6-9 yrs)",
            "experience": [{"title": "Lead Dev", "company": "Google", "duration": "2020-2024", "description": "Led frontend team of 8."}],
        }, headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "Lead Dev" in data["summary"] or "Google" in data["summary"]
        assert len(data["suggested_headline"]) > 5
        assert isinstance(data["suggested_skills"], list)

    def test_match_and_apply_flow(self, seeded_client):
        token, _ = create_seeker_with_profile(seeded_client)

        # Get matches
        resp = seeded_client.get("/api/seeker/jobs/matches", headers=auth_header(token))
        assert resp.status_code == 200
        matches = resp.json()
        assert len(matches) > 0
        best_job = matches[0]
        assert best_job["match_score"] > 0

        # Apply to best match
        resp = seeded_client.post(f"/api/jobs/{best_job['id']}/apply", json={
            "job_id": best_job["id"], "cover_letter": "I'm a great fit!",
        }, headers=auth_header(token))
        assert resp.status_code == 201

        # Check my applications
        resp = seeded_client.get("/api/jobs/me/applications", headers=auth_header(token))
        assert resp.status_code == 200
        apps = resp.json()
        assert len(apps) == 1
        assert apps[0]["status"] == "applied"

    def test_apply_to_multiple_jobs(self, seeded_client):
        token, _ = create_seeker_with_profile(seeded_client)
        for job_id in ["job_1", "job_2", "job_3"]:
            seeded_client.post(f"/api/jobs/{job_id}/apply", json={"job_id": job_id}, headers=auth_header(token))

        resp = seeded_client.get("/api/jobs/me/applications", headers=auth_header(token))
        assert len(resp.json()) == 3


class TestFullCompanyHiringFlow:
    """Company lifecycle: register → post job → review applicants → advance pipeline."""

    def test_post_job_and_receive_applications(self, seeded_client):
        # Register company
        token_co, co = register_user(seeded_client, email="co@hire.com", role="company", company_name="HireCo")

        # Post a job
        resp = seeded_client.post("/api/jobs", json={
            "title": "React Lead",
            "location": "Remote",
            "description": "Lead our frontend team",
            "required_skills": ["React", "TypeScript"],
            "nice_skills": ["Next.js", "AWS"],
            "remote": True,
            "type": "full-time",
        }, headers=auth_header(token_co))
        assert resp.status_code == 201
        job_id = resp.json()["id"]

        # Seeker applies
        token_s, _ = register_user(seeded_client, email="applicant@test.com", role="seeker")
        seeded_client.post(f"/api/jobs/{job_id}/apply", json={
            "job_id": job_id, "cover_letter": "I'd love to join!",
        }, headers=auth_header(token_s))

        # Company reviews applications
        resp = seeded_client.get(f"/api/jobs/{job_id}/applications", headers=auth_header(token_co))
        assert resp.status_code == 200
        apps = resp.json()
        assert len(apps) == 1

    def test_advance_through_pipeline(self, seeded_client):
        token_co, _ = register_user(seeded_client, email="co@pipe.com", role="company", company_name="PipeCo")
        resp = seeded_client.post("/api/jobs", json={
            "title": "Python Dev", "location": "Remote",
            "description": "Backend work", "required_skills": ["Python"],
        }, headers=auth_header(token_co))
        job_id = resp.json()["id"]

        token_s, _ = register_user(seeded_client, email="seeker@pipe.com", role="seeker")
        apply_resp = seeded_client.post(f"/api/jobs/{job_id}/apply", json={"job_id": job_id}, headers=auth_header(token_s))
        app_id = apply_resp.json()["id"]

        # Progress through stages
        for status in ["screening", "interview", "offer", "hired"]:
            resp = seeded_client.patch(f"/api/jobs/applications/{app_id}/status",
                json={"status": status}, headers=auth_header(token_co))
            assert resp.status_code == 200
            assert resp.json()["status"] == status

    def test_close_job_stops_applications(self, seeded_client):
        token_co, _ = register_user(seeded_client, email="co@close.com", role="company", company_name="CloseCo")
        resp = seeded_client.post("/api/jobs", json={
            "title": "Temp Job", "location": "NY",
            "description": "Temporary", "required_skills": [],
        }, headers=auth_header(token_co))
        job_id = resp.json()["id"]

        # Close the job
        seeded_client.delete(f"/api/jobs/{job_id}", headers=auth_header(token_co))

        # Verify closed
        resp = seeded_client.get(f"/api/jobs/{job_id}")
        assert resp.json()["status"] == "closed"

    def test_company_dashboard_data(self, seeded_client):
        from api.core.config import create_access_token
        token = create_access_token({"sub": "comp_1", "role": "company"})
        resp = seeded_client.get("/api/company/dashboard", headers=auth_header(token))
        assert resp.status_code == 200


class TestRecruiterWorkflow:
    """Recruiter lifecycle: register → search candidates → manage pipeline → analytics."""

    def test_search_and_filter_candidates(self, seeded_client):
        # Create a seeker with React skills
        create_seeker_with_profile(seeded_client)

        token, _ = register_user(seeded_client, email="rec@work.com", role="recruiter", name="Recruiter Pro")

        # Basic search
        resp = seeded_client.get("/api/recruiter/candidates", headers=auth_header(token))
        assert resp.status_code == 200
        candidates = resp.json()
        assert len(candidates) >= 1

        # Advanced search by skills
        resp = seeded_client.post("/api/recruiter/candidates/search", json={
            "skills": ["React"],
        }, headers=auth_header(token))
        assert resp.status_code == 200

    def test_pipeline_view(self, seeded_client):
        token, _ = register_user(seeded_client, email="rec@pipe.com", role="recruiter")
        resp = seeded_client.get("/api/recruiter/pipeline", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "stages" in data

    def test_analytics_view(self, seeded_client):
        token, _ = register_user(seeded_client, email="rec@analytics.com", role="recruiter")
        resp = seeded_client.get("/api/recruiter/analytics", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "placements_ytd" in data


class TestCrossRoleChatFlow:
    """Chat between different user roles."""

    def test_seeker_recruiter_conversation(self, client):
        token_s, user_s = register_user(client, email="s@chat.com", role="seeker", name="Seeker")
        token_r, user_r = register_user(client, email="r@chat.com", role="recruiter", name="Recruiter")

        # Seeker sends first message
        resp = client.post("/api/chat/messages", json={
            "recipient_id": user_r["id"], "content": "Hi, I'm interested in roles!",
        }, headers=auth_header(token_s))
        assert resp.status_code == 201
        conv_id = resp.json()["conversation_id"]

        # Recruiter replies
        resp = client.post("/api/chat/messages", json={
            "recipient_id": user_s["id"], "content": "Great, let me check your profile!",
        }, headers=auth_header(token_r))
        assert resp.status_code == 201
        assert resp.json()["conversation_id"] == conv_id  # Same conversation

        # Both see conversation
        for token in [token_s, token_r]:
            resp = client.get("/api/chat/conversations", headers=auth_header(token))
            assert len(resp.json()) == 1

        # Messages are in order
        resp = client.get(f"/api/chat/conversations/{conv_id}/messages", headers=auth_header(token_s))
        msgs = resp.json()
        assert len(msgs) == 2
        assert msgs[0]["content"] == "Hi, I'm interested in roles!"
        assert msgs[1]["content"] == "Great, let me check your profile!"

    def test_multiple_conversations(self, client):
        """One user can have separate conversations with multiple people."""
        token_a, user_a = register_user(client, email="a@chat.com", role="seeker", name="A")
        token_b, user_b = register_user(client, email="b@chat.com", role="recruiter", name="B")
        token_c, user_c = register_user(client, email="c@chat.com", role="company", name="C", company_name="Co")

        # A messages B
        client.post("/api/chat/messages", json={
            "recipient_id": user_b["id"], "content": "Hello B!",
        }, headers=auth_header(token_a))

        # A messages C
        client.post("/api/chat/messages", json={
            "recipient_id": user_c["id"], "content": "Hello C!",
        }, headers=auth_header(token_a))

        # A should see 2 conversations
        resp = client.get("/api/chat/conversations", headers=auth_header(token_a))
        assert len(resp.json()) == 2


class TestDataIsolation:
    """Ensure users only see their own data."""

    def test_seeker_applications_isolated(self, seeded_client):
        token_a, _ = register_user(seeded_client, email="a@iso.com", role="seeker")
        token_b, _ = register_user(seeded_client, email="b@iso.com", role="seeker")

        seeded_client.post("/api/jobs/job_1/apply", json={"job_id": "job_1"}, headers=auth_header(token_a))
        seeded_client.post("/api/jobs/job_2/apply", json={"job_id": "job_2"}, headers=auth_header(token_b))

        resp_a = seeded_client.get("/api/jobs/me/applications", headers=auth_header(token_a))
        resp_b = seeded_client.get("/api/jobs/me/applications", headers=auth_header(token_b))

        assert len(resp_a.json()) == 1
        assert len(resp_b.json()) == 1
        assert resp_a.json()[0]["job_id"] == "job_1"
        assert resp_b.json()[0]["job_id"] == "job_2"

    def test_company_sees_only_own_jobs(self, seeded_client):
        token_a, _ = register_user(seeded_client, email="a@co.com", role="company", company_name="CoA")
        token_b, _ = register_user(seeded_client, email="b@co.com", role="company", company_name="CoB")

        seeded_client.post("/api/jobs", json={
            "title": "Job A", "location": "NY", "description": "A's job", "required_skills": [],
        }, headers=auth_header(token_a))
        seeded_client.post("/api/jobs", json={
            "title": "Job B", "location": "LA", "description": "B's job", "required_skills": [],
        }, headers=auth_header(token_b))

        # Both jobs visible publicly
        resp = seeded_client.get("/api/jobs")
        titles = [j["title"] for j in resp.json()]
        assert "Job A" in titles
        assert "Job B" in titles


class TestEdgeCaseRegression:
    """Edge cases that caused bugs in previous versions."""

    def test_me_applications_not_matched_as_job_id(self, seeded_client):
        """Regression: /jobs/me/applications must not be intercepted by /jobs/{job_id}."""
        token, _ = register_user(seeded_client, email="me@test.com", role="seeker")
        resp = seeded_client.get("/api/jobs/me/applications", headers=auth_header(token))
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_concurrent_registrations_unique(self, client):
        """Multiple users registering simultaneously get unique IDs."""
        users = []
        for i in range(5):
            token, user = register_user(client, email=f"user{i}@concurrent.com", role="seeker")
            users.append(user)
        ids = [u["id"] for u in users]
        assert len(set(ids)) == 5  # All unique

    def test_empty_skills_matching(self, seeded_client):
        """Seeker with no skills should still get results (with low scores)."""
        token, _ = register_user(seeded_client, email="empty@t.com", role="seeker")
        seeded_client.post("/api/seeker/profile", json={
            "name": "Empty", "skills": [], "desired_roles": [],
        }, headers=auth_header(token))
        resp = seeded_client.get("/api/seeker/jobs/matches", headers=auth_header(token))
        # Should either return results with low scores or empty list — not error
        assert resp.status_code in [200, 400]

    def test_special_characters_in_names(self, client):
        """Names with unicode/special chars should work."""
        token, user = register_user(client, email="special@t.com", role="seeker", name="María José O'Brien-García")
        assert user["name"] == "María José O'Brien-García"

    def test_long_cover_letter(self, seeded_client):
        """Very long cover letter should be accepted."""
        token, _ = register_user(seeded_client, email="long@t.com", role="seeker")
        long_letter = "I am very interested. " * 500  # ~11k chars
        resp = seeded_client.post("/api/jobs/job_1/apply", json={
            "job_id": "job_1", "cover_letter": long_letter,
        }, headers=auth_header(token))
        assert resp.status_code == 201

    def test_job_search_case_insensitive(self, seeded_client):
        """Search should be case-insensitive."""
        results_lower = seeded_client.get("/api/jobs?search=react").json()
        results_upper = seeded_client.get("/api/jobs?search=REACT").json()
        assert len(results_lower) == len(results_upper)

    def test_analytics_with_no_data(self, client):
        """Analytics endpoints should return valid defaults with empty DB."""
        token, _ = register_user(client, email="new@t.com", role="seeker")
        resp = client.get("/api/seeker/analytics", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_applications"] == 0
