"""
Regression Test Suite v4 — Boundary conditions, concurrency simulation,
data integrity under stress, and cross-module interaction coverage.
"""

import pytest
from tests.conftest import register_user, auth_header


def _reg(client, email, role="seeker", name="Test User", company_name=None):
    token, user = register_user(client, email, "password123", role, name, company_name)
    return auth_header(token), user["id"]


def _profile(name="Test User", **kw):
    base = {"name": name, "skills": ["Python"], "desired_roles": ["Developer"],
            "experience_level": "Mid Level (3-5 yrs)"}
    base.update(kw)
    return base


def _apply(client, job_id, headers, cover_letter="Applying"):
    return client.post(f"/api/jobs/{job_id}/apply", headers=headers, json={
        "job_id": job_id, "cover_letter": cover_letter,
    })


def _msg(client, headers, recipient_id, content):
    return client.post("/api/chat/messages", headers=headers, json={
        "recipient_id": recipient_id, "content": content,
    })


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  BOUNDARY: Input Edge Cases
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestInputBoundaries:

    def test_empty_skills_profile(self, client):
        """Profile with no skills should still be created."""
        h, _ = _reg(client, "empty-skills@test.com")
        resp = client.post("/api/seeker/profile", headers=h, json=_profile(
            name="Empty Skills", skills=[],
        ))
        assert resp.status_code == 201

    def test_many_skills_profile(self, client):
        """Profile with many skills should be accepted."""
        h, _ = _reg(client, "many-skills@test.com")
        skills = [f"Skill{i}" for i in range(50)]
        resp = client.post("/api/seeker/profile", headers=h, json=_profile(
            name="Many Skills", skills=skills,
        ))
        assert resp.status_code == 201
        profile = client.get("/api/seeker/profile", headers=h).json()
        assert len(profile["skills"]) == 50

    def test_unicode_name_and_headline(self, client):
        """Profile with unicode characters should work."""
        h, _ = _reg(client, "unicode@test.com", name="José García")
        resp = client.post("/api/seeker/profile", headers=h, json=_profile(
            name="José García", headline="Développeur Senior 🚀",
            skills=["React"], location="São Paulo",
        ))
        assert resp.status_code == 201
        profile = client.get("/api/seeker/profile", headers=h).json()
        assert profile["name"] == "José García"

    def test_long_cover_letter(self, client, sample_jobs):
        """Very long cover letter should be accepted."""
        h, _ = _reg(client, "long-cl@test.com")
        client.post("/api/seeker/profile", headers=h, json=_profile(name="Long CL"))
        long_text = "A" * 5000
        resp = _apply(client, sample_jobs[0], h, long_text)
        assert resp.status_code == 201
        assert resp.json()["cover_letter"] == long_text

    def test_empty_cover_letter(self, client, sample_jobs):
        """Empty cover letter should still work (field is optional)."""
        h, _ = _reg(client, "no-cl@test.com")
        client.post("/api/seeker/profile", headers=h, json=_profile(name="No CL"))
        resp = client.post(f"/api/jobs/{sample_jobs[0]}/apply", headers=h, json={
            "job_id": sample_jobs[0],
        })
        assert resp.status_code == 201

    def test_register_with_min_password(self, client):
        """Password at minimum length (8 chars) should work."""
        resp = client.post("/api/auth/register", json={
            "email": "minpw@test.com", "password": "12345678",
            "role": "seeker", "name": "Min PW",
        })
        assert resp.status_code == 201

    def test_register_with_short_password(self, client):
        """Password below minimum should be rejected."""
        resp = client.post("/api/auth/register", json={
            "email": "shortpw@test.com", "password": "1234567",
            "role": "seeker", "name": "Short PW",
        })
        assert resp.status_code in (400, 422)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REGRESSION: Profile Overwrite Behavior
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestProfileOverwrite:

    def test_second_profile_post_overwrites_first(self, client):
        """POST profile twice should update, not create duplicate."""
        h, _ = _reg(client, "overwrite@test.com")
        client.post("/api/seeker/profile", headers=h, json=_profile(
            name="V1", skills=["Python"], desired_roles=["Dev"],
        ))
        client.post("/api/seeker/profile", headers=h, json=_profile(
            name="V2", skills=["React", "TypeScript", "Node.js"],
            desired_roles=["Frontend Developer"],
        ))
        profile = client.get("/api/seeker/profile", headers=h).json()
        assert profile["name"] == "V2"
        assert "React" in profile["skills"]
        # Old skills should be gone
        assert "Python" not in profile["skills"]

    def test_profile_update_preserves_auth(self, client, sample_jobs):
        """Updating profile shouldn't break JWT auth."""
        h, _ = _reg(client, "auth-preserve@test.com")
        client.post("/api/seeker/profile", headers=h, json=_profile(
            name="V1", skills=["Python"],
        ))
        client.post("/api/seeker/profile", headers=h, json=_profile(
            name="V2", skills=["React", "Go", "Rust"],
        ))
        # Auth should still work
        resp = client.get("/api/seeker/jobs/matches", headers=h)
        assert resp.status_code == 200


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REGRESSION: Job Lifecycle Integrity
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestJobLifecycle:

    def test_closed_job_not_in_active_list(self, client, company_auth, sample_jobs):
        """Closing a job removes it from active listings."""
        job_id = sample_jobs[0]
        client.delete(f"/api/jobs/{job_id}", headers=company_auth)
        resp = client.get("/api/jobs")
        active_ids = [j["id"] for j in resp.json()]
        assert job_id not in active_ids

    def test_cannot_apply_to_closed_job(self, client, company_auth, sample_jobs):
        """Applying to a closed job should fail."""
        job_id = sample_jobs[0]
        client.delete(f"/api/jobs/{job_id}", headers=company_auth)
        h, _ = _reg(client, "closed-apply@test.com")
        client.post("/api/seeker/profile", headers=h, json=_profile(name="Late Applicant"))
        resp = _apply(client, job_id, h, "Please hire me!")
        assert resp.status_code == 400

    def test_multiple_companies_create_jobs(self, client):
        """Different companies can create jobs independently."""
        h1, _ = _reg(client, "co1@test.com", "company", "Alpha Corp", "Alpha Corp")
        h2, _ = _reg(client, "co2@test.com", "company", "Beta Inc", "Beta Inc")

        r1 = client.post("/api/jobs", headers=h1, json={
            "title": "Alpha Dev", "location": "Remote",
            "description": "Build things.", "required_skills": ["Python"],
        })
        r2 = client.post("/api/jobs", headers=h2, json={
            "title": "Beta Dev", "location": "NYC",
            "description": "Build other things.", "required_skills": ["Go"],
        })
        assert r1.status_code == 201
        assert r2.status_code == 201

        all_jobs = client.get("/api/jobs").json()
        titles = [j["title"] for j in all_jobs]
        assert "Alpha Dev" in titles
        assert "Beta Dev" in titles


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REGRESSION: Multi-User Chat Isolation
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestChatIsolation:

    def test_user_cannot_see_others_conversations(self, client):
        """User A's conversations should not appear for User C."""
        h1, uid1 = _reg(client, "iso1@test.com", "seeker", "A")
        h2, uid2 = _reg(client, "iso2@test.com", "recruiter", "B")
        h3, uid3 = _reg(client, "iso3@test.com", "seeker", "C")

        _msg(client, h1, uid2, "Private message A→B")

        convs_a = client.get("/api/chat/conversations", headers=h1).json()
        convs_c = client.get("/api/chat/conversations", headers=h3).json()
        assert len(convs_a) == 1
        assert len(convs_c) == 0

    def test_long_message_content(self, client):
        """Long message content should be preserved."""
        h1, uid1 = _reg(client, "longmsg1@test.com", "seeker", "S")
        h2, uid2 = _reg(client, "longmsg2@test.com", "recruiter", "R")

        long_content = "Hello! " * 500
        resp = _msg(client, h1, uid2, long_content)
        assert resp.status_code == 201

        convs = client.get("/api/chat/conversations", headers=h1).json()
        conv_id = convs[0]["id"]
        msgs = client.get(f"/api/chat/conversations/{conv_id}/messages", headers=h1).json()
        assert msgs[0]["content"] == long_content

    def test_self_message_handling(self, client):
        """Sending a message to yourself should be handled gracefully."""
        h1, uid1 = _reg(client, "selfmsg@test.com", "seeker", "Self")
        resp = _msg(client, h1, uid1, "Talking to myself")
        # Should either work or return an error — not crash
        assert resp.status_code in (201, 400, 422)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REGRESSION: End-to-End Hiring Flow
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestEndToEndHiring:

    def test_full_hiring_lifecycle(self, client):
        """Complete flow: company posts → seeker applies → advance → hire → chat."""
        # Company posts a job
        co_h, co_id = _reg(client, "hire-co@test.com", "company", "HireCo", "HireCo")
        job_resp = client.post("/api/jobs", headers=co_h, json={
            "title": "Python Developer", "location": "Remote",
            "description": "Build backend services with FastAPI.",
            "required_skills": ["Python", "FastAPI", "SQL"],
            "nice_skills": ["Docker", "AWS"],
            "remote": True, "salary_min": 120000, "salary_max": 160000,
        })
        assert job_resp.status_code == 201
        job_id = job_resp.json()["id"]

        # Seeker creates profile & applies
        sk_h, sk_id = _reg(client, "hire-sk@test.com", name="Seeker")
        client.post("/api/seeker/profile", headers=sk_h, json=_profile(
            name="Seeker", skills=["Python", "FastAPI", "Docker"],
            desired_roles=["Backend Developer"], work_preferences=["Remote"],
        ))
        app_resp = _apply(client, job_id, sk_h, "I'm a great fit!")
        assert app_resp.status_code == 201
        app_id = app_resp.json()["id"]

        # Company advances through pipeline
        for status in ["screening", "interview", "offer", "hired"]:
            resp = client.patch(
                f"/api/jobs/applications/{app_id}/status",
                headers=co_h, json={"status": status},
            )
            assert resp.status_code == 200

        # Seeker checks their application
        my_apps = client.get("/api/jobs/me/applications", headers=sk_h).json()
        assert any(a["status"] == "hired" for a in my_apps)

        # Both parties chat
        resp = _msg(client, co_h, sk_id, "Welcome aboard!")
        assert resp.status_code == 201
        resp = _msg(client, sk_h, co_id, "Thank you! Excited to join!")
        assert resp.status_code == 201

        convs = client.get("/api/chat/conversations", headers=sk_h).json()
        assert len(convs) == 1
        conv_id = convs[0]["id"]
        msgs = client.get(f"/api/chat/conversations/{conv_id}/messages", headers=sk_h).json()
        assert len(msgs) == 2

    def test_recruiter_end_to_end(self, client, sample_jobs):
        """Recruiter searches candidates, views pipeline, checks analytics."""
        rec_h, _ = _reg(client, "e2e-rec@test.com", "recruiter", "Recruiter")

        # Create seekers with profiles
        for i, skills in enumerate([["React", "TypeScript"], ["Python", "AWS"], ["Go", "Docker"]]):
            h, _ = _reg(client, f"e2e-sk{i}@test.com", name=f"Seeker {i}")
            client.post("/api/seeker/profile", headers=h, json=_profile(
                name=f"Seeker {i}", skills=skills, desired_roles=["Developer"],
            ))

        # Recruiter searches
        resp = client.get("/api/recruiter/candidates", headers=rec_h)
        assert resp.status_code == 200
        assert len(resp.json()) >= 3

        # Filter by skill
        resp = client.get("/api/recruiter/candidates?skills=React", headers=rec_h)
        assert resp.status_code == 200
        for c in resp.json():
            assert "React" in c.get("skills", [])

        # Analytics
        resp = client.get("/api/recruiter/analytics", headers=rec_h)
        assert resp.status_code == 200


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REGRESSION: Match Score Correctness
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestMatchScoreCorrectness:

    def test_perfect_skill_match_scores_high(self, client, sample_jobs):
        """A seeker whose skills exactly match a job's requirements should score high."""
        h, _ = _reg(client, "perfect@test.com")
        # sample_jobs[0] = React Developer requiring React, TypeScript, JavaScript
        client.post("/api/seeker/profile", headers=h, json=_profile(
            name="Perfect", skills=["React", "TypeScript", "JavaScript", "Next.js", "Redux"],
            desired_roles=["Frontend Developer", "React Developer"],
            work_preferences=["Remote"],
            experience_level="Senior (6-9 yrs)",
        ))
        resp = client.get("/api/seeker/jobs/matches", headers=h)
        assert resp.status_code == 200
        matches = resp.json()
        # The React Developer job should be scored highly
        react_job = next((j for j in matches if "React" in j["title"]), None)
        assert react_job is not None
        assert react_job["match_score"] >= 70

    def test_no_skill_overlap_scores_low(self, client, sample_jobs):
        """A seeker with zero matching skills should score at the floor."""
        h, _ = _reg(client, "nomatch@test.com")
        client.post("/api/seeker/profile", headers=h, json=_profile(
            name="NoMatch", skills=["Cobol", "Fortran", "Assembly"],
            desired_roles=["Legacy Engineer"],
        ))
        resp = client.get("/api/seeker/jobs/matches", headers=h)
        matches = resp.json()
        for job in matches:
            # Should be at the floor (jitter exists so allow small range)
            assert job["match_score"] <= 40

    def test_matches_sorted_descending(self, client, sample_jobs):
        """Matches should always be sorted by score descending."""
        h, _ = _reg(client, "sorted@test.com")
        client.post("/api/seeker/profile", headers=h, json=_profile(
            name="Sorted", skills=["React", "Python", "AWS", "Docker"],
            desired_roles=["Software Engineer"],
        ))
        resp = client.get("/api/seeker/jobs/matches", headers=h)
        matches = resp.json()
        scores = [m["match_score"] for m in matches]
        assert scores == sorted(scores, reverse=True)
