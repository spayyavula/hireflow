"""
Fixtures for integration and regression test subdirectories.
Imports helpers from the root conftest and creates standard auth fixtures.
"""

import pytest
from tests.conftest import register_user, auth_header, create_seeker_with_profile


@pytest.fixture
def seeker_auth(client):
    token, _ = register_user(client, "seeker@test.com", "password123", "seeker", "Alice Seeker")
    return auth_header(token)


@pytest.fixture
def company_auth(client):
    token, _ = register_user(client, "co@test.com", "password123", "company", "Acme Inc", "Acme Inc")
    return auth_header(token)


@pytest.fixture
def recruiter_auth(client):
    token, _ = register_user(client, "rec@test.com", "password123", "recruiter", "Bob Recruiter")
    return auth_header(token)


@pytest.fixture
def seeker_with_profile(client, seeker_auth):
    client.post("/api/seeker/profile", headers=seeker_auth, json={
        "name": "Alice Seeker", "headline": "Senior Frontend Dev",
        "location": "San Francisco", "skills": ["React", "TypeScript", "Node.js", "AWS"],
        "desired_roles": ["Frontend Developer", "Full Stack Developer"],
        "experience_level": "Senior (6-9 yrs)", "work_preferences": ["Remote"],
        "salary_range": "$160k–$200k", "industries": ["Tech / SaaS"],
        "experience": [{"title": "Sr. Engineer", "company": "Google", "duration": "2020-2024"}],
        "education": [{"school": "MIT", "degree": "B.S. CS", "year": "2018"}],
        "summary": "Experienced full-stack developer.",
    })
    return seeker_auth


@pytest.fixture
def sample_jobs(client, company_auth):
    specs = [
        {"title": "React Developer", "location": "Remote", "salary_min": 150000,
         "salary_max": 200000, "type": "full-time", "remote": True,
         "description": "Build React apps.",
         "required_skills": ["React", "TypeScript", "JavaScript"],
         "nice_skills": ["Next.js", "Redux"], "experience_level": "Senior (6-9 yrs)"},
        {"title": "Python Backend Engineer", "location": "NYC", "salary_min": 140000,
         "salary_max": 180000, "type": "full-time", "remote": False,
         "description": "Build APIs with FastAPI.",
         "required_skills": ["Python", "FastAPI", "SQL"],
         "nice_skills": ["Docker", "AWS"], "experience_level": "Mid Level (3-5 yrs)"},
        {"title": "DevOps Lead", "location": "Austin", "salary_min": 160000,
         "salary_max": 200000, "type": "contract", "remote": True,
         "description": "Cloud infrastructure.",
         "required_skills": ["AWS", "Kubernetes", "Terraform"],
         "nice_skills": ["Docker", "CI/CD"], "experience_level": "Senior (6-9 yrs)"},
    ]
    ids = []
    for s in specs:
        r = client.post("/api/jobs", headers=company_auth, json=s)
        assert r.status_code == 201, r.text
        ids.append(r.json()["id"])
    return ids
