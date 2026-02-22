"""
Comprehensive Regression Test Suite for HireFlow Backend.

End-to-end journeys, cross-role interactions, state consistency,
boundary conditions, and data integrity validation.
"""

import io
import pytest


class TestSeekerCompleteLifecycle:
    """Full seeker journey: register → profile → resume → matches → apply → analytics."""

    def test_seeker_full_journey(self, client):
        # ── Register (201) ──
        r = client.post("/api/auth/register", json={
            "email": "lifecycle@test.com", "password": "password123",
            "role": "seeker", "name": "Lifecycle User",
        })
        assert r.status_code == 201
        auth = {"Authorization": f"Bearer {r.json()['access_token']}"}

        # ── Create profile (201) ──
        r = client.post("/api/seeker/profile", headers=auth, json={
            "name": "Lifecycle User",
            "skills": ["React", "TypeScript", "Node.js", "Python", "Docker"],
            "desired_roles": ["Full Stack Developer", "Frontend Developer"],
            "experience_level": "Senior (6-9 yrs)",
            "work_preferences": ["Remote"],
            "experience": [{"title": "Senior Dev", "company": "BigCo", "duration": "3y"}],
            "education": [{"school": "MIT", "degree": "BS CS"}],
        })
        assert r.status_code == 201
        profile = r.json()
        assert profile["profile_strength"] in ("Good", "Strong")

        # ── Get matches ──
        r = client.get("/api/seeker/jobs/matches", headers=auth)
        assert r.status_code == 200
        matches = r.json()

        # ── Apply to a job ──
        if matches:
            job_id = matches[0]["id"]
            r = client.post(f"/api/jobs/{job_id}/apply", headers=auth, json={
                "job_id": job_id, "cover_letter": "Excited about this role!",
            })
            assert r.status_code == 201

            # ── Duplicate application blocked (409 Conflict) ──
            r = client.post(f"/api/jobs/{job_id}/apply", headers=auth, json={
                "job_id": job_id,
            })
            assert r.status_code == 409

            # ── Check my applications ──
            r = client.get("/api/jobs/me/applications", headers=auth)
            assert r.status_code == 200
            apps = r.json()
            assert len(apps) == 1
            assert apps[0]["status"] == "applied"

        # ── Analytics ──
        r = client.get("/api/seeker/analytics", headers=auth)
        assert r.status_code == 200

    def test_resume_upload_creates_profile(self, client):
        """Upload resume → auto-populates profile → matches work."""
        r = client.post("/api/auth/register", json={
            "email": "upload_reg@test.com", "password": "password123",
            "role": "seeker", "name": "Upload User",
        })
        assert r.status_code == 201
        auth = {"Authorization": f"Bearer {r.json()['access_token']}"}

        r = client.post(
            "/api/seeker/resume/upload", headers=auth,
            files={"file": ("resume.pdf", io.BytesIO(b"pdf data"), "application/pdf")},
        )
        assert r.status_code == 200
        assert r.json()["skills_extracted"] >= 5

        # Profile exists now
        r = client.get("/api/seeker/profile", headers=auth)
        assert r.status_code == 200
        assert len(r.json()["skills"]) >= 5

        # Matches should work
        r = client.get("/api/seeker/jobs/matches", headers=auth)
        assert r.status_code == 200


class TestCompanyHiringPipeline:
    """Company: post job → receive applications → advance pipeline → hire."""

    def test_full_pipeline(self, client):
        # ── Company setup ──
        r = client.post("/api/auth/register", json={
            "email": "pipeline_co2@test.com", "password": "password123",
            "role": "company", "name": "Pipeline Corp", "company_name": "Pipeline Corp",
        })
        co_auth = {"Authorization": f"Bearer {r.json()['access_token']}"}

        r = client.post("/api/jobs", headers=co_auth, json={
            "title": "Go Developer", "location": "Austin, TX",
            "description": "Build microservices in Go",
            "required_skills": ["Go", "Docker", "Kubernetes"],
            "remote": True, "type": "full-time",
        })
        assert r.status_code == 201
        job_id = r.json()["id"]

        # ── Multiple seekers apply ──
        for i in range(3):
            r = client.post("/api/auth/register", json={
                "email": f"pipeline_seeker_{i}@test.com", "password": "password123",
                "role": "seeker", "name": f"Seeker {i}",
            })
            s_auth = {"Authorization": f"Bearer {r.json()['access_token']}"}

            client.post("/api/seeker/profile", headers=s_auth, json={
                "name": f"Seeker {i}", "skills": ["Go", "Docker"],
                "desired_roles": ["Backend Developer"],
            })

            r = client.post(f"/api/jobs/{job_id}/apply", headers=s_auth, json={
                "job_id": job_id,
            })
            assert r.status_code == 201

        # ── Company sees 3 applications ──
        r = client.get(f"/api/jobs/{job_id}/applications", headers=co_auth)
        assert len(r.json()) == 3

        # ── Advance first through pipeline ──
        app_id = r.json()[0]["id"]
        for status in ["screening", "interview", "offer", "hired"]:
            r = client.patch(
                f"/api/jobs/applications/{app_id}/status", headers=co_auth,
                json={"status": status},
            )
            assert r.status_code == 200
            assert r.json()["status"] == status

        # ── Reject another ──
        all_apps = client.get(f"/api/jobs/{job_id}/applications", headers=co_auth).json()
        if len(all_apps) >= 2:
            r = client.patch(
                f"/api/jobs/applications/{all_apps[1]['id']}/status", headers=co_auth,
                json={"status": "rejected"},
            )
            assert r.status_code == 200

        # ── Dashboard reflects state ──
        r = client.get("/api/company/dashboard", headers=co_auth)
        assert r.status_code == 200

    def test_close_job_stops_new_applications(self, client, company_auth, sample_jobs):
        """Closing a job should prevent new applications."""
        job_id = sample_jobs[2]
        client.delete(f"/api/jobs/{job_id}", headers=company_auth)

        r = client.post("/api/auth/register", json={
            "email": "late_applicant@test.com", "password": "password123",
            "role": "seeker", "name": "Late Applicant",
        })
        sk = {"Authorization": f"Bearer {r.json()['access_token']}"}
        r = client.post(f"/api/jobs/{job_id}/apply", headers=sk, json={"job_id": job_id})
        assert r.status_code == 400  # Job no longer active


class TestRecruiterSearchAndPipeline:
    """Recruiter: search candidates → pipeline → analytics."""

    def test_recruiter_journey(self, client, seeker_with_profile):
        r = client.post("/api/auth/register", json={
            "email": "rec_journey@test.com", "password": "password123",
            "role": "recruiter", "name": "Recruiter Jane",
        })
        rec_auth = {"Authorization": f"Bearer {r.json()['access_token']}"}

        # Search all candidates
        r = client.get("/api/recruiter/candidates", headers=rec_auth)
        assert r.status_code == 200
        assert len(r.json()) >= 1

        # Advanced search by skill
        r = client.post("/api/recruiter/candidates/search", headers=rec_auth, json={
            "skills": ["React"],
        })
        assert r.status_code == 200

        # Pipeline view
        r = client.get("/api/recruiter/pipeline", headers=rec_auth)
        assert r.status_code == 200

        # Analytics
        r = client.get("/api/recruiter/analytics", headers=rec_auth)
        assert r.status_code == 200


class TestCrossCommunication:
    """Chat between different role combinations."""

    def _register(self, client, email, role, company_name=None):
        body = {"email": email, "password": "password123", "role": role, "name": email.split("@")[0]}
        if company_name:
            body["company_name"] = company_name
        r = client.post("/api/auth/register", json=body)
        return r.json()["user"]["id"], {"Authorization": f"Bearer {r.json()['access_token']}"}

    def test_seeker_recruiter_conversation(self, client):
        s_id, s_auth = self._register(client, "chat_s@test.com", "seeker")
        r_id, r_auth = self._register(client, "chat_r@test.com", "recruiter")

        # Recruiter reaches out
        r = client.post("/api/chat/messages", headers=r_auth, json={
            "recipient_id": s_id, "content": "Hi, interested in your profile!",
        })
        assert r.status_code == 201

        # Seeker replies
        r = client.post("/api/chat/messages", headers=s_auth, json={
            "recipient_id": r_id, "content": "Thanks! Tell me more.",
        })
        assert r.status_code == 201

        # Both see the conversation
        r = client.get("/api/chat/conversations", headers=r_auth)
        assert len(r.json()) == 1
        r = client.get("/api/chat/conversations", headers=s_auth)
        assert len(r.json()) == 1

        conv_id = r.json()[0]["id"]
        r = client.get(f"/api/chat/conversations/{conv_id}/messages", headers=s_auth)
        assert len(r.json()) == 2

    def test_conversation_reuse(self, client):
        """Multiple messages to same person reuse one conversation."""
        s_id, s_auth = self._register(client, "reuse_s@test.com", "seeker")
        r_id, r_auth = self._register(client, "reuse_r@test.com", "recruiter")

        for msg in ["Hello!", "Follow-up", "Any update?"]:
            client.post("/api/chat/messages", headers=s_auth, json={
                "recipient_id": r_id, "content": msg,
            })

        r = client.get("/api/chat/conversations", headers=s_auth)
        assert len(r.json()) == 1  # single conversation, not 3

    def test_chat_to_nonexistent_user(self, client):
        _, auth = self._register(client, "ghost_sender@test.com", "seeker")
        r = client.post("/api/chat/messages", headers=auth, json={
            "recipient_id": "nonexistent-id", "content": "Hello?",
        })
        assert r.status_code in (400, 404)


class TestAuthProtection:
    """All protected endpoints require valid authentication."""

    PROTECTED_GET_ENDPOINTS = [
        "/api/seeker/profile",
        "/api/seeker/jobs/matches",
        "/api/seeker/analytics",
        "/api/recruiter/candidates",
        "/api/recruiter/pipeline",
        "/api/recruiter/analytics",
        "/api/company/dashboard",
        "/api/company/analytics",
        "/api/chat/conversations",
        "/api/jobs/me/applications",
    ]

    @pytest.mark.parametrize("endpoint", PROTECTED_GET_ENDPOINTS)
    def test_unauthenticated_requests_rejected(self, client, endpoint):
        r = client.get(endpoint)
        assert r.status_code == 401

    def test_invalid_token_rejected(self, client):
        headers = {"Authorization": "Bearer invalid.token.here"}
        r = client.get("/api/seeker/profile", headers=headers)
        assert r.status_code == 401

    def test_expired_or_tampered_token(self, client):
        client.post("/api/auth/register", json={
            "email": "tamper@test.com", "password": "password123",
            "role": "seeker", "name": "Tamper",
        })
        r = client.post("/api/auth/login", json={
            "email": "tamper@test.com", "password": "password123",
        })
        token = r.json()["access_token"]
        tampered = token[:-5] + "XXXXX"
        r = client.get("/api/seeker/profile", headers={"Authorization": f"Bearer {tampered}"})
        assert r.status_code == 401


class TestRoleBasedAccess:
    """Role-specific permissions enforcement."""

    def _auth(self, client, email, role, company_name=None):
        body = {"email": email, "password": "password123", "role": role, "name": "Test"}
        if company_name:
            body["company_name"] = company_name
        r = client.post("/api/auth/register", json=body)
        return {"Authorization": f"Bearer {r.json()['access_token']}"}

    def test_seeker_cannot_create_jobs(self, client):
        auth = self._auth(client, "rbac_s2@test.com", "seeker")
        r = client.post("/api/jobs", headers=auth, json={
            "title": "Hack Job", "location": "X", "description": "X",
        })
        assert r.status_code == 403

    def test_recruiter_cannot_create_jobs(self, client):
        auth = self._auth(client, "rbac_r3@test.com", "recruiter")
        r = client.post("/api/jobs", headers=auth, json={
            "title": "Hack Job", "location": "X", "description": "X",
        })
        assert r.status_code == 403

    def test_company_can_create_jobs(self, client):
        auth = self._auth(client, "rbac_c2@test.com", "company", "RBAC Corp")
        r = client.post("/api/jobs", headers=auth, json={
            "title": "Legit Job", "location": "Remote", "description": "Real job",
        })
        assert r.status_code == 201


class TestDataConsistency:
    """Verify data stays consistent across operations."""

    def test_profile_update_reflects_in_matches(self, client, sample_jobs):
        """Creating a profile with matching skills yields better match scores."""
        r = client.post("/api/auth/register", json={
            "email": "consistency_test@test.com", "password": "password123",
            "role": "seeker", "name": "Consistency",
        })
        auth = {"Authorization": f"Bearer {r.json()['access_token']}"}

        # Create profile with matching skills
        client.post("/api/seeker/profile", headers=auth, json={
            "name": "Consistency", "skills": ["React", "TypeScript", "JavaScript"],
            "desired_roles": ["Frontend Developer"],
            "work_preferences": ["Remote"],
        })
        r = client.get("/api/seeker/jobs/matches", headers=auth)
        assert r.status_code == 200
        matches = r.json()
        assert len(matches) >= 1
        # Should have non-trivial match scores
        assert matches[0]["match_score"] >= 30


class TestJobListingAndFiltering:
    """Test job listing endpoint with query params."""

    def test_list_all_active_jobs(self, client, company_auth, sample_jobs):
        r = client.get("/api/jobs")
        assert r.status_code == 200
        assert len(r.json()) >= len(sample_jobs)

    def test_search_by_keyword(self, client, company_auth, sample_jobs):
        r = client.get("/api/jobs", params={"search": "React"})
        assert r.status_code == 200
        for job in r.json():
            text = f"{job['title']} {' '.join(job['required_skills'])}".lower()
            assert "react" in text

    def test_filter_remote_only(self, client, company_auth, sample_jobs):
        r = client.get("/api/jobs", params={"remote_only": True})
        assert r.status_code == 200
        for job in r.json():
            assert job["remote"] is True

    def test_nonexistent_job_returns_404(self, client):
        r = client.get("/api/jobs/nonexistent-id-12345")
        assert r.status_code == 404

    def test_get_single_job_by_id(self, client, sample_jobs):
        r = client.get(f"/api/jobs/{sample_jobs[0]}")
        assert r.status_code == 200
        assert r.json()["id"] == sample_jobs[0]

    def test_public_job_listing_no_auth(self, client, company_auth, sample_jobs):
        """Job listing endpoint should be accessible without auth."""
        r = client.get("/api/jobs")
        assert r.status_code == 200

    def test_public_match_endpoint(self, client, sample_jobs):
        """POST /api/seeker/jobs/matches with custom skills (no auth)."""
        r = client.post("/api/seeker/jobs/matches", json={
            "skills": ["React", "TypeScript"],
            "desired_roles": ["Frontend Developer"],
            "work_preferences": ["Remote"],
        })
        assert r.status_code == 200
        matches = r.json()
        assert len(matches) >= 1
        for m in matches:
            assert 15 <= m["match_score"] <= 99


class TestEdgeCases:
    """Boundary conditions and error handling."""

    def test_register_duplicate_email(self, client):
        client.post("/api/auth/register", json={
            "email": "dupe@test.com", "password": "password123",
            "role": "seeker", "name": "First",
        })
        r = client.post("/api/auth/register", json={
            "email": "dupe@test.com", "password": "password123",
            "role": "seeker", "name": "Second",
        })
        assert r.status_code == 409

    def test_login_wrong_password(self, client):
        client.post("/api/auth/register", json={
            "email": "wrong_pw@test.com", "password": "password123",
            "role": "seeker", "name": "Test",
        })
        r = client.post("/api/auth/login", json={
            "email": "wrong_pw@test.com", "password": "wrongpassword",
        })
        assert r.status_code == 401

    def test_login_nonexistent_user(self, client):
        r = client.post("/api/auth/login", json={
            "email": "nobody@test.com", "password": "password123",
        })
        assert r.status_code == 401

    def test_matches_require_profile_with_skills(self, client):
        """Seeker without skills gets 400 on match endpoint."""
        r = client.post("/api/auth/register", json={
            "email": "no_skills@test.com", "password": "password123",
            "role": "seeker", "name": "NoSkills",
        })
        auth = {"Authorization": f"Bearer {r.json()['access_token']}"}
        r = client.get("/api/seeker/jobs/matches", headers=auth)
        assert r.status_code == 400

    def test_resume_upload_invalid_type(self, client):
        r = client.post("/api/auth/register", json={
            "email": "bad_upload@test.com", "password": "password123",
            "role": "seeker", "name": "Bad Upload",
        })
        auth = {"Authorization": f"Bearer {r.json()['access_token']}"}
        r = client.post(
            "/api/seeker/resume/upload", headers=auth,
            files={"file": ("photo.jpg", io.BytesIO(b"jpg data"), "image/jpeg")},
        )
        assert r.status_code == 400

    def test_resume_upload_docx_accepted(self, client):
        r = client.post("/api/auth/register", json={
            "email": "docx_upload@test.com", "password": "password123",
            "role": "seeker", "name": "DOCX User",
        })
        auth = {"Authorization": f"Bearer {r.json()['access_token']}"}
        r = client.post(
            "/api/seeker/resume/upload", headers=auth,
            files={"file": ("resume.docx", io.BytesIO(b"docx data"),
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        )
        assert r.status_code == 200

    def test_ai_summary_generation(self, client):
        r = client.post("/api/auth/register", json={
            "email": "ai_sum@test.com", "password": "password123",
            "role": "seeker", "name": "AI User",
        })
        auth = {"Authorization": f"Bearer {r.json()['access_token']}"}
        client.post("/api/seeker/profile", headers=auth, json={
            "name": "AI User", "skills": ["React", "TypeScript", "Node.js"],
            "desired_roles": ["Frontend Developer"],
            "experience_level": "Senior (6-9 yrs)",
        })
        r = client.post("/api/seeker/ai/summary", headers=auth, json={
            "name": "AI User", "skills": ["React", "TypeScript", "Node.js"],
            "desired_roles": ["Frontend Developer"],
        })
        assert r.status_code == 200
        assert "summary" in r.json()
        assert len(r.json()["summary"]) > 20

    def test_company_dashboard_job_counts(self, client, company_auth, sample_jobs):
        """Dashboard shows correct open positions count."""
        r = client.get("/api/company/dashboard", headers=company_auth)
        assert r.json()["open_positions"] == 3

        # Close a job → open positions decreases
        client.delete(f"/api/jobs/{sample_jobs[1]}", headers=company_auth)
        r = client.get("/api/company/dashboard", headers=company_auth)
        assert r.json()["open_positions"] == 2

    def test_recommended_candidates(self, client, company_auth, seeker_with_profile, sample_jobs):
        """Company can view recommended candidates."""
        r = client.get("/api/company/candidates/recommended", headers=company_auth)
        assert r.status_code == 200
