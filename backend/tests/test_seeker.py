"""
Integration tests for /api/seeker endpoints.
"""

import pytest
from tests.conftest import register_user, auth_header, create_seeker_with_profile


class TestSeekerProfile:

    @pytest.mark.integration
    def test_create_profile(self, seeded_client):
        token, _ = register_user(seeded_client, email="s1@test.com", role="seeker", name="Seeker1")
        resp = seeded_client.post("/api/seeker/profile", json={
            "name": "Seeker1", "skills": ["React", "TypeScript", "JavaScript", "Node.js"],
            "desired_roles": ["Frontend Developer"], "experience_level": "Senior (6-9 yrs)",
            "work_preferences": ["Remote"], "education": [{"school": "MIT", "degree": "BS CS"}],
            "experience": [{"title": "Dev", "company": "Co", "duration": "2y"}],
            "summary": "Great dev.",
        }, headers=auth_header(token))
        assert resp.status_code == 201
        data = resp.json()
        assert data["profile_strength"] == "Strong"
        assert data["skills"] == ["React", "TypeScript", "JavaScript", "Node.js"]

    @pytest.mark.integration
    def test_get_profile(self, seeded_client):
        token, _ = create_seeker_with_profile(seeded_client)
        resp = seeded_client.get("/api/seeker/profile", headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["name"] == "Test Seeker"

    @pytest.mark.integration
    def test_get_profile_before_creation_404(self, client):
        token, _ = register_user(client, email="new@test.com")
        resp = client.get("/api/seeker/profile", headers=auth_header(token))
        assert resp.status_code == 404

    @pytest.mark.integration
    def test_profile_strength_needs_work(self, client):
        token, _ = register_user(client, email="weak@test.com")
        resp = client.post("/api/seeker/profile", json={
            "name": "Weakling", "skills": ["Python"],
        }, headers=auth_header(token))
        assert resp.status_code == 201
        assert resp.json()["profile_strength"] == "Needs Work"

    @pytest.mark.integration
    def test_profile_strength_good(self, client):
        token, _ = register_user(client, email="good@test.com")
        resp = client.post("/api/seeker/profile", json={
            "name": "Good", "skills": ["Python", "React"],
            "education": [{"school": "U", "degree": "BS"}],
        }, headers=auth_header(token))
        assert resp.status_code == 201
        assert resp.json()["profile_strength"] == "Good"


class TestResumeUpload:

    @pytest.mark.integration
    def test_upload_pdf(self, client):
        token, _ = register_user(client, email="upload@test.com")
        resp = client.post("/api/seeker/resume/upload",
            files={"file": ("resume.pdf", b"fake pdf content", "application/pdf")},
            headers=auth_header(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["message"] == "Resume parsed successfully"
        assert "parsed_profile" in data
        assert "ai_summary" in data
        assert isinstance(data["skills_extracted"], int)
        assert isinstance(data["experience_extracted"], int)

    @pytest.mark.integration
    def test_upload_unsupported_type(self, client):
        token, _ = register_user(client, email="bad@test.com")
        resp = client.post("/api/seeker/resume/upload",
            files={"file": ("file.txt", b"text", "text/plain")},
            headers=auth_header(token),
        )
        assert resp.status_code == 400

    @pytest.mark.integration
    def test_upload_no_file(self, client):
        token, _ = register_user(client, email="nofile@test.com")
        resp = client.post("/api/seeker/resume/upload", headers=auth_header(token))
        assert resp.status_code == 422  # missing required field


class TestAISummary:

    @pytest.mark.integration
    def test_generate_summary(self, client):
        token, _ = register_user(client, email="ai@test.com")
        resp = client.post("/api/seeker/ai/summary", json={
            "name": "Jane Doe",
            "skills": ["React", "TypeScript", "Node.js"],
            "desired_roles": ["Frontend Developer"],
            "experience_level": "Senior (6-9 yrs)",
            "experience": [{"title": "Dev", "company": "X", "duration": "3y"}],
        }, headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "React" in data["summary"]
        assert data["suggested_headline"]
        assert isinstance(data["suggested_skills"], list)


class TestJobMatching:

    @pytest.mark.integration
    def test_authenticated_matching(self, seeded_client):
        token, _ = create_seeker_with_profile(seeded_client)
        resp = seeded_client.get("/api/seeker/jobs/matches", headers=auth_header(token))
        assert resp.status_code == 200
        matches = resp.json()
        assert len(matches) >= 1
        # Should be sorted by score descending
        scores = [m["match_score"] for m in matches]
        assert scores == sorted(scores, reverse=True)

    @pytest.mark.integration
    def test_matching_requires_profile(self, seeded_client):
        token, _ = register_user(seeded_client, email="noprof@test.com")
        resp = seeded_client.get("/api/seeker/jobs/matches", headers=auth_header(token))
        assert resp.status_code == 400

    @pytest.mark.integration
    def test_public_matching_no_auth(self, seeded_client):
        resp = seeded_client.post("/api/seeker/jobs/matches", json={
            "skills": ["React", "TypeScript"],
            "desired_roles": ["Frontend Developer"],
            "work_preferences": ["Remote"],
        })
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    @pytest.mark.integration
    def test_min_score_filter(self, seeded_client):
        token, _ = create_seeker_with_profile(seeded_client)
        resp = seeded_client.get("/api/seeker/jobs/matches?min_score=90", headers=auth_header(token))
        assert resp.status_code == 200
        for m in resp.json():
            assert m["match_score"] >= 90


class TestSeekerAnalytics:

    @pytest.mark.integration
    def test_analytics_returns_structure(self, seeded_client):
        token, _ = create_seeker_with_profile(seeded_client)
        resp = seeded_client.get("/api/seeker/analytics", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "total_applications" in data
        assert "avg_match_score" in data
        assert "strong_matches" in data
        assert "skills_in_demand" in data
        assert "match_distribution" in data
        assert isinstance(data["avg_match_score"], (int, float))
