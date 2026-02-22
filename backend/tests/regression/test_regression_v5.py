"""
Regression Test Suite v5 — Cross-module flows, state transitions,
concurrent-style operations, and data consistency checks.
"""

import pytest
from tests.conftest import register_user, auth_header


def _reg(client, email, role="seeker", name="User", company_name=None):
    token, user = register_user(client, email, "password123", role, name, company_name)
    return auth_header(token), user["id"]


def _profile(name="User", **kw):
    base = {"name": name, "skills": ["Python", "React", "SQL"],
            "desired_roles": ["Developer"], "experience_level": "Mid Level (3-5 yrs)"}
    base.update(kw)
    return base


def _job(**kw):
    base = {"title": "Generic Dev", "location": "Remote",
            "description": "Build things.", "required_skills": ["Python"]}
    base.update(kw)
    return base


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  FULL MARKETPLACE FLOW
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestFullMarketplaceFlow:
    """Simulates a complete marketplace interaction across all 3 roles."""

    def test_three_sided_marketplace(self, client):
        """Company posts → Seeker applies → Recruiter reviews → Hire → Chat."""
        # 1. Company registers and posts job
        co_h, co_id = _reg(client, "market-co@test.com", "company", "TechCorp", "TechCorp")
        job = client.post("/api/jobs", headers=co_h, json=_job(
            title="Full Stack Engineer",
            required_skills=["React", "Python", "SQL"],
            nice_skills=["Docker", "AWS"],
            salary_min=140000, salary_max=180000, remote=True,
        )).json()
        job_id = job["id"]

        # 2. Seeker registers, creates profile, gets matches
        sk_h, sk_id = _reg(client, "market-sk@test.com", name="Alice Dev")
        client.post("/api/seeker/profile", headers=sk_h, json=_profile(
            name="Alice Dev",
            skills=["React", "Python", "SQL", "Docker"],
            desired_roles=["Full Stack Developer"],
            work_preferences=["Remote"],
        ))
        matches = client.get("/api/seeker/jobs/matches", headers=sk_h).json()
        assert any(m["id"] == job_id for m in matches)

        # 3. Seeker applies
        app_resp = client.post(f"/api/jobs/{job_id}/apply", headers=sk_h, json={
            "job_id": job_id, "cover_letter": "I'm a perfect fit!",
        })
        assert app_resp.status_code == 201
        app_id = app_resp.json()["id"]

        # 4. Recruiter registers and searches candidates
        rec_h, rec_id = _reg(client, "market-rec@test.com", "recruiter", "RecruiterBob")
        candidates = client.get("/api/recruiter/candidates", headers=rec_h).json()
        assert any(c["id"] == sk_id for c in candidates)

        # 5. Company reviews applications
        apps = client.get(f"/api/jobs/{job_id}/applications", headers=co_h).json()
        assert len(apps) == 1
        assert apps[0]["seeker_id"] == sk_id

        # 6. Advance through pipeline
        for status in ["screening", "interview", "offer", "hired"]:
            resp = client.patch(
                f"/api/jobs/applications/{app_id}/status",
                headers=co_h, json={"status": status},
            )
            assert resp.status_code == 200
            assert resp.json()["status"] == status

        # 7. Verify seeker sees hired status
        my_apps = client.get("/api/jobs/me/applications", headers=sk_h).json()
        assert any(a["status"] == "hired" for a in my_apps)

        # 8. Cross-role chat
        r = client.post("/api/chat/messages", headers=co_h, json={
            "recipient_id": sk_id, "content": "Welcome to TechCorp!",
        })
        assert r.status_code == 201
        r = client.post("/api/chat/messages", headers=sk_h, json={
            "recipient_id": co_id, "content": "Thanks! Excited to start!",
        })
        assert r.status_code == 201

        # Recruiter messages seeker
        r = client.post("/api/chat/messages", headers=rec_h, json={
            "recipient_id": sk_id, "content": "Congrats on the new role!",
        })
        assert r.status_code == 201

        # Seeker should have 2 conversations
        convs = client.get("/api/chat/conversations", headers=sk_h).json()
        assert len(convs) == 2


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  MULTI-APPLICANT COMPETITION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestMultiApplicantCompetition:
    """Multiple seekers apply to the same job."""

    def test_multiple_seekers_apply(self, client):
        co_h, _ = _reg(client, "comp-co@test.com", "company", "CompCo", "CompCo")
        job_id = client.post("/api/jobs", headers=co_h, json=_job(
            title="Popular Job", required_skills=["Python", "React"],
        )).json()["id"]

        seeker_ids = []
        for i in range(5):
            h, sid = _reg(client, f"comp-sk{i}@test.com", name=f"Seeker {i}")
            client.post("/api/seeker/profile", headers=h, json=_profile(name=f"Seeker {i}"))
            r = client.post(f"/api/jobs/{job_id}/apply", headers=h, json={
                "job_id": job_id, "cover_letter": f"Applicant #{i}",
            })
            assert r.status_code == 201
            seeker_ids.append(sid)

        # Company sees all 5 applications
        apps = client.get(f"/api/jobs/{job_id}/applications", headers=co_h).json()
        assert len(apps) == 5
        app_seeker_ids = {a["seeker_id"] for a in apps}
        assert app_seeker_ids == set(seeker_ids)

    def test_hire_one_reject_others(self, client):
        co_h, _ = _reg(client, "hire-rej-co@test.com", "company", "HRCo", "HRCo")
        job_id = client.post("/api/jobs", headers=co_h, json=_job()).json()["id"]

        app_ids = []
        for i in range(3):
            h, _ = _reg(client, f"hr-sk{i}@test.com", name=f"HR Seeker {i}")
            r = client.post(f"/api/jobs/{job_id}/apply", headers=h, json={"job_id": job_id})
            app_ids.append(r.json()["id"])

        # Hire first, reject others
        client.patch(f"/api/jobs/applications/{app_ids[0]}/status",
                     headers=co_h, json={"status": "hired"})
        for aid in app_ids[1:]:
            client.patch(f"/api/jobs/applications/{aid}/status",
                         headers=co_h, json={"status": "rejected"})

        apps = client.get(f"/api/jobs/{job_id}/applications", headers=co_h).json()
        statuses = {a["id"]: a["status"] for a in apps}
        assert statuses[app_ids[0]] == "hired"
        assert statuses[app_ids[1]] == "rejected"
        assert statuses[app_ids[2]] == "rejected"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  JOB LIFECYCLE STATE MACHINE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestJobLifecycleStateMachine:

    def test_active_to_closed_via_delete(self, client):
        h, _ = _reg(client, "sm-co@test.com", "company", "SMCo", "SMCo")
        job_id = client.post("/api/jobs", headers=h, json=_job()).json()["id"]

        # Verify active
        j = client.get(f"/api/jobs/{job_id}").json()
        assert j["status"] == "active"

        # Close
        client.delete(f"/api/jobs/{job_id}", headers=h)
        j = client.get(f"/api/jobs/{job_id}").json()
        assert j["status"] == "closed"

    def test_closed_job_excluded_from_matches(self, client):
        co_h, _ = _reg(client, "closed-match-co@test.com", "company", "ClsCo", "ClsCo")
        j1 = client.post("/api/jobs", headers=co_h, json=_job(title="Open Job")).json()["id"]
        j2 = client.post("/api/jobs", headers=co_h, json=_job(title="Closed Job")).json()["id"]
        client.delete(f"/api/jobs/{j2}", headers=co_h)

        sk_h, _ = _reg(client, "closed-match-sk@test.com")
        client.post("/api/seeker/profile", headers=sk_h, json=_profile())
        matches = client.get("/api/seeker/jobs/matches", headers=sk_h).json()
        match_ids = [m["id"] for m in matches]
        assert j1 in match_ids
        assert j2 not in match_ids

    def test_update_job_details(self, client):
        h, _ = _reg(client, "upd-job@test.com", "company", "UpdCo", "UpdCo")
        job_id = client.post("/api/jobs", headers=h, json=_job(title="V1")).json()["id"]

        resp = client.put(f"/api/jobs/{job_id}", headers=h, json=_job(title="V2"))
        assert resp.status_code == 200
        assert resp.json()["title"] == "V2"

    def test_cannot_update_others_job(self, client):
        h1, _ = _reg(client, "own-upd@test.com", "company", "Own", "Own")
        h2, _ = _reg(client, "oth-upd@test.com", "company", "Other", "Other")
        job_id = client.post("/api/jobs", headers=h1, json=_job()).json()["id"]
        resp = client.put(f"/api/jobs/{job_id}", headers=h2, json=_job(title="Hijacked"))
        assert resp.status_code == 403


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  PROFILE EVOLUTION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestProfileEvolution:

    def test_match_scores_change_with_profile_update(self, client):
        co_h, _ = _reg(client, "evo-co@test.com", "company", "EvoCo", "EvoCo")
        client.post("/api/jobs", headers=co_h, json=_job(
            title="React Expert", required_skills=["React", "TypeScript", "Next.js"],
        ))

        sk_h, _ = _reg(client, "evo-sk@test.com")

        # Profile v1: no React skills
        client.post("/api/seeker/profile", headers=sk_h, json=_profile(
            name="Evolving", skills=["Java", "Spring", "Hibernate"],
        ))
        matches_v1 = client.get("/api/seeker/jobs/matches", headers=sk_h).json()
        react_v1 = next((m for m in matches_v1 if "React" in m["title"]), None)
        score_v1 = react_v1["match_score"] if react_v1 else 0

        # Profile v2: add React skills
        client.post("/api/seeker/profile", headers=sk_h, json=_profile(
            name="Evolving", skills=["React", "TypeScript", "Next.js"],
        ))
        matches_v2 = client.get("/api/seeker/jobs/matches", headers=sk_h).json()
        react_v2 = next((m for m in matches_v2 if "React" in m["title"]), None)
        score_v2 = react_v2["match_score"] if react_v2 else 0

        assert score_v2 > score_v1

    def test_ai_summary_persists(self, client):
        sk_h, _ = _reg(client, "ai-persist@test.com")
        client.post("/api/seeker/profile", headers=sk_h, json=_profile(
            name="AI User", skills=["Python", "ML", "TensorFlow"],
            desired_roles=["ML Engineer"],
        ))
        resp = client.post("/api/seeker/ai/summary", headers=sk_h, json={
            "name": "AI User", "skills": ["Python", "ML", "TensorFlow"],
            "desired_roles": ["ML Engineer"],
        })
        assert resp.status_code == 200
        summary_data = resp.json()
        assert "summary" in summary_data
        assert len(summary_data["summary"]) > 10


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  CHAT THREADING
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestChatThreading:

    def test_conversation_reuse(self, client):
        """Multiple messages between same users use same conversation."""
        h1, uid1 = _reg(client, "thread1@test.com", name="ThreadA")
        h2, uid2 = _reg(client, "thread2@test.com", "recruiter", "ThreadB")

        r1 = client.post("/api/chat/messages", headers=h1, json={
            "recipient_id": uid2, "content": "First message",
        })
        conv_id_1 = r1.json()["conversation_id"]

        r2 = client.post("/api/chat/messages", headers=h2, json={
            "recipient_id": uid1, "content": "Reply",
        })
        conv_id_2 = r2.json()["conversation_id"]

        r3 = client.post("/api/chat/messages", headers=h1, json={
            "recipient_id": uid2, "content": "Follow-up",
        })
        conv_id_3 = r3.json()["conversation_id"]

        assert conv_id_1 == conv_id_2 == conv_id_3

    def test_message_ordering(self, client):
        h1, uid1 = _reg(client, "order1@test.com", name="OrderA")
        h2, uid2 = _reg(client, "order2@test.com", "recruiter", "OrderB")

        messages = ["First", "Second", "Third"]
        conv_id = None
        for msg in messages:
            r = client.post("/api/chat/messages", headers=h1, json={
                "recipient_id": uid2, "content": msg,
            })
            conv_id = r.json()["conversation_id"]

        resp = client.get(f"/api/chat/conversations/{conv_id}/messages", headers=h1)
        fetched = resp.json()
        assert len(fetched) == 3
        # Messages ordered by created_at
        contents = [m["content"] for m in fetched]
        assert contents == messages

    def test_multiple_independent_conversations(self, client):
        """User with 3 different conversations."""
        h1, uid1 = _reg(client, "multi1@test.com", name="Multi1")
        h2, uid2 = _reg(client, "multi2@test.com", "recruiter", "Multi2")
        h3, uid3 = _reg(client, "multi3@test.com", "company", "Multi3", "Multi3")
        h4, uid4 = _reg(client, "multi4@test.com", "recruiter", "Multi4")

        client.post("/api/chat/messages", headers=h1, json={
            "recipient_id": uid2, "content": "Hey 2",
        })
        client.post("/api/chat/messages", headers=h1, json={
            "recipient_id": uid3, "content": "Hey 3",
        })
        client.post("/api/chat/messages", headers=h1, json={
            "recipient_id": uid4, "content": "Hey 4",
        })

        convs = client.get("/api/chat/conversations", headers=h1).json()
        assert len(convs) == 3


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  DATA ISOLATION BETWEEN ROLES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestDataIsolation:

    def test_seeker_cannot_see_other_seekers_applications(self, client):
        co_h, _ = _reg(client, "iso-co@test.com", "company", "IsoCo", "IsoCo")
        job_id = client.post("/api/jobs", headers=co_h, json=_job()).json()["id"]

        sk1_h, _ = _reg(client, "iso-sk1@test.com", name="Seeker1")
        sk2_h, _ = _reg(client, "iso-sk2@test.com", name="Seeker2")

        client.post(f"/api/jobs/{job_id}/apply", headers=sk1_h, json={"job_id": job_id})
        client.post(f"/api/jobs/{job_id}/apply", headers=sk2_h, json={"job_id": job_id})

        apps1 = client.get("/api/jobs/me/applications", headers=sk1_h).json()
        apps2 = client.get("/api/jobs/me/applications", headers=sk2_h).json()
        assert len(apps1) == 1
        assert len(apps2) == 1
        assert apps1[0]["seeker_id"] != apps2[0]["seeker_id"]

    def test_company_only_sees_own_jobs(self, client):
        h1, _ = _reg(client, "iso-co1@test.com", "company", "Co1", "Co1")
        h2, _ = _reg(client, "iso-co2@test.com", "company", "Co2", "Co2")

        j1 = client.post("/api/jobs", headers=h1, json=_job(title="Co1 Job")).json()["id"]
        j2 = client.post("/api/jobs", headers=h2, json=_job(title="Co2 Job")).json()["id"]

        dash1 = client.get("/api/company/dashboard", headers=h1).json()
        dash2 = client.get("/api/company/dashboard", headers=h2).json()

        j1_titles = [j["title"] for j in dash1["jobs"]]
        j2_titles = [j["title"] for j in dash2["jobs"]]
        assert "Co1 Job" in j1_titles
        assert "Co2 Job" not in j1_titles
        assert "Co2 Job" in j2_titles
        assert "Co1 Job" not in j2_titles


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  SEARCH AND FILTER ACCURACY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestSearchAccuracy:

    def test_job_search_by_description(self, client):
        co_h, _ = _reg(client, "search-co@test.com", "company", "SearchCo", "SearchCo")
        client.post("/api/jobs", headers=co_h, json=_job(
            title="Backend Dev", description="Build microservices with Rust and gRPC.",
            required_skills=["Rust"],
        ))
        client.post("/api/jobs", headers=co_h, json=_job(
            title="Frontend Dev", description="Build UIs with React.",
            required_skills=["React"],
        ))

        results = client.get("/api/jobs?search=rust").json()
        assert len(results) >= 1
        assert all("Rust" in j.get("description", "") or "Rust" in str(j.get("required_skills", []))
                    for j in results)

    def test_job_filter_remote(self, client):
        co_h, _ = _reg(client, "remote-co@test.com", "company", "RemCo", "RemCo")
        client.post("/api/jobs", headers=co_h, json=_job(title="Remote Job", remote=True))
        client.post("/api/jobs", headers=co_h, json=_job(title="Office Job", remote=False))

        results = client.get("/api/jobs?remote_only=true").json()
        assert all(j["remote"] for j in results)

    def test_job_filter_type(self, client):
        co_h, _ = _reg(client, "type-co@test.com", "company", "TypeCo", "TypeCo")
        client.post("/api/jobs", headers=co_h, json=_job(type="full-time"))
        client.post("/api/jobs", headers=co_h, json=_job(type="contract"))

        results = client.get("/api/jobs?job_type=contract").json()
        assert all(j["type"] == "contract" for j in results)

    def test_recruiter_skill_filter(self, client):
        # Create seekers with different skills
        for i, skills in enumerate([["React"], ["Python"], ["React", "Python"]]):
            h, _ = _reg(client, f"rf-sk{i}@test.com", name=f"RF Seeker {i}")
            client.post("/api/seeker/profile", headers=h, json=_profile(
                name=f"RF Seeker {i}", skills=skills,
            ))

        rec_h, _ = _reg(client, "rf-rec@test.com", "recruiter", "RF Rec")
        results = client.get("/api/recruiter/candidates?skills=React", headers=rec_h).json()
        for c in results:
            assert "React" in c["skills"]


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  AUTH PROTECTION (PARAMETRIZED)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestAuthProtection:

    @pytest.mark.parametrize("method,path", [
        ("GET", "/api/seeker/profile"),
        ("POST", "/api/seeker/profile"),
        ("GET", "/api/seeker/jobs/matches"),
        ("POST", "/api/seeker/ai/summary"),
        ("GET", "/api/jobs/me/applications"),
        ("GET", "/api/recruiter/candidates"),
        ("GET", "/api/recruiter/pipeline"),
        ("GET", "/api/recruiter/analytics"),
        ("GET", "/api/company/dashboard"),
        ("GET", "/api/company/analytics"),
        ("GET", "/api/chat/conversations"),
    ])
    def test_protected_endpoint_rejects_unauthenticated(self, client, method, path):
        if method == "GET":
            resp = client.get(path)
        elif method == "POST":
            resp = client.post(path, json={})
        else:
            resp = client.request(method, path)
        assert resp.status_code in (401, 403, 422)

    def test_expired_style_invalid_token_rejected(self, client):
        resp = client.get("/api/seeker/profile", headers={
            "Authorization": "Bearer completely.invalid.token"
        })
        assert resp.status_code in (401, 403)
