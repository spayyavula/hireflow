# layoffs.fyi Outreach — Roger Lee Pitch + Community Fallback (send 2026-05-27)

> **Context:** [Attempt #2](2026-05-26-linkedin-attempt-2.md) is mid-flight on
> LinkedIn. At T+21h it sits at 168 views vs. [attempt #1](2026-05-21-linkedin-launch.md)'s
> 328 over a full week — projected to land 1.2-1.5x ahead of attempt #1, not 4-8x.
> The honest read: distribution levers helped marginally, but the
> ~300-450 view ceiling is your warm LinkedIn network, not the post quality.
>
> **The leverage move is external community distribution** — channels where
> the audience is *already* the ICP, not where you need targeting to find them.
> [layoffs.fyi](https://layoffs.fyi) is the highest-fit option: every visitor
> is either tracking layoffs or living through one.
>
> **Two assets in this doc:** a direct pitch to Roger Lee (who runs the site
> and gates the Resources page + newsletter), and a Slack/community fallback
> if Roger doesn't reply within 4-5 days. Roger first — one inbound can put
> Hyrly in front of his entire audience and the cost of a "no" is one email.
>
> **Voice:** direct, tactical, gift-wrapped. The previous hooks (personal-
> vulnerable; contrarian-thesis) are wrong for this audience — these people
> *are* laid off, they don't need persuading. Lead with what the tool does.

---

## Asset 1 — Direct outreach to Roger Lee (send first)

**Channel:** email via the contact link on layoffs.fyi (the About / Contact page lists Roger's email). If no email is exposed, DM via the public X/LinkedIn account linked from the site.

**Subject:** Free tool for the layoffs.fyi audience — worth a spot on Resources?

```
Roger,

Built a free tool aimed exactly at the people landing on layoffs.fyi: a
triage + calculators for the first 30 days after a layoff.

hyrly.ai — covers severance negotiation (calculator gives a $ range to
counter), COBRA-vs-marketplace math (most people lose $5-15k getting this
wrong), H-1B 60-day clock, unemployment filing timing, and an AI chat
coached on 13 layoff-specific decisions (not generic career AI).

Free, anonymous, no signup. Monetization is a $29/mo unlimited-AI tier and
a $99 one-time call — calculators and triage stay free forever.

If it's worth a spot on the Resources page or a future newsletter line,
I'd be grateful. Happy to add a ?src=lfyi tag so you can see actual
click-through. If it's not the right fit, no problem either.

Thanks for keeping the list current — it's been the source of truth on
this whole cycle.

— Sreekanth
```

**Word count:** ~165. Short on purpose — Roger gets pitched constantly; brevity is a courtesy signal.

### Tag table — if Roger features the tool

| Tag | Where it appears | What it measures |
|---|---|---|
| `lfyi` | Bare hyrly.ai link on the Resources page or in the newsletter | Top-of-funnel; people who found Hyrly via the official feature |
| `lfyi-sev` | Severance calculator link (if Roger asks for a more specific entry point) | Mid-negotiation cohort |
| `lfyi-h1b` | H-1B landing page link (if relevant to a specific newsletter beat) | Visa cohort |

`lfyi` deliberately mirrors `li2` / `x2` so cross-channel comparison stays clean: `triages WHERE source = 'lfyi'` vs `WHERE source = 'li2'` tells you whether a perfect-fit cold audience converts at higher rates than a warm-network audience for the same product.

---

## Asset 2 — Community Slack / forum post (fallback if no Roger reply)

**Channel:** the layoffs.fyi community Slack. Access requires joining via the link on the site (usually gated through a request form — request access 24-48h before you plan to post so the join doesn't look like a hit-and-run).

**Where to post:** the `#resources` or `#tools` channel if it exists; otherwise `#general` or the closest equivalent. Skim a few days of channel history first — don't post into a venting-only space.

```
For anyone in their first 30 days — built a free tool that does the
boring tactical stuff most career advice skips.

https://hyrly.ai/?src=lfyi-slack

- Severance calculator (dollar range to counter, based on tenure /
  level / employer): hyrly.ai/tools/severance?src=lfyi-slack-sev
- COBRA vs ACA marketplace math (the answer is "marketplace" ~75% of
  the time; gap is $5-15k over 12 months)
- H-1B 60-day breakdown if you're on visa:
  hyrly.ai/laid-off-h1b?src=lfyi-slack-h1b
- 3-min triage that ranks what to focus on THIS week vs. busywork
- AI chat with 13 layoff-specific handlers (severance negotiation,
  financial defense, unemployment timing) — not the generic
  "polish your resume" stuff

Free, anonymous, no signup. Paid tier exists for unlimited AI chat but
the calculators and triage stay free forever.

Solo build out of San Jose. If something gives wrong advice or a
calculator is off, DM me — fastest way to get it fixed.
```

**Word count:** ~180. Conversational but tactical-first.

### Tag table — Slack post

| Tag | Where it appears | What it measures |
|---|---|---|
| `lfyi-slack` | Bare hyrly.ai link at the top of the post | Top-of-funnel clickers |
| `lfyi-slack-sev` | Severance calculator link | Mid-negotiation cohort |
| `lfyi-slack-h1b` | H-1B landing page link | Visa cohort |

The `lfyi` (Roger-featured) vs `lfyi-slack` (community-posted) split matters because the audience is the same but the trust signal is different — a Roger-curated link carries editorial weight; a Slack post is a stranger's drop. The conversion ratio between the two tells you how much the editorial framing is worth on this audience.

---

## Pre-flight checklist (before sending either)

- [ ] **Confirm hyrly.ai is live + working end-to-end.** Open in incognito,
      run the triage, click into Scout, send a message, load
      `/tools/severance` and `/laid-off-h1b`. The layoffs.fyi audience is
      maximally skeptical of broken links from strangers — one 404 burns the
      channel for months.
- [ ] **Verify `?src=lfyi*` tagging end-to-end.** Open
      `hyrly.ai/?src=lfyi-preflight` in incognito, complete the triage,
      click into Scout, send a message. Funnel query should show one row
      with `source = 'lfyi-preflight'`. If `source = NULL`, the
      source-capture wire is broken (same blocker as the attempt #2
      pre-flight).
- [ ] **Find Roger Lee's actual contact path** on layoffs.fyi → About / Contact /
      Submit Resource. Don't guess the email address — use what's listed on
      the site. If only a form exists, paste the pitch into the form body
      and adjust the salutation if the form is generic.
- [ ] **For the Slack fallback only:** join the community 24-48h before
      posting and read recent history to make sure the tone fits. Don't
      post within an hour of joining.
- [ ] **Block 30 min after sending the Roger pitch** to handle a fast reply
      if it comes. Most editorial gatekeepers reply same-day or never.

---

## Execution timeline

```
Day 0 (Wed 2026-05-27, AM PT)
              Send Roger pitch via the email/contact path on
              layoffs.fyi. Open Supabase SQL Editor with the funnel
              query below ready in a tab.

Day 0 (PM)    If Roger replies same-day:
              - "Yes, I'll add it":  send him the exact link string he
                requested, with the ?src=lfyi tag already appended.
                Don't ask him to add the tag himself.
              - "No / not a fit":    thank him, drop it, move to the
                Slack fallback in 1-2 days.
              - "Tell me more":      reply with the 1-paragraph deeper
                cut: who it's for, how Scout's 13 handlers differ from
                generic career AI, the monetization model, and one
                specific user reaction if you have one. Don't lead with
                metrics — Roger's gatekeeping for value to his
                audience, not vanity numbers.

Day 1-4       No-reply window. Resist the urge to follow up before
              Day 4 — gatekeepers process inbound in batches and
              early follow-ups read as low-status.

Day 5         If still no reply: send the Slack/community fallback
              post in #resources or the closest equivalent channel.

Day 5 + 24h   Re-run the funnel query split by source tag. Compare
              lfyi* vs li2* vs x2* totals. If lfyi* dominates by 3x+
              at lower view counts, perfect-fit audience is the
              lesson and the next two distribution swings should be
              community-targeted (Recently Laid Off LinkedIn group,
              r/layoffs, Show HN), not LinkedIn-broadcast.

Day 7         If neither Roger nor the Slack drove anything, that's
              an interesting signal — either the messaging is wrong
              for this audience too, or layoffs.fyi's audience is in
              "track the carnage" mode more than "find tools" mode.
              Either way, journal the result before pivoting.
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
WHERE t.source LIKE 'lfyi%'
   OR t.source LIKE 'li2%'
   OR t.source LIKE 'x2%'
GROUP BY t.source
ORDER BY triages DESC;
```

Reading the result: if `lfyi*` rows show higher `scout_engaged / triages`
ratio than `li2*` or `x2*` rows, the perfect-fit-audience hypothesis is
correct and the next two distribution moves should both be
community-targeted, not broadcast.

---

## Reply templates (Roger inbound)

### "Looks interesting — how do I know the advice is actually accurate?"
```
Fair question. The severance calculator's ranges come from public benchmarks
(severance pay studies from levels.fyi, Hired's annual reports, plus 60+
real severance offers from friends in the last 24 months). The COBRA-vs-
marketplace math uses the actual ACA premium tax credit formula, not a
ballpark. The H-1B 60-day breakdown was reviewed by an immigration attorney
friend before shipping. Where the tool genuinely doesn't know (state-
specific unemployment rules outside CA/WA/NY/TX) it says so instead of
making something up. Happy to walk you through any of the methodology.
```

### "What's your monetization actually look like?"
```
Three Scout AI sessions free, then $29/mo for unlimited Scout (the Hyrly
Coach tier). One-time $99 Layoff Sprint that includes a personal week-1
audit call with me. Triage + Playbook + calculators stay free forever —
those are the parts your audience would actually use. The paid tiers are
for the slice of users who want ongoing coaching, not the typical
laid-off-this-week visitor.
```

### "Would you want to do a Q&A / interview for the newsletter?"
```
Yes, with one caveat — I'd want to keep the framing on the *tool* and what
it does for laid-off engineers, not a founder-story arc. The audience is
maxed out on founder stories right now and what they actually need is to
know which calculators to open in what order this week. If that framing
works for you, I'm in for whatever format makes sense.
```

---

## Anti-patterns

- **Don't** open the Roger pitch with "I'm a huge fan of layoffs.fyi" — every
  cold pitch does that and it's noise. Open with what the tool is.
- **Don't** include screenshots in the cold email. Roger gets pitched a lot;
  a wall of images reads as bulk outreach. Link + text only on the first
  contact; offer screenshots if he asks.
- **Don't** post the Slack fallback the same day you join the community. Read
  for 24-48h first. The fastest way to get banned from a community is to
  treat it as a distribution channel from minute one.
- **Don't** cross-link the Hyrly LinkedIn post inside the Slack message.
  Different surface, different conversation; the LinkedIn artifact reads as
  self-promotion-of-self-promotion in a community context.
- **Don't** follow up Roger more than once. One pitch, one polite nudge at
  Day 5 if you haven't moved to the Slack fallback yet, then stop. Editorial
  gatekeepers have long memories for pushy founders.

---

## What success looks like at this scale

- **Roger replies at all** (yes or no) — most cold pitches are ignored; a
  reply means the framing was tight enough to read.
- **2+ triages tagged `source = 'lfyi'`** within 7 days of a Roger feature —
  proves the perfect-fit audience converts at higher rates than the warm
  LinkedIn network. (Attempt #1 organic was 1/328 ≈ 0.3%; lfyi should be
  1-3% if the audience-fit thesis is right.)
- **1+ engaged scout session tagged `lfyi*`** — first evidence that
  community-targeted distribution closes the funnel further than broadcast
  distribution.
- **Higher `scout_engaged / triages` ratio for `lfyi*` than for `li2*`** —
  even at lower volume, this is the metric that justifies more
  community-targeted swings (Recently Laid Off group, r/layoffs) next.

If `lfyi*` outperforms `li2*` on the engaged-session ratio, the next two
distribution swings should both be community-targeted, not LinkedIn
broadcast — that's the actual lesson, more valuable than the absolute
numbers.
