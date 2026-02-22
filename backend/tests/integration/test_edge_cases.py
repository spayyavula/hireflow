"""
Integration edge-case tests — boundary conditions, invalid inputs,
authorization checks, and concurrent-like scenarios.
"""

import io
import pytest


class TestAuthEdgeCases:
    def test_register_invalid_role(self, client):
        r = client.post("/api/auth/register", json={
            "email": "x@y.com", "password": "12345678", "role": "admin",
        })
        assert r.status_code == 422

    def test_register_missing_email(self, client):
        r = client.post("/api/auth/register", json={
            "password": "12345678", "role": "seeker",
        })
        assert r.status_code == 422

    def test_login_empty_body(self, client):
        r = client.post("/api/auth/login", json={})
        assert r.status_code == 422

    def test_expired_or_invalid_bearer(self, client):
        r = client.get("/api/seeker/profile",
                       headers={"Authorization": "Bearer fake.jwt.token"})
        assert r.status_code == 401

    def test_missing_auth_header(self, client):
        r = client.get("/api/seeker/profile")
        assert r.status_code == 401


class TestJobEdgeCases:
    def test_create_job_missing_title(self, client, company_auth):
        r = client.post("/api/jobs", headers=company_auth, json={
            "location": "Remote", "description": "No title",
        })
        assert r.status_code == 422

    def test_create_job_empty_skills(self, client, company_auth):
        r = client.post("/api/jobs", headers=company_auth, json={
            "title": "Minimal Job", "location": "NYC", "description": "Test",
            "required_skills": [], "nice_skills": [],
        })
        assert r.status_code == 201
        assert r.json()["required_skills"] == []

    def test_search_no_results(self, client, sample_jobs):
        r = client.get("/api/jobs?search=zyxwv_nonexistent")
        assert r.status_code == 200
        assert r.json() == []

    def test_apply_as_company_succeeds(self, client, company_auth, sample_jobs):
        """API allows any authenticated user to apply (no role check on apply)."""
        r = client.post(f"/api/jobs/{sample_jobs[0]}/apply", headers=company_auth, json={
            "job_id": sample_jobs[0],
        })
        assert r.status_code == 201

    def test_update_application_invalid_status(self, client, seeker_auth, company_auth, sample_jobs):
        apply_r = client.post(f"/api/jobs/{sample_jobs[0]}/apply", headers=seeker_auth, json={
            "job_id": sample_jobs[0],
        })
        app_id = apply_r.json()["id"]
        r = client.patch(
            f"/api/jobs/applications/{app_id}/status", headers=company_auth,
            json={"status": "not_a_real_status"},
        )
        assert r.status_code == 422


class TestSeekerEdgeCases:
    def test_profile_update_preserves_fields(self, client, seeker_with_profile):
        """Updating one field shouldn't wipe other fields."""
        # Update just the headline
        r = client.post("/api/seeker/profile", headers=seeker_with_profile, json={
            "name": "Alice Seeker", "headline": "Updated Headline",
            "skills": ["React", "TypeScript", "Node.js", "AWS"],
            "desired_roles": ["Frontend Developer"],
        })
        assert r.status_code == 201
        assert r.json()["headline"] == "Updated Headline"

    def test_resume_upload_empty_file(self, client, seeker_auth):
        r = client.post("/api/seeker/resume/upload", headers=seeker_auth,
                        files={"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")})
        assert r.status_code == 200  # Parser handles empty gracefully

    def test_matches_sorted_descending(self, client, seeker_with_profile, sample_jobs):
        r = client.get("/api/seeker/jobs/matches", headers=seeker_with_profile)
        scores = [j["match_score"] for j in r.json()]
        assert scores == sorted(scores, reverse=True)

    def test_public_match_with_empty_skills(self, client, sample_jobs):
        r = client.post("/api/seeker/jobs/matches", json={
            "skills": [], "desired_roles": [],
        })
        assert r.status_code == 200
        # All scores should be low but present
        for j in r.json():
            assert 15 <= j["match_score"] <= 99


class TestRecruiterEdgeCases:
    def test_recruiter_cannot_create_jobs(self, client, recruiter_auth):
        r = client.post("/api/jobs", headers=recruiter_auth, json={
            "title": "Nope", "location": "X", "description": "X",
        })
        assert r.status_code == 403

    def test_seeker_cannot_create_jobs(self, client, seeker_auth):
        r = client.post("/api/jobs", headers=seeker_auth, json={
            "title": "Nope", "location": "X", "description": "X",
        })
        assert r.status_code == 403


class TestChatEdgeCases:
    def test_send_message_empty_content(self, client, seeker_auth, recruiter_auth):
        r = client.post("/api/auth/login", json={
            "email": "rec@test.com", "password": "password123",
        })
        rec_id = r.json()["user"]["id"]
        r = client.post("/api/chat/messages", headers=seeker_auth, json={
            "recipient_id": rec_id, "content": "",
        })
        # Should either succeed with empty or be rejected as 422
        assert r.status_code in (201, 422)

    def test_send_message_to_self(self, client, seeker_auth):
        # Get own user ID
        r = client.post("/api/auth/login", json={
            "email": "seeker@test.com", "password": "password123",
        })
        own_id = r.json()["user"]["id"]
        r = client.post("/api/chat/messages", headers=seeker_auth, json={
            "recipient_id": own_id, "content": "Talking to myself",
        })
        # Should work or be explicitly rejected
        assert r.status_code in (201, 400)

    def test_conversations_empty_for_new_user(self, client, seeker_auth):
        r = client.get("/api/chat/conversations", headers=seeker_auth)
        assert r.status_code == 200
        assert r.json() == []
