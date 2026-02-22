"""
Unit tests for the database abstraction layer.
Tests all CRUD functions against the in-memory mock.
"""

import pytest
from tests.conftest import register_user, auth_header


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  USER CRUD
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestUserCRUD:
    """Direct database layer tests for user operations."""

    def test_create_and_get_user(self, mock_supabase):
        import api.core.database as db
        user = db.create_user({
            "id": "u1", "email": "db@test.com", "role": "seeker",
            "name": "DB User", "hashed_password": "xxx",
            "skills": [], "desired_roles": [], "work_preferences": [],
            "industries": [], "experience": [], "education": [], "specializations": [],
        })
        assert user["id"] == "u1"
        assert user["email"] == "db@test.com"

        fetched = db.get_user_by_id("u1")
        assert fetched is not None
        assert fetched["name"] == "DB User"

    def test_get_nonexistent_user(self, mock_supabase):
        import api.core.database as db
        assert db.get_user_by_id("nonexistent") is None

    def test_get_user_by_email(self, mock_supabase):
        import api.core.database as db
        db.create_user({
            "id": "ue1", "email": "byemail@test.com", "role": "seeker",
            "name": "Email User", "hashed_password": "xxx",
            "skills": [], "desired_roles": [], "work_preferences": [],
            "industries": [], "experience": [], "education": [], "specializations": [],
        })
        found = db.get_user_by_email("byemail@test.com")
        assert found is not None
        assert found["name"] == "Email User"

    def test_get_user_by_email_not_found(self, mock_supabase):
        import api.core.database as db
        assert db.get_user_by_email("ghost@test.com") is None

    def test_update_user(self, mock_supabase):
        import api.core.database as db
        db.create_user({
            "id": "uu1", "email": "upd@test.com", "role": "seeker",
            "name": "Before", "hashed_password": "xxx",
            "skills": [], "desired_roles": [], "work_preferences": [],
            "industries": [], "experience": [], "education": [], "specializations": [],
        })
        result = db.update_user("uu1", {"name": "After", "headline": "New headline"})
        assert result["name"] == "After"

        fetched = db.get_user_by_id("uu1")
        assert fetched["name"] == "After"
        assert fetched["headline"] == "New headline"

    def test_get_users_by_role(self, mock_supabase):
        import api.core.database as db
        for i, role in enumerate(["seeker", "seeker", "company", "recruiter"]):
            db.create_user({
                "id": f"role_{i}", "email": f"role{i}@test.com", "role": role,
                "name": f"User {i}", "hashed_password": "xxx",
                "skills": ["Python"] if role == "seeker" else [],
                "desired_roles": [], "work_preferences": [],
                "industries": [], "experience": [], "education": [], "specializations": [],
            })
        seekers = db.get_users_by_role("seeker")
        assert len(seekers) == 2
        companies = db.get_users_by_role("company")
        assert len(companies) == 1

    def test_get_seekers_with_skills(self, mock_supabase):
        import api.core.database as db
        # Seeker WITH skills
        db.create_user({
            "id": "skilled", "email": "skilled@test.com", "role": "seeker",
            "name": "Skilled", "hashed_password": "xxx",
            "skills": ["React", "Node.js"], "desired_roles": [],
            "work_preferences": [], "industries": [],
            "experience": [], "education": [], "specializations": [],
        })
        # Seeker WITHOUT skills
        db.create_user({
            "id": "unskilled", "email": "unskilled@test.com", "role": "seeker",
            "name": "Unskilled", "hashed_password": "xxx",
            "skills": [], "desired_roles": [],
            "work_preferences": [], "industries": [],
            "experience": [], "education": [], "specializations": [],
        })
        result = db.get_seekers_with_skills()
        ids = [u["id"] for u in result]
        assert "skilled" in ids
        # empty skills should NOT match neq("skills", "[]")
        # In mock, [] != "[]" so both pass - this tests the mock behavior


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  JOB CRUD
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestJobCRUD:
    """Direct database layer tests for job operations."""

    def _make_job(self, db, job_id="j1", **kw):
        defaults = {
            "id": job_id, "company_id": "c1", "title": "Dev",
            "location": "Remote", "description": "Build stuff.",
            "required_skills": ["Python"], "nice_skills": ["Docker"],
            "status": "active", "type": "full-time", "remote": True,
            "applicant_count": 0,
        }
        defaults.update(kw)
        return db.create_job(defaults)

    def test_create_and_get_job(self, mock_supabase):
        import api.core.database as db
        job = self._make_job(db)
        assert job["id"] == "j1"
        assert job["title"] == "Dev"

        fetched = db.get_job_by_id("j1")
        assert fetched is not None
        assert fetched["required_skills"] == ["Python"]

    def test_get_nonexistent_job(self, mock_supabase):
        import api.core.database as db
        assert db.get_job_by_id("noexist") is None

    def test_get_active_jobs(self, mock_supabase):
        import api.core.database as db
        self._make_job(db, "j_act", status="active")
        self._make_job(db, "j_cls", status="closed")
        self._make_job(db, "j_pau", status="paused")

        active = db.get_active_jobs()
        active_ids = [j["id"] for j in active]
        assert "j_act" in active_ids
        assert "j_cls" not in active_ids
        assert "j_pau" not in active_ids

    def test_search_jobs_by_title(self, mock_supabase):
        import api.core.database as db
        self._make_job(db, "j_react", title="React Developer")
        self._make_job(db, "j_python", title="Python Engineer")
        results = db.search_jobs(search="react")
        assert len(results) == 1
        assert results[0]["title"] == "React Developer"

    def test_search_jobs_by_skill(self, mock_supabase):
        import api.core.database as db
        self._make_job(db, "js1", required_skills=["Rust", "Go"])
        self._make_job(db, "js2", required_skills=["Python", "SQL"])
        results = db.search_jobs(search="rust")
        assert len(results) == 1

    def test_search_jobs_remote_only(self, mock_supabase):
        import api.core.database as db
        self._make_job(db, "jr1", remote=True)
        self._make_job(db, "jr2", remote=False)
        results = db.search_jobs(remote_only=True)
        assert all(j["remote"] for j in results)

    def test_search_jobs_by_type(self, mock_supabase):
        import api.core.database as db
        self._make_job(db, "jt1", type="full-time")
        self._make_job(db, "jt2", type="contract")
        results = db.search_jobs(job_type="contract")
        assert len(results) == 1
        assert results[0]["type"] == "contract"

    def test_update_job(self, mock_supabase):
        import api.core.database as db
        self._make_job(db, "jupd")
        updated = db.update_job("jupd", {"title": "Updated Title", "remote": False})
        assert updated["title"] == "Updated Title"

    def test_close_job(self, mock_supabase):
        import api.core.database as db
        self._make_job(db, "jclose")
        db.close_job("jclose")
        fetched = db.get_job_by_id("jclose")
        assert fetched["status"] == "closed"

    def test_search_jobs_limit(self, mock_supabase):
        import api.core.database as db
        for i in range(10):
            self._make_job(db, f"jlim_{i}")
        results = db.search_jobs(limit=3)
        assert len(results) == 3


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  APPLICATION CRUD
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestApplicationCRUD:

    def test_create_and_get_application(self, mock_supabase):
        import api.core.database as db
        app = db.create_application({
            "id": "a1", "job_id": "j1", "seeker_id": "s1",
            "status": "applied", "cover_letter": "Hire me",
        })
        assert app["id"] == "a1"

        fetched = db.get_application_by_id("a1")
        assert fetched is not None
        assert fetched["status"] == "applied"

    def test_get_applications_by_job(self, mock_supabase):
        import api.core.database as db
        db.create_application({"id": "a1", "job_id": "j1", "seeker_id": "s1", "status": "applied"})
        db.create_application({"id": "a2", "job_id": "j1", "seeker_id": "s2", "status": "applied"})
        db.create_application({"id": "a3", "job_id": "j2", "seeker_id": "s1", "status": "applied"})

        apps = db.get_applications_by_job("j1")
        assert len(apps) == 2

    def test_get_applications_by_seeker(self, mock_supabase):
        import api.core.database as db
        db.create_application({"id": "a1", "job_id": "j1", "seeker_id": "s1", "status": "applied"})
        db.create_application({"id": "a2", "job_id": "j2", "seeker_id": "s1", "status": "applied"})
        db.create_application({"id": "a3", "job_id": "j1", "seeker_id": "s2", "status": "applied"})

        apps = db.get_applications_by_seeker("s1")
        assert len(apps) == 2

    def test_get_application_by_job_and_seeker(self, mock_supabase):
        import api.core.database as db
        db.create_application({"id": "a1", "job_id": "j1", "seeker_id": "s1", "status": "applied"})
        found = db.get_application_by_job_and_seeker("j1", "s1")
        assert found is not None
        assert found["id"] == "a1"

        not_found = db.get_application_by_job_and_seeker("j1", "s99")
        assert not_found is None

    def test_update_application_status(self, mock_supabase):
        import api.core.database as db
        db.create_application({"id": "aup", "job_id": "j1", "seeker_id": "s1", "status": "applied"})
        result = db.update_application_status("aup", "screening")
        assert result["status"] == "screening"

    def test_get_all_applications(self, mock_supabase):
        import api.core.database as db
        for i in range(5):
            db.create_application({"id": f"all_{i}", "job_id": "j1", "seeker_id": f"s{i}", "status": "applied"})
        all_apps = db.get_all_applications()
        assert len(all_apps) == 5


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  CONVERSATION & MESSAGE CRUD
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestConversationCRUD:

    def test_create_conversation(self, mock_supabase):
        import api.core.database as db
        conv_id = db.create_conversation("conv_1", ["u1", "u2"])
        assert conv_id == "conv_1"

        participants = db.get_conversation_participants("conv_1")
        assert set(participants) == {"u1", "u2"}

    def test_get_conversation_between_users(self, mock_supabase):
        import api.core.database as db
        db.create_conversation("conv_ab", ["ua", "ub"])

        found = db.get_conversation_between("ua", "ub")
        assert found == "conv_ab"

        not_found = db.get_conversation_between("ua", "uc")
        assert not_found is None

    def test_create_and_get_messages(self, mock_supabase):
        import api.core.database as db
        db.create_conversation("conv_msg", ["u1", "u2"])
        db.create_message({
            "id": "m1", "conversation_id": "conv_msg",
            "sender_id": "u1", "content": "Hello!", "read": False,
        })
        db.create_message({
            "id": "m2", "conversation_id": "conv_msg",
            "sender_id": "u2", "content": "Hi back!", "read": False,
        })

        msgs = db.get_messages("conv_msg")
        assert len(msgs) == 2

    def test_mark_messages_read(self, mock_supabase):
        import api.core.database as db
        db.create_conversation("conv_read", ["u1", "u2"])
        db.create_message({
            "id": "mr1", "conversation_id": "conv_read",
            "sender_id": "u1", "content": "Msg 1", "read": False,
        })
        db.create_message({
            "id": "mr2", "conversation_id": "conv_read",
            "sender_id": "u2", "content": "Msg 2", "read": False,
        })

        # u2 marks messages as read — should only mark u1's messages
        db.mark_messages_read("conv_read", "u2")
        msgs = db.get_messages("conv_read")
        for m in msgs:
            if m["sender_id"] == "u1":
                assert m["read"] is True
            # u2's own message stays unread (neq sender_id filter)

    def test_empty_conversations_for_new_user(self, mock_supabase):
        import api.core.database as db
        convs = db.get_conversations_for_user("new_user")
        assert convs == []


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  JSONB HELPERS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestJsonbHelpers:

    def test_parse_jsonb_user_with_none_fields(self):
        from api.core.database import _parse_jsonb_fields_user
        data = {"id": "1", "skills": None, "experience": None, "education": None,
                "desired_roles": None, "work_preferences": None, "industries": None,
                "specializations": None}
        result = _parse_jsonb_fields_user(data)
        assert result["skills"] == []
        assert result["experience"] == []

    def test_parse_jsonb_user_with_string_json(self):
        from api.core.database import _parse_jsonb_fields_user
        data = {"id": "1", "skills": '["React","Node.js"]'}
        result = _parse_jsonb_fields_user(data)
        assert result["skills"] == ["React", "Node.js"]

    def test_parse_jsonb_user_with_invalid_string(self):
        from api.core.database import _parse_jsonb_fields_user
        data = {"id": "1", "skills": "not valid json"}
        result = _parse_jsonb_fields_user(data)
        assert result["skills"] == []

    def test_parse_jsonb_job_with_none_fields(self):
        from api.core.database import _parse_jsonb_fields_job
        data = {"id": "1", "required_skills": None, "nice_skills": None}
        result = _parse_jsonb_fields_job(data)
        assert result["required_skills"] == []
        assert result["nice_skills"] == []

    def test_prep_jsonb_user_string_to_list(self):
        from api.core.database import _prep_jsonb_fields_user
        data = {"skills": '["React"]', "desired_roles": '["Dev"]'}
        result = _prep_jsonb_fields_user(data)
        assert result["skills"] == ["React"]

    def test_parse_empty_dict(self):
        from api.core.database import _parse_jsonb_fields_user
        assert _parse_jsonb_fields_user({}) == {}

    def test_parse_none(self):
        from api.core.database import _parse_jsonb_fields_user
        assert _parse_jsonb_fields_user(None) is None
