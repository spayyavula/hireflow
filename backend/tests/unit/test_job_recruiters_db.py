"""Unit tests for job_recruiters database helpers."""

import pytest

from api.core.database import (
    assign_recruiter_to_job,
    unassign_recruiter_from_job,
    get_recruiter_assignment,
    get_recruiters_for_job,
    get_jobs_for_recruiter,
)


@pytest.mark.unit
def test_assign_and_get_recruiter_assignment():
    assign_recruiter_to_job("job_1", "rec_1")
    assert get_recruiter_assignment("job_1", "rec_1") is not None
    assert get_recruiter_assignment("job_1", "rec_2") is None
    assert get_recruiter_assignment("job_2", "rec_1") is None


@pytest.mark.unit
def test_get_recruiters_for_job():
    assign_recruiter_to_job("job_1", "rec_1")
    assign_recruiter_to_job("job_1", "rec_2")
    assign_recruiter_to_job("job_2", "rec_3")
    assert set(get_recruiters_for_job("job_1")) == {"rec_1", "rec_2"}
    assert get_recruiters_for_job("job_3") == []


@pytest.mark.unit
def test_get_jobs_for_recruiter():
    assign_recruiter_to_job("job_1", "rec_1")
    assign_recruiter_to_job("job_2", "rec_1")
    assign_recruiter_to_job("job_3", "rec_2")
    assert set(get_jobs_for_recruiter("rec_1")) == {"job_1", "job_2"}
    assert get_jobs_for_recruiter("rec_9") == []


@pytest.mark.unit
def test_unassign_recruiter():
    assign_recruiter_to_job("job_1", "rec_1")
    unassign_recruiter_from_job("job_1", "rec_1")
    assert get_recruiter_assignment("job_1", "rec_1") is None
