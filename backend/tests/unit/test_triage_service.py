import pytest
from api.models.schemas import TriageAnswers
from api.services.triage import generate_plan


def _base_answers(**overrides) -> TriageAnswers:
    """Sensible defaults; tests override only what they care about."""
    defaults = dict(
        laid_off_when='1-7d',
        role='engineer',
        level='senior',
        company_tier='series_b_d',
        severance_runway='8_16w',
        visa_status='citizen_gc',
        location_flexibility='remote_us',
        resume_state='needs_rewrite',
        network_state='cold_contacts',
        top_concern='direction',
    )
    defaults.update(overrides)
    return TriageAnswers(**defaults)


@pytest.mark.unit
class TestTriageGenerator:

    def test_h1b_recent_layoff_visa_is_top_priority(self):
        ans = _base_answers(visa_status='h1b', laid_off_when='today')
        plan = generate_plan(ans)
        assert plan.actions[0].title.startswith('H-1B 60-day grace')
        assert plan.suggested_first_topic == 'visa'

    def test_no_severance_recent_layoff_negotiate_first(self):
        ans = _base_answers(severance_runway='none', laid_off_when='today')
        plan = generate_plan(ans)
        assert 'severance' in plan.actions[0].title.lower()
        assert plan.suggested_first_topic == 'severance'

    def test_low_runway_unemployment_first(self):
        ans = _base_answers(severance_runway='lt_8w', laid_off_when='8-30d')
        plan = generate_plan(ans)
        assert 'unemployment' in plan.actions[0].title.lower()

    def test_long_runway_direction_career_conversation_first(self):
        ans = _base_answers(severance_runway='16w_plus', top_concern='direction')
        plan = generate_plan(ans)
        assert 'scout' in plan.actions[0].title.lower() or 'direction' in plan.actions[0].title.lower()
        assert plan.suggested_first_topic == 'career_exploration'

    def test_resume_rewrite_appears_when_needed(self):
        ans = _base_answers(resume_state='needs_rewrite')
        plan = generate_plan(ans)
        titles = [a.title.lower() for a in plan.actions]
        assert any('resume' in t for t in titles)

    def test_no_resume_action_when_already_up_to_date(self):
        ans = _base_answers(resume_state='up_to_date')
        plan = generate_plan(ans)
        titles = [a.title.lower() for a in plan.actions]
        assert not any('resume' in t and 'rewrite' in t for t in titles)

    def test_networking_action_when_weak_network(self):
        ans = _base_answers(network_state='limited')
        plan = generate_plan(ans)
        titles = [a.title.lower() for a in plan.actions]
        assert any('network' in t or 'intro' in t for t in titles)

    def test_max_8_actions(self):
        ans = _base_answers(
            visa_status='h1b', laid_off_when='today', severance_runway='none',
            resume_state='not_started', network_state='rebuild', top_concern='direction',
        )
        plan = generate_plan(ans)
        assert len(plan.actions) <= 8

    def test_priority_numbers_are_sequential(self):
        ans = _base_answers()
        plan = generate_plan(ans)
        priorities = [a.priority for a in plan.actions]
        assert priorities == list(range(1, len(priorities) + 1))

    def test_summary_mentions_role_level_when(self):
        ans = _base_answers(role='engineer', level='senior', laid_off_when='1-7d')
        plan = generate_plan(ans)
        s = plan.summary.lower()
        assert 'senior' in s and ('engineer' in s or 'eng' in s)
        assert 'week' in s or 'day' in s

    def test_actions_have_nonempty_strings(self):
        ans = _base_answers()
        plan = generate_plan(ans)
        for a in plan.actions:
            assert a.title.strip(), f"empty title in {a}"
            assert a.why.strip(), f"empty why in {a}"
            assert a.how.strip(), f"empty how in {a}"
            assert a.eta.strip(), f"empty eta in {a}"
