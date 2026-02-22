"""
Integration tests for multi-user concurrent operations, state transitions,
authorization boundaries, and data consistency.
"""

import pytest
from tests.conftest import register_user, auth_header, create_seeker_with_profile


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  MULTI-USER JOB APPLICATION SCENARIOS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestMultipleSeekersApplyToSameJob:
    """Verify that multiple seekers can apply to the same job without interference."""

    def test_two_seekers_apply_to_same_job(self, client):
        # Create company and job
        comp_token, _ = register_user(client, "co@co.com", role="company", company_name="TestCo")
        job_resp = client.post("/api/jobs", json={
            "title": "React Dev", "description": "Build UI", "location": "Remote",
            "salary_min": 120000, "salary_max": 160000, "type": "full-time",
            "remote": True, "required_skills": ["React"], "nice_skills": ["TypeScript"],
        }, headers=auth_header(comp_token))
        job_id = job_resp.json()["id"]

        # Seeker 1 applies
        s1_token, _ = register_user(client, "s1@test.com", role="seeker", name="Seeker 1")
        client.post("/api/seeker/profile", json={
            "name": "Seeker 1", "skills": ["React", "TypeScript", "JavaScript"],
        }, headers=auth_header(s1_token))
        r1 = client.post(f"/api/jobs/{job_id}/apply", json={"job_id": job_id, "cover_letter": "S1 here"},
                         headers=auth_header(s1_token))
        assert r1.status_code == 201

        # Seeker 2 applies
        s2_token, _ = register_user(client, "s2@test.com", role="seeker", name="Seeker 2")
        client.post("/api/seeker/profile", json={
            "name": "Seeker 2", "skills": ["React", "Node.js", "Python"],
        }, headers=auth_header(s2_token))
        r2 = client.post(f"/api/jobs/{job_id}/apply", json={"job_id": job_id, "cover_letter": "S2 here"},
                         headers=auth_header(s2_token))
        assert r2.status_code == 201

        # Both applications exist
        apps = client.get(f"/api/jobs/{job_id}/applications",
                          headers=auth_header(comp_token))
        assert len(apps.json()) == 2

    def test_same_seeker_cannot_apply_twice(self, client):
        comp_token, _ = register_user(client, "co@co.com", role="company", company_name="TestCo")
        job_resp = client.post("/api/jobs", json={
            "title": "Dev", "description": "Code", "location": "Remote",
            "salary_min": 100000, "salary_max": 150000, "type": "full-time",
            "remote": True, "required_skills": ["Python"], "nice_skills": [],
        }, headers=auth_header(comp_token))
        job_id = job_resp.json()["id"]

        s_token, _ = register_user(client, "s@t.com", role="seeker", name="Seeker")
        client.post("/api/seeker/profile", json={"name": "Seeker", "skills": ["Python"]},
                    headers=auth_header(s_token))

        r1 = client.post(f"/api/jobs/{job_id}/apply", json={"job_id": job_id, "cover_letter": "First"},
                         headers=auth_header(s_token))
        assert r1.status_code == 201

        r2 = client.post(f"/api/jobs/{job_id}/apply", json={"job_id": job_id, "cover_letter": "Again"},
                         headers=auth_header(s_token))
        assert r2.status_code == 409

    def test_applicant_count_increments_correctly(self, client):
        comp_token, _ = register_user(client, "co@co.com", role="company", company_name="Acme")
        job_resp = client.post("/api/jobs", json={
            "title": "Dev", "description": "X", "location": "Remote",
            "salary_min": 80000, "salary_max": 120000, "type": "full-time",
            "remote": True, "required_skills": ["Go"], "nice_skills": [],
        }, headers=auth_header(comp_token))
        job_id = job_resp.json()["id"]

        for i in range(5):
            token, _ = register_user(client, f"s{i}@t.com", role="seeker", name=f"S{i}")
            client.post("/api/seeker/profile", json={"name": f"S{i}", "skills": ["Go"]},
                        headers=auth_header(token))
            client.post(f"/api/jobs/{job_id}/apply", json={"job_id": job_id, "cover_letter": f"#{i}"},
                        headers=auth_header(token))

        apps = client.get(f"/api/jobs/{job_id}/applications", headers=auth_header(comp_token))
        assert len(apps.json()) == 5


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  APPLICATION STATUS TRANSITIONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestApplicationStatusTransitions:
    """Test the full hiring pipeline status progression."""

    def _setup_application(self, client):
        comp_token, _ = register_user(client, "co@co.com", role="company", company_name="Acme")
        job_resp = client.post("/api/jobs", json={
            "title": "Engineer", "description": "Build", "location": "Remote",
            "salary_min": 100000, "salary_max": 150000, "type": "full-time",
            "remote": True, "required_skills": ["Python"], "nice_skills": [],
        }, headers=auth_header(comp_token))
        job_id = job_resp.json()["id"]

        s_token, _ = register_user(client, "s@t.com", role="seeker", name="Seeker")
        client.post("/api/seeker/profile", json={"name": "Seeker", "skills": ["Python"]},
                    headers=auth_header(s_token))
        app_resp = client.post(f"/api/jobs/{job_id}/apply",
                               json={"job_id": job_id, "cover_letter": "Hi"},
                               headers=auth_header(s_token))
        app_id = app_resp.json()["id"]
        return comp_token, s_token, job_id, app_id

    def test_full_pipeline_progression(self, client):
        comp_token, _, job_id, app_id = self._setup_application(client)
        pipeline = ["screening", "interview", "offer", "hired"]
        for status in pipeline:
            r = client.patch(f"/api/jobs/applications/{app_id}/status",
                             json={"status": status}, headers=auth_header(comp_token))
            assert r.status_code == 200
            assert r.json()["status"] == status

    def test_reject_at_any_stage(self, client):
        comp_token, _, job_id, app_id = self._setup_application(client)
        # Move to interview, then reject
        client.patch(f"/api/jobs/applications/{app_id}/status",
                     json={"status": "screening"}, headers=auth_header(comp_token))
        client.patch(f"/api/jobs/applications/{app_id}/status",
                     json={"status": "interview"}, headers=auth_header(comp_token))
        r = client.patch(f"/api/jobs/applications/{app_id}/status",
                         json={"status": "rejected"}, headers=auth_header(comp_token))
        assert r.status_code == 200
        assert r.json()["status"] == "rejected"

    def test_initial_status_is_applied(self, client):
        comp_token, s_token, job_id, app_id = self._setup_application(client)
        apps = client.get("/api/jobs/me/applications", headers=auth_header(s_token))
        assert apps.json()[0]["status"] == "applied"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  AUTHORIZATION BOUNDARIES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestAuthorizationBoundaries:
    """Ensure roles can only access their own resources."""

    def test_seeker_cannot_create_job(self, client):
        token, _ = register_user(client, "s@t.com", role="seeker", name="S")
        r = client.post("/api/jobs", json={
            "title": "Dev", "description": "X", "location": "X",
            "salary_min": 80000, "salary_max": 120000, "type": "full-time",
            "remote": True, "required_skills": ["Python"], "nice_skills": [],
        }, headers=auth_header(token))
        assert r.status_code in (401, 403)

    def test_recruiter_cannot_create_job(self, client):
        token, _ = register_user(client, "r@t.com", role="recruiter", name="R")
        r = client.post("/api/jobs", json={
            "title": "Dev", "description": "X", "location": "X",
            "salary_min": 80000, "salary_max": 120000, "type": "full-time",
            "remote": True, "required_skills": ["Python"], "nice_skills": [],
        }, headers=auth_header(token))
        assert r.status_code in (401, 403)

    def test_company_cannot_access_seeker_profile(self, client):
        token, _ = register_user(client, "co@t.com", role="company", company_name="X")
        r = client.get("/api/seeker/profile", headers=auth_header(token))
        assert r.status_code in (400, 403, 404)

    def test_unauthenticated_cannot_apply(self, client):
        r = client.post("/api/jobs/fake_job_id/apply", json={"cover_letter": "Hi"})
        assert r.status_code in (401, 403)

    def test_expired_token_rejected(self, client):
        r = client.get("/api/seeker/profile",
                       headers={"Authorization": "Bearer totally.fake.token"})
        assert r.status_code in (401, 403)

    def test_company_can_see_own_job_applications(self, client):
        comp_token, _ = register_user(client, "co@co.com", role="company", company_name="X")
        job_resp = client.post("/api/jobs", json={
            "title": "Dev", "description": "X", "location": "X",
            "salary_min": 80000, "salary_max": 120000, "type": "full-time",
            "remote": True, "required_skills": ["Python"], "nice_skills": [],
        }, headers=auth_header(comp_token))
        job_id = job_resp.json()["id"]

        r = client.get(f"/api/jobs/{job_id}/applications",
                       headers=auth_header(comp_token))
        assert r.status_code == 200


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  PROFILE UPDATE & MATCH CONSISTENCY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestProfileMatchConsistency:
    """Match results should change when profiles change."""

    def test_matches_improve_with_more_skills(self, client):
        comp_token, _ = register_user(client, "co@co.com", role="company", company_name="X")
        client.post("/api/jobs", json={
            "title": "React Developer", "description": "Build UIs", "location": "Remote",
            "salary_min": 100000, "salary_max": 150000, "type": "full-time",
            "remote": True, "required_skills": ["React", "TypeScript", "JavaScript"],
            "nice_skills": ["Next.js", "Redux"],
        }, headers=auth_header(comp_token))

        s_token, _ = register_user(client, "s@t.com", role="seeker", name="Seeker")

        # Minimal profile
        client.post("/api/seeker/profile", json={
            "name": "Seeker", "skills": ["React"],
            "desired_roles": ["Frontend Developer"],
            "work_preferences": ["Remote"],
        }, headers=auth_header(s_token))
        r1 = client.get("/api/seeker/jobs/matches", headers=auth_header(s_token))
        scores_1 = [j["match_score"] for j in r1.json()]

        # Update with more skills
        client.post("/api/seeker/profile", json={
            "name": "Seeker",
            "skills": ["React", "TypeScript", "JavaScript", "Next.js", "Redux"],
            "desired_roles": ["Frontend Developer"],
            "work_preferences": ["Remote"],
            "experience_level": "Senior (6-9 yrs)",
        }, headers=auth_header(s_token))
        r2 = client.get("/api/seeker/jobs/matches", headers=auth_header(s_token))
        scores_2 = [j["match_score"] for j in r2.json()]

        # Top match should improve
        assert max(scores_2) >= max(scores_1)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  CHAT SYSTEM MULTI-USER
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestChatMultiUser:
    """Test chat system with multiple participants."""

    def test_conversation_created_on_first_message(self, client):
        s_token, _ = register_user(client, "s@t.com", role="seeker", name="Seeker")
        r_token, r_user = register_user(client, "r@t.com", role="recruiter", name="Recruiter")

        r = client.post("/api/chat/messages", json={
            "recipient_id": r_user["id"], "content": "Hello recruiter!",
        }, headers=auth_header(s_token))
        assert r.status_code == 201

        convos = client.get("/api/chat/conversations", headers=auth_header(s_token))
        assert len(convos.json()) >= 1

    def test_both_parties_see_same_conversation(self, client):
        s_token, s_user = register_user(client, "s@t.com", role="seeker", name="S")
        r_token, r_user = register_user(client, "r@t.com", role="recruiter", name="R")

        client.post("/api/chat/messages", json={
            "recipient_id": r_user["id"], "content": "Hi from seeker",
        }, headers=auth_header(s_token))

        client.post("/api/chat/messages", json={
            "recipient_id": s_user["id"], "content": "Hi from recruiter",
        }, headers=auth_header(r_token))

        s_convos = client.get("/api/chat/conversations", headers=auth_header(s_token)).json()
        r_convos = client.get("/api/chat/conversations", headers=auth_header(r_token)).json()

        assert len(s_convos) >= 1
        assert len(r_convos) >= 1

        conv_id = s_convos[0]["id"]
        s_msgs = client.get(f"/api/chat/conversations/{conv_id}/messages",
                            headers=auth_header(s_token)).json()
        assert len(s_msgs) == 2

    def test_separate_conversations_for_different_pairs(self, client):
        s_token, s_user = register_user(client, "s@t.com", role="seeker", name="S")
        r1_token, r1_user = register_user(client, "r1@t.com", role="recruiter", name="R1")
        r2_token, r2_user = register_user(client, "r2@t.com", role="recruiter", name="R2")

        client.post("/api/chat/messages", json={
            "recipient_id": r1_user["id"], "content": "Hi R1",
        }, headers=auth_header(s_token))

        client.post("/api/chat/messages", json={
            "recipient_id": r2_user["id"], "content": "Hi R2",
        }, headers=auth_header(s_token))

        convos = client.get("/api/chat/conversations", headers=auth_header(s_token)).json()
        assert len(convos) == 2


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  JOB SEARCH FILTERS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestJobSearchFilters:
    """Test various job search/filter combinations."""

    def _create_diverse_jobs(self, client, comp_token):
        jobs = [
            {"title": "React Developer", "type": "full-time", "remote": True,
             "required_skills": ["React", "TypeScript"], "nice_skills": ["Next.js"]},
            {"title": "Python Backend", "type": "full-time", "remote": False,
             "required_skills": ["Python", "FastAPI"], "nice_skills": ["Docker"]},
            {"title": "DevOps Intern", "type": "internship", "remote": True,
             "required_skills": ["Docker", "Linux"], "nice_skills": ["AWS"]},
            {"title": "Part-time Designer", "type": "part-time", "remote": False,
             "required_skills": ["Figma"], "nice_skills": ["UX Research"]},
        ]
        ids = []
        for j in jobs:
            r = client.post("/api/jobs", json={
                "description": "Test", "location": "NYC",
                "salary_min": 80000, "salary_max": 150000, **j,
            }, headers=auth_header(comp_token))
            ids.append(r.json()["id"])
        return ids

    def test_filter_by_remote(self, client):
        comp_token, _ = register_user(client, "co@co.com", role="company", company_name="X")
        self._create_diverse_jobs(client, comp_token)
        r = client.get("/api/jobs?remote_only=true")
        assert all(j["remote"] for j in r.json())
        assert len(r.json()) == 2

    def test_filter_by_type(self, client):
        comp_token, _ = register_user(client, "co@co.com", role="company", company_name="X")
        self._create_diverse_jobs(client, comp_token)
        r = client.get("/api/jobs?job_type=internship")
        assert all(j["type"] == "internship" for j in r.json())

    def test_search_by_title(self, client):
        comp_token, _ = register_user(client, "co@co.com", role="company", company_name="X")
        self._create_diverse_jobs(client, comp_token)
        r = client.get("/api/jobs?search=React")
        assert len(r.json()) >= 1
        assert any("React" in j["title"] for j in r.json())

    def test_search_by_skill(self, client):
        comp_token, _ = register_user(client, "co@co.com", role="company", company_name="X")
        self._create_diverse_jobs(client, comp_token)
        r = client.get("/api/jobs?search=Docker")
        assert len(r.json()) >= 1

    def test_empty_search_returns_all(self, client):
        comp_token, _ = register_user(client, "co@co.com", role="company", company_name="X")
        self._create_diverse_jobs(client, comp_token)
        r = client.get("/api/jobs")
        assert len(r.json()) == 4

    def test_no_results_for_unknown_search(self, client):
        comp_token, _ = register_user(client, "co@co.com", role="company", company_name="X")
        self._create_diverse_jobs(client, comp_token)
        r = client.get("/api/jobs?search=XYZNONEXISTENT")
        assert len(r.json()) == 0


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  RECRUITER CANDIDATE SEARCH
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestRecruiterCandidateSearch:
    def _create_seekers(self, client):
        seekers = [
            ("s1@t.com", "Alice", ["React", "TypeScript", "Node.js"]),
            ("s2@t.com", "Bob", ["Python", "Machine Learning", "PyTorch"]),
            ("s3@t.com", "Carol", ["React", "Python", "AWS"]),
        ]
        for email, name, skills in seekers:
            token, _ = register_user(client, email, role="seeker", name=name)
            client.post("/api/seeker/profile", json={
                "name": name, "skills": skills,
                "desired_roles": ["Software Engineer"],
            }, headers=auth_header(token))

    def test_search_by_skill_filter(self, client):
        self._create_seekers(client)
        rec_token, _ = register_user(client, "r@t.com", role="recruiter", name="Rec")
        r = client.get("/api/recruiter/candidates?skill=React",
                       headers=auth_header(rec_token))
        assert r.status_code == 200
        # Alice and Carol have React
        assert len(r.json()) >= 2

    def test_advanced_search_with_skills_list(self, client):
        self._create_seekers(client)
        rec_token, _ = register_user(client, "r@t.com", role="recruiter", name="Rec")
        r = client.post("/api/recruiter/candidates/search", json={
            "skills": ["Python", "Machine Learning"],
        }, headers=auth_header(rec_token))
        assert r.status_code == 200
        assert len(r.json()) >= 1
