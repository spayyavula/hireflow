# Recruiter is a per-job assigned agency, not a company employee

**Status:** accepted — implemented 2026-05-19

## Context

HireFlow has three roles: seeker, recruiter, company. The original schema wired up
only the seeker → application → job → company path. The `recruiter` role had routes
(candidate search, pipeline, analytics) but no data relationship to any company or
job, so every hiring-side view ran unscoped (e.g. `/recruiter/pipeline` returned
`get_all_applications()` for the whole marketplace). We had to decide what a Recruiter
actually *is* before the scoping — and the access-control fixes that depend on it —
could be defined.

## Decision

A **Recruiter** is an independent agency, not an employee of a Company. Recruiters are
**assigned to individual Job postings** via a join table `job_recruiters(job_id,
recruiter_id)`. On an assigned job a recruiter may view applications and advance them
through the pipeline (`screening → interview → offer`). Companies retain exclusive
ownership of job creation, job closing, and the final `hired` decision. Candidate
search (`/recruiter/candidates`) remains marketplace-wide because sourcing is
inherently global.

## Considered options

- **Recruiter belongs to a Company** (employee model) — rejected: collapses the
  three-sided marketplace toward two-sided and ties a recruiter to a single employer.
- **Per-company assignment** — rejected in favour of per-job: agencies are typically
  retained per requisition, and per-job is the finer-grained scope.
- **Merge recruiter into company** — rejected: removes the third side entirely.
- **Sourcing-only recruiter** (no pipeline access) — rejected: an assigned agency is
  expected to actively run the funnel, not just refer names.

## Consequences

- New `job_recruiters` join table + migration; a company-facing endpoint to assign and
  unassign recruiters on a job.
- `/jobs/{id}/applications`, `/jobs/applications/{id}/status`, `/recruiter/pipeline`,
  and `/recruiter/analytics` must be scoped to the caller's assigned jobs (company:
  owned jobs; recruiter: assigned jobs). This closes the current broken-access-control
  bugs where any authenticated user could read or mutate any application.
- `/recruiter/*` routes must enforce `role == "recruiter"`.
