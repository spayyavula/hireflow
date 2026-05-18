# HireFlow

An AI-assisted, three-sided job marketplace connecting job seekers, recruiters, and companies. This glossary fixes the canonical domain language so the same word always means the same thing across backend, web, mobile, and docs.

## Language

### Roles

**Seeker**:
A user looking for a job. Owns a profile, resume, applications, and **Match Scores**.
_Avoid_: "job seeker" (the role value is `seeker`), "applicant" outside an application context.

**Recruiter**:
An independent agency user assigned to individual **Job** postings. Sources candidates marketplace-wide and runs the funnel on assigned jobs. Not an employee of a **Company** (see ADR-0001).
_Avoid_: treating a recruiter as company staff.

**Company**:
An organization, represented by a single user account, that owns **Job** postings and makes hiring decisions.
_Avoid_: "employer", "client".

**Candidate**:
A **Seeker** as seen from the hiring side — in recruiter candidate search or a job's applications. Not a separate entity.
_Avoid_: using "candidate" for a seeker browsing jobs; they are a **Seeker** there.

### Jobs

**Job** (a.k.a. Job Posting):
An internal, **Company**-owned marketplace posting in the `jobs` table. Appliable — a **Seeker** can submit an **Application** to it.
_Avoid_: "job posting" and "job" for external provider results.

**External Listing**:
A job aggregated on the fly from external providers (JSearch / Jobs API) via `/api/jobs/search`. Browse-only — not appliable in-app, never persisted; a **Match Score** may be computed transiently.
_Avoid_: "job", "external job".

### Hiring pipeline

**Interview**:
A stage in an application's hiring pipeline — a real recruiter/company interviewing a real candidate for a real job. One of the `applications.status` values.
_Avoid_: using bare "interview" for the practice feature.

**Practice Session** (a.k.a. Interview Prep):
The AI mock-interview practice feature — a seeker rehearses interview questions and gets answer feedback. Independent of any real job or application.
_Avoid_: "interview session", "interview" (unqualified).

### Product feedback

**Idea**:
A user-submitted suggestion on the public Ideas Board — others vote and comment, and it moves through a status lifecycle (e.g. shipped).
_Avoid_: "feature request", "feature" — these are legacy internal names only (backend table `feature_requests`, route `/api/features`), kept for now but not canonical.

### AI assistants

**Scout**:
The product name of the AI career counselor (`/api/scout/chat`) — a conversational assistant that answers career questions and triggers **External Listing** searches.

### Matching & analysis

**Match Score**:
The 0–99 number ranking how well one seeker fits one job posting, produced by `compute_job_match()`. The user-facing output of the **Job Matching** feature.
_Avoid_: "match" (unqualified) for the number; "fit score", "relevance score".

**Job Matching**:
The feature that automatically computes **Match Scores** between a seeker and marketplace job postings and surfaces ranked results.

**Matcher**:
The on-demand tool where a user supplies a resume and a job description and receives an AI gap analysis plus a generated cover letter. Persisted as `matcher_analyses`.
_Avoid_: "matching", "match analysis" — "Matcher" is the proper name of this tool.

## Relationships

- A **Company** owns one or more **Job** postings.
- A **Recruiter** is assigned to specific **Job** postings (join table `job_recruiters`); a **Job** may have several assigned recruiters.
- A **Seeker** submits an **Application** to a **Job** (unique per seeker–job pair); as **Candidate** they appear in the hiring side's views.
- A **Practice Session** belongs to a **Seeker** and references no real **Job** or **Application**.
- An **Interview** is a status an **Application** moves through; it is not an entity of its own.
- **Job Matching** produces a **Match Score** per seeker–job pair; the **Matcher** produces a stored analysis per invocation. They are separate features that share no code.

## Example dialogue

> **Dev:** "When a **Recruiter** opens their pipeline, do they see every **Application** in the system?"
> **Domain expert:** "No — a **Recruiter** only sees **Applications** for **Jobs** they're assigned to. A **Company** sees its own **Jobs**. Sourcing is the exception: candidate search spans every **Seeker** in the marketplace."
> **Dev:** "And if a **Seeker** does an AI mock interview, does that touch their **Applications**?"
> **Domain expert:** "Never. That's a **Practice Session** — it's rehearsal, unconnected to any real **Job**. **Interview** with a capital I only means the pipeline stage."

## Flagged ambiguities

- "interview" was used for both the hiring-pipeline stage and the AI practice feature — resolved: the practice feature is renamed **Practice Session** (route `/api/practice`, table `practice_sessions`); "Interview" is reserved for the pipeline stage.
- "match"/"matcher" named two different features — resolved: **Match Score** (the marketplace ranking number, feature **Job Matching**) vs **Matcher** (the on-demand resume/JD analysis tool). Routes and tables unchanged.
- "job" meant both the appliable internal posting and aggregated provider results — resolved: **Job** (internal, appliable) vs **External Listing** (`/api/jobs/search`, browse-only). Routes unchanged.
- the suggestion board was "idea" in the UI and "feature request" in code — resolved: **Idea** is canonical; `feature_requests`/`/api/features`/frontend `features` state are legacy aliases. Frontend state vars should move to `ideas` for consistency; backend rename deferred.
