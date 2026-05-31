# WWW Project Phase 41 — Public MVP UI Policy Implementation Plan v1

**Document path:** `docs/www-project-phase-41-public-mvp-ui-policy-implementation-plan-v1.md`  
**Status:** Planning bridge (normative intent for Phase 41+ UI work; **no implementation** in this document)  
**Depends on:** `/AGENTS.md` v0.2, `docs/www-project-agent-spec-v0.1.md`, `docs/www-project-phase-39-poll-lifecycle-policy-v1.md`, `docs/www-project-phase-40-user-profile-eligibility-follow-policy-v1.md`  
**Baseline:** `origin/master` @ `8b94ac1` — `docs: add poll lifecycle and eligibility policies`  
**Scope of this file:** Documentation only. Maps Phase 39/40 policies onto current Public MVP routes and classifies UI-only vs schema/API work. **Policy/planning only** — this document does not implement UI, API, or schema changes by itself.

**Related policies:** `docs/www-project-phase-39-poll-lifecycle-policy-v1.md` (lifecycle), `docs/www-project-phase-40-user-profile-eligibility-follow-policy-v1.md` (eligibility / follow).

**Visual reference (optional, not in repo):** `www_ui_redesign_all_pages.html` — treat as layout/visual inspiration only; do not copy markup or behavior blindly. Implement against policy and existing `public/frontend/` patterns.

---

## 1. Context

Phase **39** and **40** policy documents are committed and pushed. They define **what** the product must do (lifecycle, eligibility, visibility, follow-result notification) but do not prescribe **how** the current Public MVP HTML/JS pages should evolve step by step.

**Phase 41 (this plan)** is a **planning bridge**:

- **No implementation** in Phase 41 itself—no schema, API, or production UI commits required by this file.
- **Goal:** Decide UI behavior, page-level field plans, wording, and **implementation order** before profile/eligibility/follow persistence and full lifecycle enforcement land in the backend.
- **Constraint:** Any UI work must still satisfy **both** Phase 39 and Phase 40 when shipped (no collecting-stage leakage; no founder intermediate signals; no false verification claims).

---

## 2. Current baseline summary

| Area | Current state |
|------|----------------|
| **Public MVP routes** | `GET /` (homepage), `GET /polls/new`, `GET /vote/:pollId`, `GET /results/:pollId`, `GET /explore` (placeholder, no DB list) |
| **Create / vote / results** | Works locally with demo (`npm run demo:public:local` or manual `www_test` + `npm start`) |
| **Collecting results** | API intentionally returns `display_mode: collecting`, `total_votes_display: 收集中`, `options[].display_count` / `display_percentage: null` — **product rule**, not a UI bug |
| **Policy docs** | Phase 39 (lifecycle) and Phase 40 (profile/eligibility/follow) at `8b94ac1` on `origin/master` |
| **Homepage poll list** | Not a full feed UI on `/`; circulation is primarily **share links**; `/explore` explains list is not open |
| **Founder dashboard** | **Not implemented** as a dedicated Public MVP page; plan below is **future** surface |
| **User profile / eligibility / follow** | **Not implemented** in API or UI persistence |

---

## 3. Page mapping overview

| Surface | Route / location | Visible (target) | Hidden (collecting / policy) | Policy deps | UI-only first? | Schema/API later? |
|---------|----------------|------------------|------------------------------|-------------|----------------|-------------------|
| **Homepage** | `GET /` | Landing, links to create/explore; future poll cards when list exists | Collecting vote counts; unpublished polls in default list | 39 §11; 40 §5–6 | Partial (copy, static cards) | Real feed, lifecycle filters, eligibility on cards |
| **Poll card** | Homepage / future feed | Title, description snippet, category, status, statistics period, reveal time, eligibility summary | Counts/percentages while collecting; unpublished in default list | 39 §11; 40 | Mock cards | Feed API + poll lifecycle fields |
| **Create poll** | `GET /polls/new` | Title, description, category, options (today); future close/eligibility/lock copy | Collecting results for founder (warning only) | 39 §5–8; 40 §5 | Wording, disabled future fields | `closes_at`, eligibility rules, close conditions |
| **Vote page** | `GET /vote/:pollId` | Title, description, category, options (if eligible + collecting), periods, eligibility block, notices | Totals, counts, %, participant threshold | 39 §12; 40 §6–9 | Notices, mock eligibility states | Eligibility eval, follow persistence |
| **Results page** | `GET /results/:pollId` | State-specific notices; display-safe tiers after reveal; collecting hidden aggregates | Collecting aggregates for all viewer types | 39 §4, §13; 40 §6–10 | State placeholders, copy | Lifecycle state, follow, cancel/unpublish |
| **Explore** | `GET /explore` | Placeholder explanation | Poll list until product opens discovery | 39 §11 | Copy only | Feed/list integration |
| **Founder dashboard / My polls** | *Not built* | Title, status, periods, configured rules, share, cancel (pre-close), post-reveal public result | All intermediate metrics during collecting | 39 §14; 40 §11 | Static mock dashboard | Auth, poll ownership, lifecycle APIs |

---

## 4. Homepage / poll card plan

### Poll card fields (when lists exist)

| Field | Collecting | After reveal | Unpublished |
|-------|------------|--------------|-------------|
| Title | Show | Show | N/A on default homepage |
| Short description | Show | Show | — |
| Category | Show | Show | — |
| Status | `collecting` | `results revealed` / `public` / optional `public lock period` | Exclude from default list |
| Statistics period | Show | Show | — |
| Result reveal time | Show | Show (or “revealed at …”) | — |
| Eligibility summary | Show if Phase 40 data exists (e.g. “Age 18–30 · Kaohsiung”) | Optional recap | — |
| Total votes | **Hide** | Show (display-safe) | — |
| Percentages / ranking | **Hide** | Per result tier only | — |

### Homepage list rules

- **Default homepage / feed lists** must not include **unpublished** polls (Phase 39 §11).
- May **prioritize** eligible polls (Phase 40) without hiding all ineligible polls from discovery—product choice when list ships.
- No vote count on cards during **collecting**.

---

## 5. Vote page plan

### Always show (when poll is public and collecting)

- Title, description, category
- **Statistics period** and **result reveal time**
- **Collecting blind-result notice** (see §11 wording)
- **Result visibility rule:** counts hidden until reveal

### Options

- Show option list **only if** user is **eligible** and poll is **collecting** and poll is votable (not cancelled/archived/hidden).

### Eligibility block (Phase 40)

| Row | Content |
|-----|---------|
| Age | Creator range (e.g. 12–15) or “unrestricted” |
| Region | e.g. Kaohsiung City or “unrestricted” |
| Gender | “unrestricted” in MVP; future restricted label |
| User state | Eligible / not eligible + **reason** (mock OK in 41B) |

Self-declared disclaimer: do not imply official verification (Phase 40 §3).

### Viewer states

| State | Vote? | Follow result? | Intermediate results? |
|-------|-------|----------------|------------------------|
| **Ineligible** | No | Yes (UI; persistence later) | No |
| **Eligible, undecided** | Yes | Yes | No |
| **Voted** | No (MVP: no change vote) | Optional notify | No |

### Ineligible UX

- Cannot vote; **Follow result** / **Notify me when results are revealed** primary secondary action.
- Link to results page for **non-aggregate** collecting view only.

### Eligible undecided UX

- Primary: submit vote.
- Secondary: follow / notify without voting.

### Voted UX

- Submitted notice + reveal time.
- Optional **Notify me when results are revealed**.

---

## 6. Results page plan

Align with Phase 39 §13 and Phase 40 collecting states. API must continue to return `display_mode: collecting` with null option display fields during collecting.

| State | Results visible? | Voting allowed? | Primary notice | Primary action | Hidden |
|-------|------------------|-----------------|----------------|----------------|--------|
| **collecting / voted** | No aggregates | No | Collecting; thanks for voting; reveal at `{reveal_time}` | Notify me (optional) | Counts, %, trends |
| **collecting / unvoted** | No | Yes if eligible (link to vote) | Collecting; counts hidden until reveal | Vote · Follow result | Same |
| **collecting / ineligible** | No | No | Eligibility not met (§11 wording) | Follow result | Same |
| **collecting / followed** | No | Yes if eligible & not voted | Following for reveal | Cancel follow · Vote | Same |
| **results revealed** | Yes (display-safe) | No | Results public as of `{reveal_time}` | Share / view results | Raw counters |
| **public lock period** | Yes | No | Results public; founder cannot edit (visitor-neutral copy optional) | — | Founder-only controls |
| **lock ended, still public** | Yes | No | Poll remains public | — | — |
| **unpublished after lock** | MVP may hide full results | No | Unpublished copy (Phase 39 §9) | — | Full charts if policy hides |
| **cancelled before close** | No | No | Cancelled before results formed | — | All aggregates |
| **system archived** | Minimal / none | No | System archived (no moderation detail) | — | Sensitive internals |

**Existing implementation note:** `public/frontend/result-page.js` already renders collecting status; Phase 41A/B extends notices and state labels to match this table without inventing fake counts.

---

## 7. Create poll page plan

### Current MVP fields (implemented)

- Title, description, category, options → `POST /polls`

### Future UI fields (planning; mostly Phase 42+ API)

| Field | MVP UI plan | Backend |
|-------|-------------|---------|
| Title, description, category, options | Keep | Exists |
| Close / reveal date-time | Single datetime picker; MVP **close = reveal** | Extend `closes_at` semantics + display |
| Quick presets (“24h”, “7 days”) | Resolve to **explicit** datetime before submit | Store canonical timestamp only |
| Participant-count threshold | Disabled + “Future” label | Phase 42+ |
| Dual close (time OR count) | Disabled + “Future” label | Phase 42+ |
| Eligibility: unrestricted | Radio / select | `eligible_rule_id` or new model |
| Age restricted | Min/max age UI | Profile + rule eval |
| Region restricted | Region picker | Profile + rule eval |
| Age + region | Combined | Both |
| Gender restriction | **Future only** — hidden or disabled | Not MVP |
| Public lock period | Static note: **5 days** after reveal (Phase 39 §7) | Enforcement Phase 42+ |
| Founder collecting warning | Prominent: **you will not see vote counts during collecting** | Education only |

---

## 8. Founder dashboard / My polls plan

**Status:** Not a current Public MVP route. Plan for Phase 41B mock or Phase 42+ product surface.

### Visible

| Item | When |
|------|------|
| Poll title | Always |
| Status | collecting / revealed / lock / unpublished / cancelled / system archived |
| Statistics period, reveal time | Always |
| Configured close condition (type + scheduled time, not live progress) | Collecting + after |
| Configured eligibility | Always |
| Share links (vote/results URLs) | When public |
| Cancel | Collecting only, before close |
| Public aggregate result | After reveal (display-safe, same as public) |
| Lock period notice | During lock |
| Unpublish | **Only after** lock period ends |

### Hidden during collecting

- Current vote count, participant count, option counts, percentages, ranking
- Demographic trends, follower count, abandon count
- Remaining participant threshold (if shown would leak progress)

---

## 9. Follow result / notification UI plan

### MVP button labels

- **Follow result**
- **Notify me when results are revealed** (long form; use where space allows)

### Appears on

| Context | Show button? |
|---------|----------------|
| Ineligible user on vote page | Yes |
| Eligible, not yet voted (vote + results collecting) | Yes |
| After successful vote | Yes (optional opt-in) |
| Collecting result page | Yes, per state table §6 |

### MVP channel

- **In-app notification only** (Phase 40 §8).
- Email / push: **Future** — UI may show disabled “Coming later”.

### UI-only Phase 41B

- Button toggles local/mock “following” state with clear “demo / not saved” if no API.
- **Do not** show follower counts anywhere during collecting.

---

## 10. UI wording plan

### Use

| Situation | Recommended copy |
|-----------|------------------|
| Reveal scheduling | “Results will be revealed at {reveal_time}.” |
| Collecting blindness | “Before reveal, vote counts and percentages are hidden to avoid influencing later voters.” |
| Ineligible | “You currently do not meet this poll’s voting eligibility. You can follow this poll and view the public results after they are revealed.” |
| Privacy | “Voting does not publicly reveal personal data or individual voting records.” |
| Age eligibility | “The system determines age eligibility based on the birth year/month self-declared in the user profile.” (Phase 40) |

### Avoid

| Avoid | Prefer |
|-------|--------|
| “anonymous submission, contains no personal information” | “personal data is not publicly shown” / voting privacy line above |
| “expired” | “lock period ended” or “statistics period ended” |
| “closed” alone | “results revealed” vs “unpublished” vs “voting ended” |
| “archived” for pre-close cancel | “cancelled before results were formed” |
| “verified age group” | self-declared wording |

---

## 11. UI-only vs schema/API-required classification

| Item | UI-only / mockable (41A–41B) | Requires schema/API (42+) |
|------|------------------------------|---------------------------|
| Wording updates (§10) | Yes | — |
| Collecting notices on vote/results | Yes | — |
| Status labels (collecting, revealed, lock, cancelled, unpublished) | Yes (mock lifecycle) | Real lifecycle state from API |
| Static eligibility display placeholders | Yes | Live eligibility evaluation |
| Disabled ineligible mock state | Yes | Profile + rules |
| Lock / unpublish / cancelled mock notices | Yes | Persistence + enforcement |
| Follow button visual + local toggle | Yes (labeled demo) | Follow persistence + notification delivery |
| User profile (nickname, birth ym, region, gender) | Placeholder forms | DB + API |
| Birth year/month storage | — | Yes |
| Region / gender storage | — | Yes |
| Close beyond current `closes_at` | Display only | Participant threshold, dual close |
| 5-day public lock enforcement | Copy only | Timestamps + founder action guards |
| Founder dashboard real data | Mock list | Ownership, auth, poll APIs |
| In-app notifications inbox | Static empty state | Notification store + delivery |
| Homepage poll list with filters | Static/demo cards | Feed + lifecycle + eligibility |

---

## 12. Recommended implementation order

### Phase 41A — Docs / UI copy alignment (no DB/API)

- Finalize strings in plan (§10) and add to translation/copy checklist.
- Document state matrix on results page (§6) for implementers.
- Cross-link from README when implementation starts (optional handoff).

### Phase 41B — Frontend-only visual states (no persistence)

- Extend `public/frontend/result-page.js`, vote page markup, and shared CSS with:
  - Collecting / ineligible / followed **banners** (query param or dev mock flag only).
  - Eligibility block **layout** with placeholder data.
  - Follow button **without** claiming persistence unless API exists.
- **Do not** fabricate vote counts or percentages in DOM for collecting.
- Optional: dev-only `?ui_state=collecting_ineligible` for QA (must not ship as fake production data without guard).

### Phase 42+ — Schema / API foundation

1. User profile fields (birth year/month, region; gender optional collect).
2. Poll eligibility rules + server-side evaluation.
3. Lifecycle fields: lock end, unpublished, cancelled, system archived.
4. Follow-result subscription + in-app notification records.
5. Founder dashboard APIs without collecting-stage metrics.
6. Close conditions (participant threshold, dual condition) after MVP time-close stable.

---

## 13. Risk notes

| Risk | Mitigation |
|------|------------|
| Leaking collecting-stage progress | Never render counts, %, thresholds, or “leading option” in UI; trust API `collecting` mode |
| Founder intermediate signals | No founder-only DOM sections with fake analytics; dashboard API must mirror Phase 39 §14 |
| Implying verified age/region/gender | Use self-declared copy only (Phase 40) |
| Durable user–option linkage | Follow/notify flows must not log or store option choice with user id (`AGENTS.md` §3) |
| Small demographic groups in future breakdowns | Out of 41 scope; Phase 40 Future table — minimum sample thresholds |
| Follower count during collecting | Do not display |
| Mock UI mistaken for production | Label demo persistence; smoke tests must not assert fake counts |

---

## 14. Alignment with Phase 39 and Phase 40

| Document | Role in Phase 41 |
|----------|------------------|
| `docs/www-project-phase-39-poll-lifecycle-policy-v1.md` | Lifecycle states, collecting blindness, lock/cancel/unpublish, founder visibility |
| `docs/www-project-phase-40-user-profile-eligibility-follow-policy-v1.md` | Eligibility block, ineligible/follow UX, notification channel, profile cooldowns (future) |

**Implementation must satisfy both** before marking Phase 41 UI work “done” for production paths.

---

## 15. Document validation note

This file is **docs-only**. It does not alter schema, migrations, APIs, frontend bundles, or tests.

---

*Phase 41 Public MVP UI policy implementation plan v1.*
