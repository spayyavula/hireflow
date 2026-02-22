"""
Unit tests for config.py — JWT, password hashing, auth dependencies.
Covers edge cases, expiration, tampered tokens, and boundary conditions.
"""

import time
from datetime import timedelta, datetime, timezone

import pytest
from jose import jwt as jose_jwt


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Password Hashing
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestPasswordHashing:
    """Tests for bcrypt password hashing and verification."""

    def test_hash_returns_bcrypt_prefix(self):
        from api.core.config import hash_password
        h = hash_password("testpass123")
        assert h.startswith("$2b$") or h.startswith("$2a$")

    def test_hash_same_password_produces_different_hashes(self):
        from api.core.config import hash_password
        h1 = hash_password("samepassword")
        h2 = hash_password("samepassword")
        assert h1 != h2  # different salts

    def test_verify_correct_password(self):
        from api.core.config import hash_password, verify_password
        h = hash_password("mypassword")
        assert verify_password("mypassword", h) is True

    def test_verify_wrong_password(self):
        from api.core.config import hash_password, verify_password
        h = hash_password("correct")
        assert verify_password("wrong", h) is False

    def test_verify_empty_password(self):
        from api.core.config import hash_password, verify_password
        h = hash_password("")
        assert verify_password("", h) is True
        assert verify_password("notempty", h) is False

    def test_verify_unicode_password(self):
        from api.core.config import hash_password, verify_password
        h = hash_password("pässwörd🔐")
        assert verify_password("pässwörd🔐", h) is True
        assert verify_password("password", h) is False

    def test_verify_long_password(self):
        from api.core.config import hash_password, verify_password
        # bcrypt truncates at 72 bytes, but should still work
        long_pw = "a" * 100
        h = hash_password(long_pw)
        assert verify_password(long_pw, h) is True


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  JWT Token Creation & Decoding
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestJWTTokens:
    """Tests for JWT creation, decoding, expiration, and tampering."""

    def test_create_and_decode_token(self):
        from api.core.config import create_access_token, decode_token
        token = create_access_token({"sub": "user-123", "role": "seeker"})
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == "user-123"
        assert payload["role"] == "seeker"
        assert "exp" in payload

    def test_token_has_expiration(self):
        from api.core.config import create_access_token, decode_token
        token = create_access_token({"sub": "user-1"})
        payload = decode_token(token)
        assert payload["exp"] > datetime.now(timezone.utc).timestamp()

    def test_custom_expiration_delta(self):
        from api.core.config import create_access_token, decode_token
        token = create_access_token({"sub": "u1"}, expires_delta=timedelta(minutes=5))
        payload = decode_token(token)
        exp_time = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        now = datetime.now(timezone.utc)
        diff = (exp_time - now).total_seconds()
        assert 200 < diff < 400  # ~5 minutes, with some tolerance

    def test_expired_token_returns_none(self):
        from api.core.config import create_access_token, decode_token
        token = create_access_token({"sub": "u1"}, expires_delta=timedelta(seconds=-1))
        # Token is already expired
        payload = decode_token(token)
        assert payload is None

    def test_tampered_token_returns_none(self):
        from api.core.config import create_access_token, decode_token
        token = create_access_token({"sub": "u1"})
        # Flip a character in the signature
        parts = token.split(".")
        sig = parts[2]
        tampered_sig = sig[:-1] + ("A" if sig[-1] != "A" else "B")
        tampered = f"{parts[0]}.{parts[1]}.{tampered_sig}"
        assert decode_token(tampered) is None

    def test_wrong_secret_key_token_returns_none(self):
        from api.core.config import decode_token, ALGORITHM
        # Create token with a different secret
        token = jose_jwt.encode(
            {"sub": "u1", "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
            "wrong-secret-key",
            algorithm=ALGORITHM,
        )
        assert decode_token(token) is None

    def test_completely_invalid_token_returns_none(self):
        from api.core.config import decode_token
        assert decode_token("not.a.jwt") is None
        assert decode_token("") is None
        assert decode_token("abc123") is None

    def test_token_preserves_arbitrary_data(self):
        from api.core.config import create_access_token, decode_token
        data = {"sub": "u1", "role": "admin", "custom": "value", "num": 42}
        token = create_access_token(data)
        payload = decode_token(token)
        assert payload["custom"] == "value"
        assert payload["num"] == 42

    def test_token_does_not_mutate_input(self):
        from api.core.config import create_access_token
        data = {"sub": "u1"}
        original = data.copy()
        create_access_token(data)
        assert data == original  # no "exp" added to original dict


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Auth Dependencies (require_user, get_current_user)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TestAuthDependencies:
    """Tests for FastAPI auth dependency functions via the test client."""

    def test_no_auth_header_returns_401(self, client):
        resp = client.get("/api/seeker/profile")
        assert resp.status_code == 401

    def test_bearer_with_invalid_token_returns_401(self, client):
        resp = client.get(
            "/api/seeker/profile",
            headers={"Authorization": "Bearer invalid.token.here"},
        )
        assert resp.status_code == 401

    def test_bearer_with_valid_token_for_nonexistent_user(self, client):
        from api.core.config import create_access_token
        token = create_access_token({"sub": "nonexistent-user-id"})
        resp = client.get(
            "/api/seeker/profile",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 401

    def test_bearer_without_sub_claim_returns_401(self, client):
        from api.core.config import create_access_token
        token = create_access_token({"role": "seeker"})  # no "sub"
        resp = client.get(
            "/api/seeker/profile",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 401

    def test_valid_token_for_existing_user_works(self, client):
        # Register inline
        resp = client.post("/api/auth/register", json={
            "email": "valid@test.com", "password": "pass1234", "role": "seeker",
        })
        assert resp.status_code == 201
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        # Authenticated request should not return 401
        resp = client.get("/api/seeker/profile", headers=headers)
        assert resp.status_code != 401  # auth succeeded, even if profile not found (404)
