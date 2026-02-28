"""
HireFlow Database Layer
=======================
Clean abstraction over Supabase.
All DB access goes through this module — routes never call Supabase directly.
"""

from __future__ import annotations

import os
from typing import Optional

from supabase import create_client, Client

# ─── Supabase Client (lazy init for Vercel build) ────────
_supabase: Optional[Client] = None


def _get_client() -> Client:
    global _supabase
    if _supabase is None:
        url = os.environ.get("SUPABASE_URL", "")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        if not url or not key:
            raise RuntimeError(
                "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. "
                "Set them in your .env file or Vercel project settings."
            )
        _supabase = create_client(url, key)
    return _supabase


# For backward compatibility — access as `supabase` (property-like)
class _SupabaseProxy:
    """Lazy proxy so `from database import supabase` works at import time."""
    def __getattr__(self, name):
        return getattr(_get_client(), name)

supabase = _SupabaseProxy()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  USERS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def get_user_by_id(user_id: str) -> Optional[dict]:
    res = supabase.table("users").select("*").eq("id", user_id).limit(1).execute()
    return _parse_jsonb_fields_user(res.data[0]) if res.data else None


def get_user_by_email(email: str) -> Optional[dict]:
    res = supabase.table("users").select("*").eq("email", email).limit(1).execute()
    return _parse_jsonb_fields_user(res.data[0]) if res.data else None


def create_user(user: dict) -> dict:
    user = _prep_jsonb_fields_user(user)
    res = supabase.table("users").insert(user).execute()
    return _parse_jsonb_fields_user(res.data[0])


def update_user(user_id: str, data: dict) -> dict:
    data = _prep_jsonb_fields_user(data)
    # Remove 'id' from update payload if present
    data.pop("id", None)
    res = supabase.table("users").update(data).eq("id", user_id).execute()
    return _parse_jsonb_fields_user(res.data[0]) if res.data else {}


def get_users_by_role(role: str) -> list[dict]:
    res = supabase.table("users").select("*").eq("role", role).execute()
    return [_parse_jsonb_fields_user(u) for u in (res.data or [])]


def get_seekers_with_skills() -> list[dict]:
    """Get all seekers who have completed their profile (have skills)."""
    res = (
        supabase.table("users")
        .select("*")
        .eq("role", "seeker")
        .neq("skills", "[]")
        .execute()
    )
    return [_parse_jsonb_fields_user(u) for u in (res.data or [])]


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  JOBS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def get_job_by_id(job_id: str) -> Optional[dict]:
    res = supabase.table("jobs").select("*").eq("id", job_id).limit(1).execute()
    return _parse_jsonb_fields_job(res.data[0]) if res.data else None


def get_active_jobs() -> list[dict]:
    res = supabase.table("jobs").select("*").eq("status", "active").order("created_at", desc=True).execute()
    return [_parse_jsonb_fields_job(j) for j in (res.data or [])]


def get_jobs_by_company(company_id: str) -> list[dict]:
    res = supabase.table("jobs").select("*").eq("company_id", company_id).order("created_at", desc=True).execute()
    return [_parse_jsonb_fields_job(j) for j in (res.data or [])]


def search_jobs(search: Optional[str] = None, remote_only: bool = False, job_type: Optional[str] = None, limit: int = 50) -> list[dict]:
    q = supabase.table("jobs").select("*").eq("status", "active")

    if remote_only:
        q = q.eq("remote", True)
    if job_type:
        q = q.eq("type", job_type)

    q = q.order("created_at", desc=True).limit(limit)
    res = q.execute()
    jobs = [_parse_jsonb_fields_job(j) for j in (res.data or [])]

    # Client-side text search (Supabase free tier doesn't have full-text search)
    if search:
        s = search.lower()
        jobs = [
            j for j in jobs
            if s in j["title"].lower()
            or s in (j.get("description") or "").lower()
            or any(s in sk.lower() for sk in j.get("required_skills", []) + j.get("nice_skills", []))
        ]

    return jobs


def create_job(job: dict) -> dict:
    job = _prep_jsonb_fields_job(job)
    res = supabase.table("jobs").insert(job).execute()
    return _parse_jsonb_fields_job(res.data[0])


def update_job(job_id: str, data: dict) -> dict:
    data = _prep_jsonb_fields_job(data)
    data.pop("id", None)
    res = supabase.table("jobs").update(data).eq("id", job_id).execute()
    return _parse_jsonb_fields_job(res.data[0]) if res.data else {}


def close_job(job_id: str):
    supabase.table("jobs").update({"status": "closed"}).eq("id", job_id).execute()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  APPLICATIONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def get_application_by_id(app_id: str) -> Optional[dict]:
    res = supabase.table("applications").select("*").eq("id", app_id).limit(1).execute()
    return res.data[0] if res.data else None


def get_applications_by_job(job_id: str) -> list[dict]:
    res = supabase.table("applications").select("*").eq("job_id", job_id).order("created_at", desc=True).execute()
    return res.data or []


def get_applications_by_seeker(seeker_id: str) -> list[dict]:
    res = supabase.table("applications").select("*").eq("seeker_id", seeker_id).order("created_at", desc=True).execute()
    return res.data or []


def get_application_by_job_and_seeker(job_id: str, seeker_id: str) -> Optional[dict]:
    res = (
        supabase.table("applications")
        .select("*")
        .eq("job_id", job_id)
        .eq("seeker_id", seeker_id)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


def create_application(app: dict) -> dict:
    res = supabase.table("applications").insert(app).execute()
    return res.data[0]


def update_application_status(app_id: str, status: str) -> dict:
    res = supabase.table("applications").update({"status": status}).eq("id", app_id).execute()
    return res.data[0] if res.data else {}


def get_all_applications() -> list[dict]:
    res = supabase.table("applications").select("*").order("created_at", desc=True).execute()
    return res.data or []


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  CONVERSATIONS & MESSAGES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def get_conversation_between(user_a: str, user_b: str) -> Optional[str]:
    """Find a conversation that contains both users. Returns conversation id or None."""
    # Get all conversation IDs for user_a
    res_a = supabase.table("conversation_participants").select("conversation_id").eq("user_id", user_a).execute()
    conv_ids_a = {r["conversation_id"] for r in (res_a.data or [])}

    if not conv_ids_a:
        return None

    # Check if user_b is in any of those conversations
    res_b = (
        supabase.table("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user_b)
        .in_("conversation_id", list(conv_ids_a))
        .execute()
    )

    if res_b.data:
        return res_b.data[0]["conversation_id"]
    return None


def create_conversation(conv_id: str, participants: list[str]) -> str:
    supabase.table("conversations").insert({"id": conv_id}).execute()
    rows = [{"conversation_id": conv_id, "user_id": uid} for uid in participants]
    supabase.table("conversation_participants").insert(rows).execute()
    return conv_id


def get_conversations_for_user(user_id: str) -> list[dict]:
    """Get all conversations for a user with participant details."""
    # Get conversation IDs
    res = supabase.table("conversation_participants").select("conversation_id").eq("user_id", user_id).execute()
    conv_ids = [r["conversation_id"] for r in (res.data or [])]

    if not conv_ids:
        return []

    results = []
    for conv_id in conv_ids:
        # Get all participants
        p_res = supabase.table("conversation_participants").select("user_id").eq("conversation_id", conv_id).execute()
        participant_ids = [r["user_id"] for r in (p_res.data or [])]

        # Get participant names
        names = {}
        for pid in participant_ids:
            u = get_user_by_id(pid)
            if u:
                names[pid] = u.get("name") or u.get("company_name") or u.get("email", "Unknown")

        # Get last message
        m_res = (
            supabase.table("messages")
            .select("content, created_at, sender_id, read")
            .eq("conversation_id", conv_id)
            .order("created_at", desc=True)
            .limit(20)
            .execute()
        )
        msgs = m_res.data or []

        last_msg = msgs[0]["content"] if msgs else None
        last_msg_at = msgs[0]["created_at"] if msgs else None
        unread = len([m for m in msgs if m["sender_id"] != user_id and not m.get("read")])

        results.append({
            "id": conv_id,
            "participants": participant_ids,
            "participant_names": names,
            "last_message": last_msg,
            "last_message_at": last_msg_at,
            "unread_count": unread,
        })

    results.sort(key=lambda x: x.get("last_message_at") or "", reverse=True)
    return results


def get_messages(conversation_id: str) -> list[dict]:
    res = (
        supabase.table("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at")
        .execute()
    )
    return res.data or []


def get_conversation_participants(conversation_id: str) -> list[str]:
    res = (
        supabase.table("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conversation_id)
        .execute()
    )
    return [r["user_id"] for r in (res.data or [])]


def create_message(msg: dict) -> dict:
    res = supabase.table("messages").insert(msg).execute()
    return res.data[0]


def mark_messages_read(conversation_id: str, reader_id: str):
    """Mark all messages in a conversation as read for a specific user."""
    supabase.table("messages").update({"read": True}).eq(
        "conversation_id", conversation_id
    ).neq("sender_id", reader_id).eq("read", False).execute()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  HELPERS — JSONB field serialization
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Supabase stores jsonb natively, but we ensure lists are
# always Python lists on read and JSON-serializable on write.

_USER_JSONB_FIELDS = [
    "skills", "desired_roles", "work_preferences", "industries",
    "experience", "education", "specializations",
]

_JOB_JSONB_FIELDS = ["required_skills", "nice_skills"]


def _parse_jsonb_fields_user(data: dict) -> dict:
    if not data:
        return data
    for field in _USER_JSONB_FIELDS:
        val = data.get(field)
        if val is None:
            data[field] = []
        elif isinstance(val, str):
            import json
            try:
                data[field] = json.loads(val)
            except (json.JSONDecodeError, TypeError):
                data[field] = []
    return data


def _prep_jsonb_fields_user(data: dict) -> dict:
    """Ensure jsonb fields are lists/dicts (not strings) before insert/update."""
    for field in _USER_JSONB_FIELDS:
        if field in data and isinstance(data[field], str):
            import json
            try:
                data[field] = json.loads(data[field])
            except (json.JSONDecodeError, TypeError):
                data[field] = []
    return data


def _parse_jsonb_fields_job(data: dict) -> dict:
    if not data:
        return data
    for field in _JOB_JSONB_FIELDS:
        val = data.get(field)
        if val is None:
            data[field] = []
        elif isinstance(val, str):
            import json
            try:
                data[field] = json.loads(val)
            except (json.JSONDecodeError, TypeError):
                data[field] = []
    return data


def _prep_jsonb_fields_job(data: dict) -> dict:
    for field in _JOB_JSONB_FIELDS:
        if field in data and isinstance(data[field], str):
            import json
            try:
                data[field] = json.loads(data[field])
            except (json.JSONDecodeError, TypeError):
                data[field] = []
    return data
