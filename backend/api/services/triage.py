"""LP1 Triage plan generator.

Deterministic rule-based mapping from TriageAnswers -> TriagePlan. Every
action item has hand-written copy (no LLM call) so the output reads like
a coach wrote it. v1 covers the four most-load-bearing layoff scenarios:
visa clock, no-severance crisis, tight-runway file-for-unemployment, and
long-runway-but-stuck career exploration. Layered on top: resume rewrite,
networking, interview prep, direction conversation.
"""

from __future__ import annotations

from api.models.schemas import TriageAnswers, TriageActionItem, TriagePlan


# ─── Copy-as-data: action item templates ──────────────────────

def _visa_action() -> TriageActionItem:
    return TriageActionItem(
        priority=0,  # placeholder; renumbered at the end
        title="H-1B 60-day grace period — start the clock today",
        why="From your last day, you have 60 days to find a new H-1B sponsor "
            "or change status. Day 30 is when most people start panicking; you "
            "want to be in offer conversations by then.",
        how="(1) Filter only H-1B-friendly employers (h1bgrader.com, MyVisaJobs). "
            "(2) Tell recruiters upfront — they can fast-track or de-prioritize you, "
            "but they MUST know. (3) Talk to an immigration attorney this week "
            "about backup options (B-2 visitor extension, F-1 reactivation, "
            "spouse-dependent visa).",
        eta="this week",
    )


def _negotiate_severance_action() -> TriageActionItem:
    return TriageActionItem(
        priority=0,
        title="Negotiate severance before you sign anything",
        why="The first severance offer is almost never the final number. "
            "Companies expect counter-offers and many will improve the package — "
            "especially if you flag age/discrimination concerns or unused PTO/RSU vesting.",
        how="(1) Don't sign for 48-72 hours. (2) Ask HR in writing: 'Is this "
            "negotiable?' — the answer is almost always yes. (3) Counter on "
            "duration (+2-4 weeks), benefits continuation, RSU acceleration, "
            "and outplacement budget. (4) Get an employment attorney to review "
            "if the package is >$20k.",
        eta="48-72 hours",
    )


def _unemployment_action() -> TriageActionItem:
    return TriageActionItem(
        priority=0,
        title="File for unemployment this week",
        why="Most laid-off engineers skip this thinking they're 'fine' — but "
            "weekly benefits stack up to $5-15k over a multi-month search, "
            "and the 1-3 week processing delay means you want to file now even "
            "if you might find work fast.",
        how="Your state's unemployment site (Google '<state> unemployment "
            "filing'). 20 minutes online; you'll need your last employer's "
            "EIN (on a recent paystub) and dates of employment.",
        eta="20 minutes",
    )


def _career_direction_action() -> TriageActionItem:
    return TriageActionItem(
        priority=0,
        title="Start a Scout AI session on what you want next",
        why="You have runway and the freedom to actually choose what's next "
            "instead of taking the first offer. The biggest mistake in week 1 "
            "is jumping into job applications before deciding what you're "
            "applying for.",
        how="Open Scout AI and start with 'Help me figure out what I want my "
            "next role to look like.' Scout will work through values, "
            "constraints, must-haves, and walk-aways with you. Takes 20-30 min.",
        eta="30 minutes",
    )


def _resume_rewrite_action() -> TriageActionItem:
    return TriageActionItem(
        priority=0,
        title="Rewrite your resume for the active-search version",
        why="A resume written while employed sounds different from one written "
            "for active search — bullet emphasis shifts from 'responsibilities' "
            "to 'shipped + measurable impact', and the headline should flag "
            "your search status without sounding desperate.",
        how="Use Hyrly's Scout AI 'Resume Rewrite' flow, or run your current "
            "resume past the JD of one job you'd want and rewrite the top "
            "third to match its keywords. Aim for 1 page if <10 years, 2 if more.",
        eta="2-3 hours",
    )


def _networking_action() -> TriageActionItem:
    return TriageActionItem(
        priority=0,
        title="Networking: send 10 warm-reactivation messages this week",
        why="60-70% of senior engineering roles fill via referral, never reaching "
            "a public job board. Your dormant network is your highest-ROI search "
            "channel — but you have to actually message people, not just update "
            "your LinkedIn headline.",
        how="Pick 10 people you've worked with in the last 5 years. Same message "
            "to each: 'Hey [name], I'm exploring what's next after [company]. "
            "Are you / do you know anyone hiring [role] right now? Happy to send "
            "my resume if useful.' Don't apologize for asking.",
        eta="1 hour to write, replies trickle in for weeks",
    )


def _interview_prep_action() -> TriageActionItem:
    return TriageActionItem(
        priority=0,
        title="Do one voice mock interview before your first real call",
        why="The first real interview always goes worse than later ones because "
            "you're rusty. Burn the rust on a mock instead of a real role.",
        how="Open Hyrly's Interview Bot, paste a JD you'd realistically apply to, "
            "and do one full mock. The voice transcript + STAR-method scoring "
            "tells you exactly which answers need work.",
        eta="30 minutes",
    )


def _direction_conversation_action() -> TriageActionItem:
    return TriageActionItem(
        priority=0,
        title="One 90-minute thinking session — not in front of a computer",
        why="Your top concern is 'what do I want next', which doesn't get "
            "solved by scrolling LinkedIn. It gets solved by getting bored "
            "enough that the answer surfaces on its own.",
        how="Walk for 90 minutes with a notebook. Three questions: What did I "
            "actually love about my last role? What did I quietly dread? What "
            "would I regret not trying in the next 5 years? Bring the answers "
            "back to a Scout AI session.",
        eta="90 minutes",
    )


# ─── Plan composition ─────────────────────────────────────────

def _build_summary(a: TriageAnswers) -> str:
    role_label = {
        'engineer': 'engineer', 'em': 'engineering manager', 'pm': 'PM',
        'designer': 'designer', 'data': 'data professional', 'other': 'professional',
    }.get(a.role, 'professional')
    level_label = {
        'junior': 'Junior', 'mid': 'Mid-level', 'senior': 'Senior', 'staff_plus': 'Staff+/Director',
    }.get(a.level, '')
    tier_label = {
        'faang': 'a FAANG-tier company', 'public': 'a public tech company',
        'series_b_d': 'a Series B-D startup', 'pre_series_b': 'a pre-Series B startup',
        'other': 'your last role',
    }.get(a.company_tier, 'your last role')
    when_label = {
        'today': 'today', '1-7d': 'in the last week', '8-30d': 'in the last month',
        '31-90d': 'in the last 1-3 months', '90+d': 'over 3 months ago',
    }.get(a.laid_off_when, '')
    runway_label = {
        'none': 'no severance', 'lt_8w': 'less than 8 weeks of runway',
        '8_16w': '8-16 weeks of runway', '16w_plus': '16+ weeks of runway',
    }.get(a.severance_runway, '')

    return (
        f"You're a {level_label} {role_label}, laid off from {tier_label} "
        f"{when_label}, with {runway_label}. Here are the priorities I'd work "
        f"in your order, based on what tends to actually move the needle in "
        f"week 1 vs. what feels productive but isn't."
    )


def _pick_first_topic(a: TriageAnswers) -> str:
    if a.visa_status == 'h1b' and a.laid_off_when in {'today', '1-7d', '8-30d'}:
        return 'visa'
    if a.severance_runway == 'none' and a.laid_off_when in {'today', '1-7d'}:
        return 'severance'
    if a.severance_runway in {'none', 'lt_8w'}:
        return 'finances'
    if a.top_concern == 'direction':
        return 'career_exploration'
    if a.resume_state in {'needs_rewrite', 'not_started', 'unsure'}:
        return 'resume'
    return 'networking'


def generate_plan(a: TriageAnswers) -> TriagePlan:
    actions: list[TriageActionItem] = []

    # Top priority — the one urgent thing.
    if a.visa_status == 'h1b' and a.laid_off_when in {'today', '1-7d', '8-30d'}:
        actions.append(_visa_action())
    elif a.severance_runway == 'none' and a.laid_off_when in {'today', '1-7d'}:
        actions.append(_negotiate_severance_action())
    elif a.severance_runway in {'none', 'lt_8w'}:
        actions.append(_unemployment_action())
    else:
        actions.append(_career_direction_action())

    # Layered actions, conditional.
    if a.severance_runway in {'none', 'lt_8w'} and not (
        a.severance_runway == 'none' and a.laid_off_when in {'today', '1-7d'}
    ):
        # If they didn't already get the negotiate-severance action, suggest unemployment regardless.
        if not any(x.title.startswith('File for unemployment') for x in actions):
            actions.append(_unemployment_action())

    if a.resume_state in {'needs_rewrite', 'not_started', 'unsure'}:
        actions.append(_resume_rewrite_action())

    if a.network_state in {'cold_contacts', 'limited', 'rebuild'}:
        actions.append(_networking_action())

    if a.top_concern == 'direction':
        actions.append(_direction_conversation_action())

    # Always-on: interview prep.
    actions.append(_interview_prep_action())

    # Cap at 8 and renumber.
    actions = actions[:8]
    for i, item in enumerate(actions, start=1):
        item.priority = i

    return TriagePlan(
        summary=_build_summary(a),
        suggested_first_topic=_pick_first_topic(a),
        actions=actions,
    )
