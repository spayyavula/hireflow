# LinkedIn Re-post — 48-72h Follow-up to Attempt #2 (post Thu 2026-05-28 or Fri 2026-05-29)

> **Context:** [Attempt #2](2026-05-26-linkedin-attempt-2.md) went live
> 2026-05-26. This is the 48-72h follow-up that the attempt #2
> execution timeline calls for at T+48h — a fresh post (not a reshare,
> not a quote-comment) that piggybacks on the algorithmic momentum
> from attempt #2 with a *different* angle.
>
> **Critical rule:** this is NOT a "reminder, in case you missed my
> post on Tuesday" post. The LinkedIn algorithm and your audience both
> punish that framing. It's a standalone post about a specific
> sub-topic, with the Hyrly link as the natural CTA.
>
> **Day/time:** Thursday 2026-05-28 or Friday 2026-05-29 morning,
> 8-10am PT. Skip Friday if attempt #2 over-performed (don't crowd a
> winning post). Skip both if attempt #2 under-performed below 100
> views — in that case, sit out 7-10 days and try a new hook entirely
> rather than doubling down in the same week.

---

## Pick the opener based on what happened in attempt #2's first 48h

Three openers below. Choose ONE based on the actual signal from
attempt #2. Don't ship a generic one; the whole point of waiting 48h is
that you now have new information to work with.

### Decision tree

```
Did attempt #2 generate any standout comment, DM, or user reaction?
  → Yes:  Opener A (user-quote lead)
  → No:   Did the funnel query show ≥ 5 triages with source LIKE 'li2%'?
            → Yes:  Opener B (funnel-data lead)
            → No:   Opener C (single-topic deep dive)
```

Opener A is strongest when it applies (real social proof beats anything
you can write). B works if the data is interesting. C is the
always-available fallback — sharpens a single topic from the attempt
#2 list into its own post.

---

## Opener A — Real user quote (use if attempt #2 generated one)

```
A laid-off engineer DM'd me this week after running the Hyrly triage:

"I was about to sign the severance offer Monday. The calculator gave me a $14k delta and the RSU acceleration ask. Sent the counter Tuesday. They came back at +$11k and accepted the RSU vest."

That's the whole reason this exists.

Most engineers don't counter because no one tells them they can — and the asks they should make aren't in any of the LinkedIn-era advice columns.

The non-cash levers most people miss:

→ RSU acceleration through end of quarter ($20-80k+ at senior+)
→ Extended ISO exercise window (90 days → 7-10 years costs the company nothing)
→ Pro-rated bonus
→ COBRA contribution for 3-6 months

Free calculator + the asks list: link in the first comment.

Tell a friend who's about to sign.
```

**Word count:** ~155. Preview-cut at *"That's the whole reason this exists."* — strong "see more" hook.

**Honesty note:** if the actual quote you got isn't this strong (most aren't), use the closest-to-real version you can while staying truthful. Don't invent. If the strongest you got is "this was helpful, thank you" — that's not enough for Opener A; fall through to B or C.

---

## Opener B — Funnel data lead (use if you have ≥5 triages with real signal)

```
72 hours after launching Hyrly properly: [N] laid-off engineers ran the triage.

Distribution of what came back as the #1 priority:

→ Severance negotiation: [X]%
→ H-1B 60-day timeline: [Y]%
→ Financial defense (COBRA, unemployment): [Z]%
→ The "what do I actually want next" question: [W]%

The "what do I actually want next" cluster surprised me most. The conventional advice is to start applying immediately. The triage is telling people in [W]% of cases that the bigger lever is sitting with that question for 1-2 weeks before opening LinkedIn.

If you or someone you know is in any of these four buckets, the playbook for each is at the link in the first comment.

Built solo from San Jose. Free. No signup. Tell a friend who needs it.
```

**Word count:** ~170.

**Reality-check the data before posting:** at attempt #2's scale you'll likely have 5-15 triages. The percentages are noisy at that N. Acceptable framing if N ≥ 5 and the top category is at least 2x the second. If the data is muddier than that, don't post this version — the audience reads "[N]=6 triages" as suspiciously small and the post does more harm than good. Fall through to Opener C.

**Pre-post query to populate [X][Y][Z][W]:**

```sql
SELECT (plan->>'suggested_first_topic') AS topic,
       COUNT(*)                          AS n,
       ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 0) AS pct
FROM triage_responses
WHERE source LIKE 'li2%'
GROUP BY topic
ORDER BY n DESC;
```

Schema reference: `triage_responses.plan` is JSONB (see
[008_triage.sql](../../backend/supabase/migrations/008_triage.sql) +
[schemas.py:591](../../backend/api/models/schemas.py)).
`suggested_first_topic` is the pre-computed top priority and is one of:
`severance | visa | resume | career_exploration | finances |
networking`.

Map to the post-copy labels:
- `severance` → "Severance negotiation"
- `visa` → "H-1B 60-day timeline"
- `finances` → "Financial defense (COBRA, unemployment)"
- `career_exploration` → "The 'what do I actually want next' question"
- `resume` / `networking` — if either of these tops the chart at
  attempt #2 scale, the post's premise (that engineers are doing the
  wrong things) is actually undercut by your own data. Don't use
  Opener B in that case; fall through to Opener C.

---

## Opener C — Single-topic deep dive (always-available fallback)

Three variants — pick the one that hasn't been covered by attempt #2
or the 2026-05-21 severance posts. **Recommended: C1 (H-1B 60-day).**
That's the angle with the least surface coverage so far and the
clearest unique-wedge story for Hyrly.

### C1 — H-1B 60-day window (recommended)

```
If you're on H-1B and just got laid off, you don't have 90 days. You have 60.

The 60-day grace period starts the day after your last day of work — not the day you sign the separation agreement, not your termination "effective date" on paper. The Department of State counts from the actual end of payroll.

What most H-1B engineers do in those 60 days:

→ Day 1-7: panic-apply to 100 jobs, most of which don't sponsor
→ Day 30: realize the timeline is half-gone
→ Day 45: scramble for a B-2 conversion or change-of-status filing
→ Day 60: leave or fall out of status

What you should do:

→ Day 1: file unemployment (yes, you can — H-1B doesn't bar UI)
→ Day 1-3: filter your applications to confirmed sponsors only
→ Day 7: file the I-539 change-of-status if you need the buffer time
→ Day 14: negotiate severance to extend your last day of work (paid leave extends the 60-day clock; severance pay alone doesn't)
→ Day 30: hire an immigration attorney if you don't have one ($800-2000, ROI is your visa status)

Built a free breakdown of the H-1B 60-day playbook + the unemployment / I-539 / severance-extension specifics. Link in the first comment.

Tell an H-1B colleague who just got the news.
```

**Word count:** ~245. Long for LinkedIn but the H-1B audience reads everything because the stakes are absolute (visa status). Preview-cut at *"You don't have 90 days. You have 60."* — strong hook.

### C2 — Unemployment-filing timing

```
File unemployment the day you get laid off. Not the week after.

In 6 of the 8 US tech-heavy states (CA, WA, TX, MA, NY, IL, CO, NC), there's a "waiting week" before benefits start. Filing 5 days late on a $1,400/week claim = $1,000+ left on the table.

A few things engineers consistently get wrong:

→ "I have severance, I'll file when it runs out." Wrong — most states reduce but don't eliminate benefits during severance; filing late just delays the benefit start date.

→ "I'm going to consult/freelance, I don't qualify." File anyway. Self-employment income gets reported as you earn it and benefits adjust; not filing means losing the safety net entirely.

→ "It's only $X/week, not worth my time." Compounded over a 26-week claim, it's $10-25k. Half a day of paperwork.

→ "I was let go for cause." File anyway and let the determination process decide. ~70% of "for cause" denials are reversed on appeal.

The 90-day playbook breaks the unemployment math down state-by-state. Link in the first comment.
```

**Word count:** ~210.

### C3 — COBRA vs marketplace decision tree

```
Most laid-off engineers default to COBRA. It's the wrong call for 60-70% of them.

The math:

→ COBRA: full unsubsidized premium ($600-1,800/mo for a family of 4 at typical tech-company plans). Tax-deductible only if you're itemizing.

→ ACA marketplace: variable, but for a household with no W-2 income during the gap, often $200-600/mo for comparable coverage, AND the premium tax credit applies to most engineers who go 4+ months between jobs.

Decision factors:

→ Healthy + no scheduled procedures → ACA almost always wins
→ Mid-cycle on a specialty drug or surgery → COBRA continuity may be worth the cost
→ Family-of-4 + chronic conditions → run the numbers both ways
→ Marketplace deadline: 60 days from job loss for the "special enrollment period." Miss it and you're locked out until November.

Average miscalculation I've seen: $5-15k over the gap period.

Built a 90-day playbook that covers this with worked examples. Link in the first comment.
```

**Word count:** ~210.

---

## First comment (post immediately after, then pin)

The pinned comment changes slightly depending on which opener you used.
The first link is the call-to-action that matches the post's topic; the
other two are secondary hooks.

### If Opener A or C1 (calculator/H-1B headline):

```
Link: https://hyrly.ai/?src=li2r

If you want the specific tool:
→ Severance calculator: hyrly.ai/tools/severance?src=li2r-sev
→ H-1B 60-day breakdown: hyrly.ai/laid-off-h1b?src=li2r-h1b

Triage is 3 minutes, anonymous. Same as before.
```

### If Opener B (funnel data) or C2/C3 (unemployment/COBRA):

Same comment, but reorder so the most-likely matching tool appears first:

```
Link: https://hyrly.ai/?src=li2r

The triage will rank your top 3-4 priorities; the playbook articles for each are linked from there. If you already know your category:

→ Severance: hyrly.ai/tools/severance?src=li2r-sev
→ H-1B: hyrly.ai/laid-off-h1b?src=li2r-h1b
→ Full playbook index: hyrly.ai/playbook?src=li2r-playbook
```

---

## Tag table

| Tag | Where it appears | What it measures |
|---|---|---|
| `li2r` | Bare hyrly.ai link | Re-post top-of-funnel — compare to `li2` to measure follow-up reach |
| `li2r-sev` | Severance calc link | Whether the re-post drove severance-cohort clicks distinct from attempt #2 |
| `li2r-h1b` | H-1B landing page link | Whether the re-post drove H-1B-cohort clicks |
| `li2r-playbook` | Playbook index link | (Only if Opener B or C2/C3.) Whether the broader playbook framing drives clicks vs. tool-specific framing |

The key comparison after 24h: does `li2r` total triages exceed 20-30%
of `li2` total triages? If yes, follow-up posts are worth the effort
as a permanent pattern. If `li2r` is <10% of `li2`, the re-post format
is yielding diminishing returns and the next swing should be a fresh
post on a different surface (e.g. Reddit, Hacker News, a newsletter)
rather than another LinkedIn follow-up.

---

## Pre-flight checklist (do before posting)

- [ ] **Confirm attempt #2's actual reach and engaged-scout numbers** via the funnel query from attempt #2's doc. Pick the opener based on real signal, not a guess.
- [ ] **If using Opener A:** confirm the quoted user actually said something close to the quote. Soften specifics if you're paraphrasing. Never invent a quote.
- [ ] **If using Opener B:** run the priority-distribution query and verify N ≥ 5 and the top category is at least 2x the second. If not, switch to Opener C.
- [ ] **Image:** screenshot of whichever tool/page the opener references. For A or C1, the severance-calc or H-1B-page screenshot. For B, a chart-y screenshot if you can mock one cleanly (otherwise no image — a clean text post outperforms a forced image).
- [ ] **No DM pre-warming this time.** You burned that bullet on attempt #2; asking the same 8-12 friends to engage again 48-72h later is a goodwill tax. Let this post stand on its own with the residual algorithmic boost from attempt #2's engaged audience already in-network.
- [ ] **Verify `?src=li2r*` tagging end-to-end:** open `hyrly.ai/?src=li2r-preflight` in incognito, complete triage, click into Scout, send one message. Funnel query should show one row with `source = 'li2r-preflight'`.
- [ ] **Block 60 minutes after posting** for replies. Half of attempt #2's; this is a smaller event.

---

## Execution timeline

```
T-15min   Open Supabase SQL Editor with the funnel query ready in
            a tab. (Same query as attempt #2 doc, change WHERE clause
            to: source LIKE 'li2%' OR source LIKE 'li2r%')
T-5min    Triple-check the post body has NO external link in the body
T+0       Post the body (+ image if using A or C1)
T+45-90s  Post the first comment with the tagged URLs → pin it
T+5-15m   Reply to every comment within 15 minutes. Substantive replies.
T+60m     Run the funnel query — any 'li2r%' rows? If so, comparison
            against 'li2' totals begins now.
T+24h     Compare li2r vs li2 totals. Decide: does the re-post format
            warrant a permanent cadence, or was attempt #2 the ceiling
            for this audience?
```

---

## What success looks like at this scale

The re-post is a sustaining post, not a launch event. Lower thresholds
apply:

- **Re-post reach ≥ 30% of attempt #2's reach** — for a 48-72h follow-up, this means the algorithm is still treating your account as "interesting this week" and the post isn't being suppressed as redundant.
- **2+ triages tagged `source LIKE 'li2r%'`** — confirms the follow-up format converts at all.
- **1+ scout session tagged `source LIKE 'li2r%'`** — confirms the funnel still works after attempt #2 captured the easy wins.
- **Any new outside-network reshare** — bonus signal that the topic-deep-dive format reaches different people than the contrarian-thesis hook did.

If only the first metric hits and the rest are zero, the re-post
captured impressions but not action — that's a sign the audience has
moved on from "laid-off engineers in your network" and future LinkedIn
swings need to either find a new in-network angle or move to a
different channel.

---

## Anti-patterns

- **Don't** frame the re-post as a reminder of attempt #2 (*"In case you missed my post Tuesday..."*). Algorithm penalty + audience rolls eyes.
- **Don't** quote-reshare your own attempt #2 post inside this one. That's a separate (weaker) move you already did at T+30m. Doing it again at T+48-72h is over-leveraged.
- **Don't** reuse the exact attempt #2 hook line. The "Most laid-off engineers spend week 1 doing the wrong things" line is now associated with attempt #2 in your audience's heads; reusing it reads as recycling.
- **Don't** add the launch-grade pre-warm DMs again. Use that move for genuinely fresh launches (attempt #3 with a new hook, a new product, a new tool), not a 48-72h follow-up.
- **Don't** post if attempt #2 underperformed at <100 views. The right move then is sitting out 7-10 days and trying a fundamentally different hook (Hook C product-first per attempt #2's escalation plan), not piling another post into a dead window.
