"""LP2 layoff-tuned Scout handlers.

Five hand-written domain handlers (visa, severance, finances, resume,
career_direction) plus an intent detector and an opening builder. Used
only by the new /api/scout/sessions endpoints — the existing /api/scout/chat
flow still routes to backend/api/services/scout.py (general career coaching)
unchanged.

Handlers take (profile: dict, conversation: list) and return a plain-text
response (newlines for paragraph breaks; no markdown). Responses are
~3-5 paragraphs and end with a specific follow-up question to keep the
conversation moving.
"""

from __future__ import annotations


# ─── Intent detection ────────────────────────────────────────

# Keyword sets per intent. Lowercased substring matching against the
# user's last message. Order matters — visa first because 'h-1b' is more
# specific than 'next' or 'role'. Generic falls through.
INTENT_KEYWORDS = [
    ('visa', [
        'h-1b', 'h1b', '60 day', '60-day', 'grace period', 'sponsor',
        'opt', 'h-4', 'h4', 'f-1', 'f1 visa', 'visa', 'immigration',
        'ac-21', 'ac21', 'b-2', 'b2 visitor',
    ]),
    ('severance', [
        'severance', 'package', 'negotiate', 'rsu', 'restricted stock',
        'bonus', 'non-compete', 'noncompete', 'counter-offer', 'counter offer',
        'offer', 'unvested', 'iso ', 'iso?', 'cobra contribution', 'outplacement',
    ]),
    ('finances', [
        'unemployment', 'file ui', 'cobra', 'savings', 'runway', '401k',
        '401(k)', 'rent', 'money', 'budget', 'subscriptions',
        "can't afford", 'health insurance', 'marketplace', 'aca',
    ]),
    ('resume', [
        'resume', 'cv', 'headline', 'linkedin profile', 'linkedin headline',
        'opentowork', 'open to work', 'profile rewrite',
    ]),
    ('career_direction', [
        'what should i do', 'what do i want', 'next role', 'pivot',
        'career', 'direction', 'burnout', 'tired of', "don't know",
        'figure out', 'thinking about', 'values',
        # Independent / entrepreneurial paths route here too — they're a
        # "what do I want next" question even if the user already has an
        # answer in mind. Without these keywords "I want to become an
        # entrepreneur" falls through to generic and shows the menu again.
        'entrepreneur', 'startup', 'start a company', 'start a business',
        'my own company', 'my own business', 'my own thing',
        'consulting', 'freelance', 'freelancing', 'solopreneur',
        'be my own boss', 'founding', 'go independent',
    ]),
]


# Subset of the career_direction keywords that specifically signal the
# user wants to go independent (found / consult / freelance). Used by
# build_career_direction_response to switch the framing — the default
# "90-min walk + 3 questions" copy is built for users picking a next
# salaried role and reads as evasive to someone who's already named
# their direction.
_ENTREPRENEUR_TERMS = (
    'entrepreneur', 'startup', 'start a company', 'start a business',
    'my own company', 'my own business', 'my own thing',
    'consulting', 'freelance', 'freelancing', 'solopreneur',
    'be my own boss', 'founding', 'go independent',
)


def _mentions_entrepreneurship(conversation: list) -> bool:
    """True if the most recent user message names an independent path."""
    if not conversation:
        return False
    for msg in reversed(conversation):
        if msg.get('role') != 'user':
            continue
        text = (msg.get('content') or '').lower()
        return any(term in text for term in _ENTREPRENEUR_TERMS)
    return False


def _last_scout_topic(conversation: list) -> str | None:
    """Inspect the most recent scout message to infer prior topic."""
    for msg in reversed(conversation or []):
        if msg.get('role') != 'scout':
            continue
        text = msg.get('content', '').lower()
        for intent, kws in INTENT_KEYWORDS:
            if any(kw in text for kw in kws):
                return intent
        return None
    return None


def detect_layoff_intent(content: str, conversation: list) -> str:
    """Return one of 'visa' | 'severance' | 'finances' | 'resume' |
    'career_direction' | 'generic'."""
    text = (content or '').lower()
    for intent, kws in INTENT_KEYWORDS:
        if any(kw in text for kw in kws):
            return intent
    # Short follow-ups inherit the previous topic.
    if len(text.split()) <= 6:
        prior = _last_scout_topic(conversation)
        if prior:
            return prior
    return 'generic'


# ─── Profile label helpers ───────────────────────────────────

def _level_label(profile: dict) -> str:
    return {
        'junior': 'Junior', 'mid': 'Mid-level', 'senior': 'Senior',
        'staff_plus': 'Staff+/Director',
    }.get(profile.get('level'), '')


def _role_label(profile: dict) -> str:
    return {
        'engineer': 'engineer', 'em': 'engineering manager', 'pm': 'PM',
        'designer': 'designer', 'data': 'data professional', 'other': 'professional',
    }.get(profile.get('role'), 'professional')


def _short_runway(profile: dict) -> bool:
    return profile.get('severance_runway') in {'none', 'lt_8w'}


def _recent_layoff(profile: dict) -> bool:
    return profile.get('laid_off_when') in {'today', '1-7d', '8-30d'}


# ─── Domain handlers ─────────────────────────────────────────

def build_visa_response(profile: dict, conversation: list) -> str:
    level = _level_label(profile)
    role = _role_label(profile)
    visa = profile.get('visa_status', '')
    when = profile.get('laid_off_when', '')

    opening = (
        f"The H-1B 60-day rule is the most time-bound thing on your plate right now. "
        f"From your last day, you have 60 calendar days (not business days) to either "
        f"have a new H-1B petition filed on your behalf, change to a different status "
        f"(B-2, F-1, H-4), or leave the country. Day 61 starts unlawful presence — "
        f"which has long-tail consequences you genuinely don't want to deal with."
    )

    middle = (
        f"For most {level} {role}s I've seen go through this, the path that works is "
        f"AC-21 portability: a new employer files an H-1B transfer petition, and the "
        f"moment USCIS issues the receipt (not the approval — the receipt), you can "
        f"start working under that employer. Premium processing is $2,805 and gets "
        f"you to a receipt in 15 business days. If you're not in active offer "
        f"conversations by day 30, file an I-539 for B-2 visitor status as a backstop "
        f"— it stops the clock while it adjudicates."
    )

    nudge = ""
    if visa == 'h1b' and when in {'today', '1-7d'}:
        nudge = (
            "\n\nGiven you were laid off in the last week, the highest-leverage thing "
            "you can do today is two things: (1) pull your I-94, I-797 history, and "
            "any I-140 docs into one folder, and (2) book a 30-minute call with an "
            "immigration attorney this week. Most do consults for $0-200."
        )

    pointer = (
        "\n\nThe deep version of this is in the playbook — "
        "https://hyrly.ai/playbook/h1b-60-day-grace-period covers the four paths in "
        "detail (AC-21, B-2, F-1 reactivation, H-4 with EAD), what to tell recruiters, "
        "and a vetted attorney shortlist."
    )

    close = "\n\nWant me to walk through which of the four paths fits your specific situation, or would it help to talk through what to tell recruiters first?"

    return opening + "\n\n" + middle + nudge + pointer + close


def build_severance_response(profile: dict, conversation: list) -> str:
    level = _level_label(profile)
    short_run = _short_runway(profile)

    opening = (
        "First thing: don't sign anything for the next 48-72 hours, no matter what "
        "the deadline on the document says. The first offer is almost never the "
        "final number — companies expect counter-offers and HR usually has "
        "authority to improve the package within a defined band. About 60-70% of "
        "engineers don't counter at all, which is the asymmetry you can benefit from."
    )

    middle = (
        f"For a {level}-level package, the highest-value items to negotiate are "
        f"usually not the cash duration but the non-cash terms: RSU acceleration "
        f"through the end of the current quarter (often worth $20-80k+ at senior "
        f"levels), pro-rated bonus, COBRA contribution for 3-6 months, and an "
        f"extended post-termination ISO exercise window (default is 90 days; many "
        f"companies will extend to 7-10 years if you ask, costing them nothing). "
        f"If your package is above $20k total value, hire an employment attorney to "
        f"review for $400-800 — the ROI is typically 5-20×."
    )

    leverage = (
        "\n\nLeverage factors that meaningfully shift the package: tenure 4+ years, "
        "age 40+ (ADEA/OWBPA protection), recent FMLA or pregnancy, a group layoff "
        "of 50+ people (WARN Act exposure), unvested equity worth more than the "
        "cash offer, or anything resembling discriminatory pattern. If any of "
        "those apply, the attorney conversation isn't optional."
    )

    if short_run:
        leverage += (
            " Given runway is tight, the severance negotiation is also your single "
            "biggest cash-flow lever right now — 2-4 extra weeks plus an RSU "
            "acceleration ask is often $15-40k of real money."
        )

    pointer = (
        "\n\nThe full priority list with scripts and the 8 leverage factors is at "
        "https://hyrly.ai/playbook/negotiate-severance-tech-layoff."
    )

    close = "\n\nWant me to help draft the actual counter-offer email, or walk through which leverage factors apply to your situation first?"

    return opening + "\n\n" + middle + leverage + pointer + close


def build_finances_response(profile: dict, conversation: list) -> str:
    level = _level_label(profile)
    short_run = _short_runway(profile)

    opening = (
        "The cash-flow piece is the most fixable thing on your list this week. "
        "Three actions, in order: file for unemployment today (even if you have "
        "severance — weekly UI benefits stack to $5-15k over a multi-month search, "
        "and the 1-3 week processing delay means filing now maximizes the total), "
        "compare COBRA vs marketplace before electing (the default-to-COBRA mistake "
        "typically costs $5-15k over 6 months at most income brackets), and audit "
        "your recurring subscriptions ($400-900/month is the average; cutting half "
        "of that adds a full month of runway every 7 months)."
    )

    middle = (
        f"For the marketplace question specifically: the post-ARPA subsidies cap "
        f"premiums at 8.5% of your projected annual income, no 400% FPL cliff. A "
        f"{level} engineer projecting $80k-150k for the year often pays $300-600/month "
        f"on a Silver plan vs $900-1,500/month on COBRA. The exceptions where COBRA "
        f"wins are real — mid-treatment, specialty drugs, narrow networks — but "
        f"they're the exception, not the default."
    )

    runway_note = ""
    if short_run:
        runway_note = (
            "\n\nGiven runway is tight, also pull up your 401(k) — taxable brokerage "
            "and HYSA come first if you need cash, then 401(k) loans if your plan "
            "offers them. Early withdrawals are last. Don't touch tax-advantaged "
            "accounts until the cheaper options are exhausted."
        )

    pointer = (
        "\n\nThe full week-1 financial sequence is at "
        "https://hyrly.ai/playbook/just-got-laid-off-week-1-plan. The COBRA-vs-"
        "marketplace math (with three worked income-bracket examples) is at "
        "https://hyrly.ai/playbook/cobra-vs-marketplace-insurance."
    )

    close = "\n\nWant to walk through your specific runway calc together, or focus on the COBRA-vs-marketplace decision first?"

    return opening + "\n\n" + middle + runway_note + pointer + close


def build_resume_response(profile: dict, conversation: list) -> str:
    level = _level_label(profile)
    role = _role_label(profile)
    state = profile.get('resume_state', '')

    opening = (
        "Two things up front, both contrarian to the standard advice: (1) don't "
        "update your resume on day 1 — wait until day 5 or 6, after you've sent "
        "the first batch of warm-network DMs and have a sense of where you're "
        "aiming. The 'I need to perfect my resume before I do anything' instinct "
        "is procrastination dressed as productivity. (2) Don't enable the LinkedIn "
        f"'#OpenToWork' badge yet, especially at the {level} level — the green ring "
        "has flipped from helpful to harmful at senior+ in 2024-2026."
    )

    middle = (
        f"What to update when you do, around day 5-7: the headline should be the "
        f"role you want next, not 'in transition' or 'open to work' (recruiter "
        f"searches deprioritize those phrases). Something like '{level} {role.title()} "
        f"| AI Infra & Distributed Systems' converts much better than 'Looking for "
        f"my next opportunity 💼'. Update the About section to 2-4 sentences with "
        f"one specific call-to-action. Update the experience end-date on your last "
        f"role to the layoff date; rewrite the bullets in past tense and emphasize "
        f"shipped + measurable impact over responsibilities."
    )

    if state in {'not_started', 'unsure'}:
        middle += (
            " If you don't have a recent resume version at all, the fastest path "
            "is: paste your old one into a doc, find a JD for a role you'd want, "
            "and rewrite the top third to match its keyword profile. Don't try to "
            "perfect the whole thing in one sitting."
        )

    pointer = (
        "\n\nThe full LinkedIn protocol — what to post, when, what NOT to post, "
        "three announcement templates — is at "
        "https://hyrly.ai/playbook/linkedin-opentowork-after-layoff. The week-1 "
        "version of where resume work fits in the sequence is at "
        "https://hyrly.ai/playbook/just-got-laid-off-week-1-plan."
    )

    close = "\n\nWant a draft headline tuned to your target role, or help with the announcement post template first?"

    return opening + "\n\n" + middle + pointer + close


def build_career_direction_response(profile: dict, conversation: list) -> str:
    level = _level_label(profile)
    role = _role_label(profile)

    entrepreneur = _mentions_entrepreneurship(conversation)

    if entrepreneur:
        opening = (
            "Going independent — founding, consulting, or freelancing — is a real "
            "path and the layoff is genuinely a good decision point for it. But it "
            "deserves a separate framing than 'find my next role': the constraints "
            "are different. Runway math matters more (think 12 months of expenses, "
            "not 3-6); your old comp anchor matters less; and the first 6 months "
            "look nothing like a salaried job. The honest first question is whether "
            "going independent is what you actually want, or what you think you "
            "should want after a layoff. Plenty of people pick the second and burn "
            "12-18 months before admitting it."
        )
    else:
        opening = (
            "The 'what do I want next' question is the one that doesn't get solved by "
            "scrolling LinkedIn. It gets solved by getting bored enough that the answer "
            "surfaces on its own — which is a real strategy, not a cop-out. The biggest "
            "mistake people make in this state is to start mass-applying out of anxiety "
            "before they've actually decided what they're applying for. Three or four "
            "weeks later they have a pile of interview rejections and still don't know "
            "what they want."
        )

    middle = (
        f"What works concretely: a 90-minute walk with a notebook, no phone, no "
        f"computer. Three questions — write down whatever surfaces, don't edit: "
        f"(1) What did I actually love about my last {level} {role} role? Specific "
        f"moments, not job titles. (2) What did I quietly dread? Specific things, "
        f"again. (3) What would I genuinely regret not trying in the next five "
        f"years? This is the one most people skip; it's the most useful."
    )

    middle += (
        "\n\nAfter the walk, the second pass is the constraints check: comp floor, "
        "geo limits, family obligations, visa timeline if relevant. Then the third "
        "pass is the must-haves vs walk-aways list — what do you absolutely need "
        "your next role to have, and what would make you walk away from an offer. "
        "Most people skip step 3 and then say yes to the first compelling-looking "
        "offer that comes in. Step 3 is what stops that."
    )

    runway_long = profile.get('severance_runway') == '16w_plus'
    if runway_long:
        middle += (
            "\n\nGood news: with 16+ weeks of runway, you actually have the "
            "freedom to do this thinking honestly. Most people don't get this "
            "window — they have to take the first reasonable offer. Use it."
        )

    if entrepreneur:
        close = (
            "\n\nWant to walk through the runway math for going independent, "
            "or talk about which model (founding / consulting / freelancing) "
            "actually fits your situation first?"
        )
    else:
        close = "\n\nWant to start working through those three questions together right now, or talk through your specific must-haves and walk-aways first?"

    return opening + "\n\n" + middle + close


def build_generic_layoff_response(profile: dict, conversation: list) -> str:
    level = _level_label(profile)
    role = _role_label(profile)

    if conversation:
        opening = (
            "Happy to talk through whatever's on your mind right now. A few of "
            "the topics I can be most useful on:"
        )
    else:
        opening = (
            f"Hey — sorry you're dealing with this. I can help work through any "
            f"of the layoff-specific things a {level} {role} usually hits in the "
            f"first 30 days. A few I'm most useful on:"
        )

    options = (
        "\n\n• Visa & H-1B timing (the 60-day clock is the most time-bound thing)"
        "\n• Severance negotiation (the first offer is rarely the final number)"
        "\n• Finances (unemployment filing, COBRA, runway math)"
        "\n• Resume & LinkedIn (when to update, the green-ring badge trap)"
        "\n• Career direction (the 90-minute walk with three questions)"
    )

    close = "\n\nWhich one feels most pressing right now — or tell me in your own words?"

    return opening + options + close


# ─── Short openers ───────────────────────────────────────────
# The detailed handlers above fire on every follow-up message and are
# deliberately exhaustive. For the FIRST message of a session that's a
# wall of text on mobile and suppresses replies. Openers are tight
# (acknowledgment + single hook + question) so the user types back;
# the detailed handler then takes over once they engage.


def build_visa_opener(profile: dict) -> str:
    return (
        "The H-1B 60-day clock is the most time-bound thing on your plate right "
        "now — and it runs from your last day, not from when you find a new "
        "role. Day 61 starts unlawful presence, which has long-tail consequences "
        "you don't want to deal with.\n\n"
        "Three rough paths: AC-21 transfer to a new employer, change of status "
        "(B-2 / F-1 / H-4), or leave. Want me to walk through which one fits "
        "your situation, or talk through what to tell recruiters first?"
    )


def build_severance_opener(profile: dict) -> str:
    return (
        "Quick rule before anything else: don't sign the severance package for "
        "48-72 hours, no matter what deadline the document claims. The first "
        "offer is almost never the final number — 60-70% of engineers don't "
        "counter at all, which is the asymmetry you can benefit from.\n\n"
        "Want me to walk through the highest-value items to negotiate (RSU "
        "acceleration, ISO window, COBRA), or help you draft a counter-offer "
        "email first?"
    )


def build_finances_opener(profile: dict) -> str:
    level = _level_label(profile) or 'Senior'
    role = _role_label(profile)
    return (
        f"For a {level} {role}, the most fixable thing this week is cash flow. "
        "One action today: file for unemployment, even if you have severance. "
        "The processing delay means filing now maximizes your total payout — "
        "weekly UI stacks to $5-15k over a multi-month search.\n\n"
        "Want me to walk through the next priorities in order (COBRA vs "
        "marketplace, runway math, the 401(k) order), or is a different "
        "concern more urgent?"
    )


def build_resume_opener(profile: dict) -> str:
    level = _level_label(profile) or 'Senior'
    return (
        "Two pieces of contrarian advice up front: (1) don't update your resume "
        "on day 1 — wait until day 5-6, after you've sent the first batch of "
        f"warm-network DMs. (2) Don't enable LinkedIn's #OpenToWork badge yet, "
        f"especially at the {level} level — the green ring has flipped from "
        "helpful to harmful at senior+ in 2024-2026.\n\n"
        "Want me to explain why, or jump to what to actually update when you do?"
    )


def build_career_direction_opener(profile: dict) -> str:
    return (
        "The \"what do I want next\" question doesn't get solved by scrolling "
        "LinkedIn. The biggest trap is mass-applying out of anxiety before "
        "you've actually decided what you're applying for — three weeks later "
        "you have a stack of rejections and still don't know what you want.\n\n"
        "Want to walk through the 90-minute-walk exercise (three questions, no "
        "phone), or talk through your specific constraints first?"
    )


# ─── Opening builder ─────────────────────────────────────────

_CONCERN_TO_OPENER_TOPIC = {
    'finances': 'finances',
    'visa': 'visa',
    'direction': 'career_exploration',
}


def build_opening_response(profile: dict, suggested_first_topic: str | None) -> str:
    """First message sent by Scout when a session is created from a triage.

    Routes to a SHORT opener based on the triage's suggested_first_topic.
    Detailed handlers fire on follow-ups via route_message().

    The user's stated `top_concern` overrides when the plan would otherwise
    drop them into the generic menu (suggested_first_topic in {None,
    'networking', 'generic'}). The plan generator sometimes picks
    'networking' for healthy-runway users even when they told us finances
    was the issue — that route conflict was the root cause of the
    2026-05-21 launch's zero-engagement signal.
    """
    openers = {
        'visa': build_visa_opener,
        'severance': build_severance_opener,
        'finances': build_finances_opener,
        'resume': build_resume_opener,
        'career_exploration': build_career_direction_opener,
    }

    topic = suggested_first_topic
    if topic not in openers:
        concern = (profile.get('top_concern') or '').strip()
        topic = _CONCERN_TO_OPENER_TOPIC.get(concern)

    opener = openers.get(topic) if topic else None
    if opener is None:
        return build_generic_layoff_response(profile, [])
    return opener(profile)


# ─── Intent → handler dispatch ───────────────────────────────

def route_message(content: str, profile: dict, conversation: list) -> str:
    """Top-level entry from the message endpoint."""
    intent = detect_layoff_intent(content, conversation)
    handlers = {
        'visa': build_visa_response,
        'severance': build_severance_response,
        'finances': build_finances_response,
        'resume': build_resume_response,
        'career_direction': build_career_direction_response,
        'generic': build_generic_layoff_response,
    }
    handler = handlers.get(intent, build_generic_layoff_response)
    return handler(profile, conversation)
