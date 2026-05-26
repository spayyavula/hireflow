import pytest
from api.services.scout_layoff import (
    detect_layoff_intent,
    build_visa_response,
    build_severance_response,
    build_finances_response,
    build_resume_response,
    build_interview_prep_response,
    build_career_direction_response,
    build_generic_layoff_response,
    build_opening_response,
    build_visa_opener,
    build_severance_opener,
    build_finances_opener,
    build_resume_opener,
    build_career_direction_opener,
)


def _profile(**overrides):
    base = {
        'laid_off_when': '1-7d', 'role': 'engineer', 'level': 'senior',
        'company_tier': 'series_b_d', 'severance_runway': '8_16w',
        'visa_status': 'citizen_gc', 'location_flexibility': 'remote_us',
        'resume_state': 'needs_rewrite', 'network_state': 'cold_contacts',
        'top_concern': 'direction',
    }
    base.update(overrides)
    return base


@pytest.mark.unit
class TestIntentDetection:
    def test_visa_keywords_route_to_visa(self):
        assert detect_layoff_intent('what about my h-1b?', []) == 'visa'
        assert detect_layoff_intent('I have 60 days', []) == 'visa'
        assert detect_layoff_intent('grace period question', []) == 'visa'

    def test_severance_keywords_route_to_severance(self):
        assert detect_layoff_intent('how do I negotiate severance?', []) == 'severance'
        assert detect_layoff_intent('my RSU situation', []) == 'severance'
        assert detect_layoff_intent('the offer they gave me', []) == 'severance'

    def test_finances_keywords_route_to_finances(self):
        assert detect_layoff_intent('how do I file unemployment', []) == 'finances'
        assert detect_layoff_intent('COBRA is expensive', []) == 'finances'
        assert detect_layoff_intent("can I afford this on my runway", []) == 'finances'

    def test_resume_keywords_route_to_resume(self):
        assert detect_layoff_intent('should I update my resume', []) == 'resume'
        assert detect_layoff_intent('LinkedIn headline', []) == 'resume'

    def test_career_direction_keywords_route_to_career_direction(self):
        assert detect_layoff_intent('what should I do next', []) == 'career_direction'
        assert detect_layoff_intent('thinking about a pivot', []) == 'career_direction'
        assert detect_layoff_intent("don't know where I want to go", []) == 'career_direction'

    def test_interview_prep_keywords_route_to_interview_prep(self):
        # Stub handler — the only thing that matters here is "do NOT
        # dead-end on the generic menu" for the most common off-script
        # intent on layoffs.fyi-style audiences.
        assert detect_layoff_intent('how do I prep for my interview', []) == 'interview_prep'
        assert detect_layoff_intent('system design round next week', []) == 'interview_prep'
        assert detect_layoff_intent('any tips for the phone screen', []) == 'interview_prep'
        assert detect_layoff_intent('leetcode strategy', []) == 'interview_prep'
        assert detect_layoff_intent('I have an onsite tomorrow', []) == 'interview_prep'

    def test_entrepreneurship_keywords_route_to_career_direction(self):
        # Real user transcript: "I want to become an entrepreneur" was
        # falling through to 'generic' and rendering the same menu the
        # bot just offered, dead-ending the conversation.
        assert detect_layoff_intent('I want to become an entrepreneur', []) == 'career_direction'
        assert detect_layoff_intent('thinking about consulting', []) == 'career_direction'
        assert detect_layoff_intent('I want to start my own business', []) == 'career_direction'
        assert detect_layoff_intent('thinking about going freelance', []) == 'career_direction'
        assert detect_layoff_intent('want to be my own boss', []) == 'career_direction'

    def test_unmatched_routes_to_generic(self):
        assert detect_layoff_intent('hello', []) == 'generic'
        assert detect_layoff_intent('thanks for the help', []) == 'generic'

    def test_followup_uses_recent_topic(self):
        # "tell me more" with last Scout message about visa -> stays on visa
        conv = [
            {'role': 'user', 'content': 'h-1b stuff', 'ts': 't'},
            {'role': 'scout', 'content': 'On the H-1B side: you have 60 days...', 'ts': 't'},
        ]
        assert detect_layoff_intent('tell me more', conv) == 'visa'


@pytest.mark.unit
class TestHandlers:
    def test_visa_response_mentions_60_day_rule(self):
        out = build_visa_response(_profile(visa_status='h1b', laid_off_when='today'), [])
        assert '60' in out
        assert any(s in out.lower() for s in ['h-1b', 'h1b', 'grace period'])
        # references the playbook article
        assert '/playbook/h1b-60-day-grace-period' in out

    def test_severance_response_mentions_negotiation(self):
        out = build_severance_response(_profile(), [])
        assert 'severance' in out.lower()
        assert any(s in out.lower() for s in ['negotiate', 'counter', 'rsu', 'leverage'])
        assert '/playbook/negotiate-severance-tech-layoff' in out

    def test_finances_response_mentions_unemployment_or_cobra(self):
        out = build_finances_response(_profile(severance_runway='lt_8w'), [])
        assert any(s in out.lower() for s in ['unemployment', 'cobra', 'runway', 'subscriptions'])
        assert any(s in out for s in ['/playbook/just-got-laid-off-week-1-plan', '/playbook/cobra-vs-marketplace-insurance'])

    def test_resume_response_mentions_active_search(self):
        out = build_resume_response(_profile(resume_state='needs_rewrite'), [])
        assert 'resume' in out.lower()
        assert '/playbook/linkedin-opentowork-after-layoff' in out or '/playbook/just-got-laid-off-week-1-plan' in out

    def test_interview_prep_response_routes_to_external_tools_and_pivots(self):
        # The stub MUST honestly disclaim (not Scout's wedge), point to
        # external best-in-class tools, and pivot back to readiness +
        # negotiation (where Scout still helps).
        out = build_interview_prep_response(_profile(), [])
        low = out.lower()
        # External recommendations (at least 2 of 3 should appear so the
        # stub is genuinely useful, not just disclaimer + dead-end)
        external_hits = sum(s in low for s in ['finalroundai', 'pramp', 'hellointerview'])
        assert external_hits >= 2, f"expected ≥2 external tool refs, got {external_hits}"
        # Pivot to Scout's actual wedge
        assert any(s in low for s in ['ready', 'negotiat', 'offer'])
        # Honest framing — this is NOT a "Scout knows interview prep" response
        assert any(s in low for s in ['outside', 'not', 'sharper than']) or 'wedge' in low

    def test_career_direction_response_mentions_values_or_walk(self):
        out = build_career_direction_response(_profile(top_concern='direction'), [])
        assert any(s in out.lower() for s in ['walk', 'values', 'regret', 'love'])

    def test_career_direction_response_branches_for_entrepreneurship(self):
        # When the user explicitly named going independent, the response
        # should acknowledge that direction instead of restating "what do
        # you want?" — that framing reads as evasive to a user who's
        # already told us what they want.
        conv = [{'role': 'user', 'content': 'I want to become an entrepreneur'}]
        out = build_career_direction_response(_profile(top_concern='direction'), conv)
        assert any(s in out.lower() for s in ['independent', 'founding', 'consulting', 'freelancing'])
        assert 'runway' in out.lower()
        # The default 90-min-walk framing should NOT lead; user already
        # picked a direction.
        default = build_career_direction_response(_profile(top_concern='direction'), [])
        assert out != default

    def test_career_direction_entrepreneur_branch_still_ends_with_question(self):
        conv = [{'role': 'user', 'content': 'thinking about consulting full-time'}]
        out = build_career_direction_response(_profile(), conv)
        assert out.rstrip().endswith('?')

    def test_handlers_personalize_on_level(self):
        out_jr = build_severance_response(_profile(level='junior'), [])
        out_sr = build_severance_response(_profile(level='senior'), [])
        # The two responses should differ (level is part of personalization)
        assert out_jr != out_sr

    def test_generic_layoff_response_is_kind_and_offers_options(self):
        out = build_generic_layoff_response(_profile(), [])
        assert len(out) > 100
        # offers structured next-step options
        assert any(s in out.lower() for s in ['visa', 'severance', 'finances', 'resume', 'direction'])

    def test_each_handler_ends_with_a_question(self):
        for fn in [build_visa_response, build_severance_response, build_finances_response,
                   build_resume_response, build_interview_prep_response,
                   build_career_direction_response, build_generic_layoff_response]:
            out = fn(_profile(), [])
            assert out.rstrip().endswith('?'), f"{fn.__name__} doesn't end with a question"


@pytest.mark.unit
class TestOpeningBuilder:
    def test_opening_uses_suggested_first_topic_visa(self):
        out = build_opening_response(_profile(visa_status='h1b', laid_off_when='today'),
                                     suggested_first_topic='visa')
        assert any(s in out.lower() for s in ['h-1b', 'h1b', '60'])

    def test_opening_uses_suggested_first_topic_severance(self):
        out = build_opening_response(_profile(severance_runway='none', laid_off_when='today'),
                                     suggested_first_topic='severance')
        assert 'severance' in out.lower()

    def test_opening_acknowledges_user_situation(self):
        # First-line should reference the user's situation
        out = build_opening_response(_profile(role='engineer', level='senior'),
                                     suggested_first_topic='finances')
        assert any(s in out.lower() for s in ['senior', 'engineer'])

    def test_opening_with_no_topic_uses_generic(self):
        # Profile's top_concern='direction' would normally map to the career
        # opener; pass a concern that doesn't map so we exercise the generic
        # fallback specifically.
        out = build_opening_response(
            _profile(top_concern='other'), suggested_first_topic=None,
        )
        assert len(out) > 100

    def test_opening_uses_user_concern_when_plan_picks_networking(self):
        # The route conflict that caused 0/11 engagement on 2026-05-21: the
        # plan generator picked 'networking' for a healthy-runway EM whose
        # stated concern was 'finances'. Scout should honor the user's voice.
        out = build_opening_response(
            _profile(top_concern='finances', severance_runway='8_16w',
                     role='em', level='senior'),
            suggested_first_topic='networking',
        )
        assert len(out) < 800
        assert any(s in out.lower() for s in ['unemployment', 'cash flow', 'cobra'])

    def test_opening_user_concern_does_not_override_specific_plan_topic(self):
        # When the plan picks a specific opener topic (e.g. 'visa' for an
        # H-1B user nearing day 60), that should win over a stated concern
        # like 'finances' — the plan has visibility into urgency the user
        # may not have flagged.
        out = build_opening_response(
            _profile(top_concern='finances', visa_status='h1b',
                     laid_off_when='today'),
            suggested_first_topic='visa',
        )
        assert any(s in out.lower() for s in ['h-1b', 'h1b', '60'])


@pytest.mark.unit
class TestShortOpeners:
    """Openers must be short enough to read on a phone screen without scrolling
    past the input. Detailed handlers (build_*_response) stay long for
    follow-ups; these openers are deliberately ~600-800 chars."""

    OPENERS = [
        build_visa_opener,
        build_severance_opener,
        build_finances_opener,
        build_resume_opener,
        build_career_direction_opener,
    ]

    def test_all_openers_under_800_chars(self):
        for fn in self.OPENERS:
            out = fn(_profile())
            assert len(out) < 800, f"{fn.__name__} is {len(out)} chars — too long for mobile opener"

    def test_all_openers_end_with_a_question(self):
        for fn in self.OPENERS:
            out = fn(_profile()).rstrip()
            assert out.endswith('?'), f"{fn.__name__} doesn't end with a question"

    def test_openers_have_no_playbook_url_in_first_message(self):
        # The opener's job is to make the user reply, not to dump links.
        # Playbook URLs surface in the detailed follow-up handlers.
        for fn in self.OPENERS:
            out = fn(_profile())
            assert '/playbook/' not in out, f"{fn.__name__} dumps a playbook URL in the opener"

    def test_opening_response_routes_to_short_opener_for_finances(self):
        out = build_opening_response(_profile(), suggested_first_topic='finances')
        # Short opener (< 800 chars) NOT the detailed response (which is ~1800)
        assert len(out) < 800
        # Still acknowledges level (existing test contract)
        assert any(s in out.lower() for s in ['senior', 'engineer'])
