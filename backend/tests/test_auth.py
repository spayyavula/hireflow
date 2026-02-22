"""
Integration tests for /api/auth endpoints.
"""

import pytest
from tests.conftest import register_user, auth_header


class TestRegister:

    @pytest.mark.integration
    def test_register_seeker(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "alice@test.com", "password": "password123",
            "role": "seeker", "name": "Alice",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["access_token"]
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "alice@test.com"
        assert data["user"]["role"] == "seeker"
        assert data["user"]["name"] == "Alice"

    @pytest.mark.integration
    def test_register_company(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "co@test.com", "password": "password123",
            "role": "company", "name": "Admin", "company_name": "TestCorp",
        })
        assert resp.status_code == 201
        assert resp.json()["user"]["company_name"] == "TestCorp"

    @pytest.mark.integration
    def test_register_company_without_name_fails(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "co2@test.com", "password": "password123", "role": "company",
        })
        assert resp.status_code == 400

    @pytest.mark.integration
    def test_register_duplicate_email_fails(self, client):
        register_user(client, email="dupe@test.com")
        resp = client.post("/api/auth/register", json={
            "email": "dupe@test.com", "password": "password123", "role": "seeker",
        })
        assert resp.status_code == 409

    @pytest.mark.integration
    def test_register_short_password_fails(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "short@test.com", "password": "abc", "role": "seeker",
        })
        assert resp.status_code == 422  # Pydantic validation

    @pytest.mark.integration
    def test_register_invalid_role_fails(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "bad@test.com", "password": "password123", "role": "admin",
        })
        assert resp.status_code == 422


class TestLogin:

    @pytest.mark.integration
    def test_login_success(self, client):
        register_user(client, email="login@test.com", password="mypassword123")
        resp = client.post("/api/auth/login", json={
            "email": "login@test.com", "password": "mypassword123",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["access_token"]
        assert data["user"]["email"] == "login@test.com"

    @pytest.mark.integration
    def test_login_wrong_password(self, client):
        register_user(client, email="pw@test.com", password="correct123")
        resp = client.post("/api/auth/login", json={
            "email": "pw@test.com", "password": "wrongpassword",
        })
        assert resp.status_code == 401

    @pytest.mark.integration
    def test_login_nonexistent_email(self, client):
        resp = client.post("/api/auth/login", json={
            "email": "ghost@test.com", "password": "anything123",
        })
        assert resp.status_code == 401

    @pytest.mark.integration
    def test_login_seeded_recruiter(self, seeded_client):
        resp = seeded_client.post("/api/auth/login", json={
            "email": "recruiter@demo.com", "password": "demo1234",
        })
        assert resp.status_code == 200
        assert resp.json()["user"]["role"] == "recruiter"

    @pytest.mark.integration
    def test_login_seeded_company(self, seeded_client):
        resp = seeded_client.post("/api/auth/login", json={
            "email": "techvault@demo.com", "password": "demo1234",
        })
        assert resp.status_code == 200
        assert resp.json()["user"]["role"] == "company"


class TestProtectedRoutes:

    @pytest.mark.integration
    def test_no_token_returns_401(self, client):
        resp = client.get("/api/seeker/profile")
        assert resp.status_code == 401

    @pytest.mark.integration
    def test_invalid_token_returns_401(self, client):
        resp = client.get("/api/seeker/profile", headers={"Authorization": "Bearer garbage"})
        assert resp.status_code == 401

    @pytest.mark.integration
    def test_valid_token_accepted(self, client):
        token, _ = register_user(client)
        resp = client.get("/api/seeker/analytics", headers=auth_header(token))
        assert resp.status_code == 200
