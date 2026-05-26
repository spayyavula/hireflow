# LinkedIn Launch — Attempt #2 (post Tue 2026-05-26)

> **Context:** [Attempt #1](2026-05-21-linkedin-launch.md) on 2026-05-21
> shipped with the link in the post body, which LinkedIn aggressively
> suppresses (50-80% reach reduction). Result: 40 views, 1 real user
> triage, 0 Scout sessions. The product converted at 1/40 from a network
> of mostly amplifiers; the distribution didn't reach the ICP.
>
> **This is a fresh post, not a re-post.** Different hook (contrarian
> thesis instead of personal-vulnerable), different structural rules
> (link in first comment, never the body), pre-warmed audience via DM.
>
> **Day/time:** Tuesday or Wednesday, **8-10am PT**. Avoid Monday
> (low algorithm activity) and Friday afternoons (everyone is in
> wind-down mode). Match the day in 2-3 weeks for attempt #3 if needed.

---

## The post (body only — NO link in this text)

```
Most laid-off engineers spend week 1 doing the wrong things.

LinkedIn redesign. Resume perfectionism. Mass-applying out of panic.

I watched it happen to ~30 friends over two years. Same pattern every time.

The actually-important week-1 things:

→ H-1B 60-day clock (if you're on H-1B)
→ Negotiate the severance offer (the first one is rarely the final number)
→ File for unemployment this week (the backlog matters)
→ Run the COBRA vs marketplace math (off by $5-15k for most people)
→ Honestly think about what you want next (the part everyone skips)

No tool existed that helped engineers with any of this in a single place. So I built one.

I'll drop the link in the first comment — LinkedIn algorithmically buries posts with external URLs in the body.

Built solo from San Jose. Free. No signup. If it helps you, tell me what to fix.

Tell a friend who needs it.
```

**Word count:** ~190. Preview-cut at *"Most laid-off engineers spend week 1 doing the wrong things."* — strong standalone hook.

---

## First comment (post immediately after, then pin)

```
Link: https://hyrly.ai/?src=li2

Triage is 3 minutes, anonymous. The severance calculator is at hyrly.ai/tools/severance?src=li2-sev if you're mid-negotiation. And the H-1B 60-day breakdown is at hyrly.ai/laid-off-h1b?src=li2-h1b.
```

Posting cadence: post the main body, wait 30-60 seconds, post this comment, then immediately pin it (... menu → "Pin to top"). The 30-60s gap matters — LinkedIn pattern-matches simultaneous post + comment as automation and rate-limits both.

### Why three separate `?src=` tags

Migration 010 added a `source` column to `triage_responses` and `scout_sessions`; the frontend captures `?src=` from the URL on first visit and persists it across the triage → scout funnel. Per-URL tags let us see *which link* drove engagement, not just "the attempt #2 post in aggregate":

| Tag | Where it appears | What it measures |
|---|---|---|
| `li2` | Bare hyrly.ai link in pinned comment | Top-of-funnel traffic; people who clicked the headline link |
| `li2-sev` | Severance calculator link | "Mid-negotiation" cohort — usually highest intent |
| `li2-h1b` | H-1B landing page link | H-1B cohort — measures whether the visa angle is a real wedge |

If one tag dominates 5x over the others, that's a signal to lead with that angle in attempt #3. If they're roughly even, the post itself drove the conversions, not any specific link.

---

## Pre-flight checklist (do before posting)

- [ ] **Image:** screenshot of the homepage hero (`hyrly.ai/`, the "Just got laid off? / Don't update your resume yet." card). Take it on desktop at 1920x1080, crop to LinkedIn 1200x627. Attach to the main post.
- [ ] **Pre-warm DMs:** identify 8-12 close engineering friends/ex-coworkers. Send each a DM 30 minutes before posting: *"Posting attempt #2 of my Hyrly launch on LinkedIn at [time] — the first one underperformed because LinkedIn suppresses posts with external links. If you have a sec to leave a real comment in the first hour I'd really appreciate it. No worries if you're busy — and no need to reshare unless it actually resonates."*
- [ ] **Confirm hyrly.ai is live + working:** open in an incognito browser, run the triage end-to-end, confirm the Scout chat opens, confirm the severance calc loads. Trust but verify before sending traffic.
- [ ] **Confirm `?src=` tagging is live end-to-end:** open `hyrly.ai/?src=li2-preflight` in incognito, complete the triage, click into Scout, send one message. Then run the funnel query below — you should see one new triage row and one scout row, both with `source = 'li2-preflight'`. If the rows show `source = NULL`, the frontend or backend deploy did not include the source-capture wire and the entire attempt #2 data plan is broken. Fix before posting.
- [ ] **Have follow-up replies prepped** for the 4-5 likely first comments (see template below).
- [ ] **Block 90 minutes after posting** for reply discipline. The first 60-90 minutes of engagement is what the algorithm uses to decide reach.

---

## Reply templates for likely comments

### "This is great, where did you build it?"
```
Built solo in [language/stack — don't go too deep] over the last [N] weeks after watching too many friends go through the layoff cycle without a playbook. The Scout AI piece was the hardest part — most career AI is generic, and the laid-off context needs handlers for very specific situations (H-1B, severance negotiation, COBRA vs marketplace) that don't exist in any other tool.
```

### "Cool — does it work for [non-tech / international / different role]?"
```
Honest answer: built for US tech engineers in the first 90-day window, because that's the audience I have lived context for and where the wedge is sharpest. Some of it generalizes (severance negotiation, unemployment filing, financial defense) — visa-specific paths are US-only. If you want to test it for [their specific case] I'm happy to walk through it together and tell you where it falls short.
```

### "Already laid off / lost my job last month / etc." (real ICP showing up)
```
Sorry you're dealing with this. The triage at the link in the pinned comment will rank the top 3-4 things to focus on this week given your specific situation. Whichever priority comes back at the top, the Scout chat handles that domain directly. If you want, DM me and I'll walk through your situation 1:1 — that's part of why I built the Layoff Sprint tier.
```

### "How does this compare to [Final Round AI / Simplify / Teal]?"
```
Different wedge on purpose. Final Round AI is best-in-class for voice interview practice; Simplify is great for job application volume; Teal is the strongest application tracker. Hyrly doesn't compete with any of them — it covers the 90-day window BEFORE active interviewing, where none of those tools fit. I'll send a user to any of those three if they're at that stage.
```

### "How do you monetize?"
```
Three Scout AI sessions free, then $29/mo for unlimited Scout (the Hyrly Coach tier). One-time $99 Layoff Sprint that includes a personal week-1 audit call with me. Triage + Playbook + calculators stay free forever.
```

---

## Execution timeline

```
T-30min   DM 8-12 engineering friends with the soft pre-warm ask
T-15min   Open Supabase SQL Editor with the funnel query below
            ready in a tab (so you can watch the funnel live)
T-5min    Triple-check the post body has NO external link (only the
            hyrly.ai mention in the "I'll drop the link in the first
            comment" line — that's not a clickable URL)
T+0       Post the body + attached image
T+45-90s  Post the first comment with the three tagged URLs → pin it
T+5-15m   Reply to every comment substantively. Match comment length;
            don't just say "thanks!"
T+30m     Quote-comment your own post with one new specific (e.g. a
            user reaction, a screenshot of the severance calc) —
            this is a legitimate algorithm boost.
T+60m     Re-run the funnel query — any rows with source LIKE 'li2%'?
            If so, the funnel is alive; reply to recent comments
            mentioning the specific calculator/H-1B URLs.
T+24h     Run the funnel query split by source tag. See which tag
            (li2 / li2-sev / li2-h1b) drove the most engaged scout
            sessions. That ratio informs attempt #3's hook.
T+48h     If reach > 200 views, do nothing — let it ride. If reach <
            100, the contrarian hook didn't land either; try hook C
            (product-first) in attempt #3 in 1-2 weeks.
```

### Funnel query (paste into Supabase SQL Editor)

```sql
SELECT t.source,
       COUNT(t.id)                                AS triages,
       COUNT(DISTINCT s.id)                       AS scout_sessions,
       COUNT(DISTINCT s.id) FILTER (
         WHERE jsonb_array_length(s.messages) >= 4
       )                                          AS scout_engaged
FROM triage_responses t
LEFT JOIN scout_sessions s ON s.triage_id = t.id
WHERE t.source LIKE 'li2%'
GROUP BY t.source
ORDER BY triages DESC;
```

`scout_engaged` requires ≥ 4 messages (≥ 2 user turns) — the threshold that surfaced the attempt #1 product signal (11 sessions started, 0 engaged). If `scout_engaged` lands above zero this time, the Scout opening message change worked. If it's still zero, the distribution is real but Scout itself needs work.

---

## Why this should outperform attempt #1

| Lever | Attempt #1 | Attempt #2 | Why it matters |
|---|---|---|---|
| Link placement | Body | First comment | 2-5x reach (the dominant factor) |
| Hook | Personal-vulnerable | Contrarian thesis | Hook B converts better with cold audience |
| Pre-warming | None known | 8-12 DM'd before post | Early engagement is what the algorithm boosts on |
| Image | Unknown | Hero screenshot attached | 30-50% CTR lift vs no image |
| Day/time | Whenever | Tue/Wed 8-10am PT | 2-3x engagement vs weekend posts |
| Self-quote follow-up | None | At T+30m | Second algorithmic surface |

If all 6 levers work, conservative expectation is **400-800 views and 10-25 real triages.** If only the link-placement fix lands, expect 150-300 views and 3-8 triages — still 4-8x attempt #1.

If attempt #2 also lands at <100 views, the issue isn't link-in-body or hook quality — it's network reach. At that point the next move is paid amplification ($50-100 boost on the post), reaching out to existing laid-off-engineer communities (layoffs.fyi, the LinkedIn ~50k-member "Recently Laid Off" group), or shifting to Reddit r/cscareerquestions / Hacker News distribution instead of LinkedIn.

---

## What success looks like at this scale

Don't optimize for views. Optimize for:

- **5+ triages tagged `source LIKE 'li2%'` in 24 hours** — attempt #1's baseline was ambiguous (DB showed 11 triages in the launch-day window, but most were likely pre-flight test runs, not real users). With source tagging, attempt #2's number is unambiguous.
- **2+ scout sessions tagged `source LIKE 'li2%'`** — the plan-to-Scout handoff worked at least once.
- **1+ engaged scout session** (≥ 4 messages) — attempt #1 had zero. A single engaged session is the first real evidence that Scout's opening keeps people in the conversation.
- **1+ cold DM** from someone outside your network saying "this helped"
- **Any reshare from someone outside your immediate network**

If 3 of these 5 happen, attempt #2 worked. The engaged-scout-session metric matters most because it tells you whether you fixed the attempt-#1 product gap, not just the distribution gap.
