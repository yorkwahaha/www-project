# WWW Project Phase 40 — User Profile / Eligibility / Follow Result Notification Policy v1

**Document path:** `docs/www-project-phase-40-user-profile-eligibility-follow-policy-v1.md`  
**Status:** Policy design (normative intent for future Phase 40 implementation; **not** implemented in this document)  
**Depends on:** `/AGENTS.md` v0.2, `docs/www-project-agent-spec-v0.1.md`, `docs/www-project-phase-39-poll-lifecycle-policy-v1.md` (poll lifecycle, close/reveal, lock, cancel, archive)  
**Baseline:** `origin/master` @ `964f39b` — chore: improve local public MVP demo startup  
**Scope of this file:** Documentation only. No database, API, frontend, or test implementation changes are implied by publishing this policy.

This document defines the **future** product and engineering policy for user profile basics, voting eligibility (age and region), ineligible-user visibility, result-follow notification, and founder visibility boundaries. It does not replace `AGENTS.md` or the agent spec; where those documents already forbid behavior (for example durable user–option linkage), Phase 40 must remain compliant.

**Related policy:** `docs/www-project-phase-39-poll-lifecycle-policy-v1.md` — collecting, close, result reveal, public lock period, cancellation, unpublish/archive, and lifecycle visibility by poll state.

---

## 1. Context

**Phase 39** (`docs/www-project-phase-39-poll-lifecycle-policy-v1.md`) focuses on **poll lifecycle**: collecting, close, reveal, lock, archive, and cancel. It answers *when* a poll is open, when results become visible, and how lifecycle states transition.

**Phase 40** focuses on **who may vote** and **what users need on file** to participate:

- Basic user profile fields required for eligibility checks
- Age and regional restrictions set by poll creators
- What **ineligible** users may still see or do (including follow-for-result)
- How **result reveal notification** works for eligible and ineligible users
- What **founders** may see during collecting without leaking intermediate result signals

Phase 40 is intentionally separate from lifecycle mechanics: a poll may be in `collecting` while eligibility rules determine whether the current viewer may vote, follow results, or see collecting-stage aggregates.

---

## 2. MVP user profile fields

MVP collects the following profile fields for display and eligibility:

| Field | Purpose |
|-------|---------|
| **nickname** | Display and basic account identity |
| **birth year / birth month** | Age eligibility calculation (not full birthday) |
| **residential region / city / county** | Regional eligibility |
| **gender** | Profile attribute; gender-based voting restrictions are **not** MVP-default (see §6) |

### Rules

- **Nickname** is for display and basic account identity only. It is not proof of eligibility.
- **Birth year and month** are used to calculate age eligibility. The system must **not** collect exact day of birth in MVP.
- **Residential region** (city/county or agreed regional granularity) is used for regional eligibility and display where appropriate.
- **Gender** must support at least:
  - male
  - female
  - non-binary / other
  - prefer not to disclose
- Gender **may** be collected in MVP for profile completeness, but **gender-based eligibility** is higher sensitivity and is **future / not MVP by default** (see §6 and §15).

All eligibility derived from profile data is **self-declared**, not government- or third-party-verified.

---

## 3. Birth year/month and age eligibility

### Policy

- Do **not** use broad fixed age buckets (for example “teen”, “adult”) as the **source** of eligibility. Users enter **birth year and month** only; the system calculates age from that input at vote/eligibility check time.
- Poll creators may set **custom age ranges** on a per-poll basis, for example:
  - 12–15
  - 18–30
  - 65+
- Eligibility is based on **self-declared** profile birth year/month, not official age verification.
- UI and public result copy must **not** imply verified age groups (for example avoid “verified teens” or “confirmed 18+”).

### Recommended wording

> The system determines age eligibility based on the birth year/month self-declared in the user profile.

Optional supporting copy (non-normative): “Poll creators set age ranges; meeting the range depends on the birth year/month you provided in your profile.”

---

## 4. Region eligibility

- Poll creators may restrict Official Vote to specific **regions, cities, or counties** (for example: only users whose residential region is Kaohsiung City).
- Users who do not meet regional eligibility:
  - May still see **basic poll information** (see §7)
  - **Cannot** cast an Official Vote while ineligible
- Home and explore surfaces **may prioritize** polls for which the user is eligible, but **must not** necessarily hide all ineligible polls from discovery unless product policy explicitly requires it later. Default: ineligible users can discover polls and understand requirements; ranking must not use answer-direction signals (per `AGENTS.md` §7).

---

## 5. Eligibility rules supported in MVP

| Rule type | MVP support |
|-----------|-------------|
| **unrestricted** | Yes |
| **age restricted** | Yes |
| **region restricted** | Yes |
| **age + region restricted** | Yes |
| **gender restricted** | **Future / not MVP by default** |

Creators configure allowed combinations through poll eligibility settings (exact API/schema is out of scope for this policy file). Snapshot or audit of eligibility conditions at vote time must not create durable user–option linkage (existing spec constraints apply).

---

## 6. Ineligible user UX

Users who **do not meet** voting eligibility for a poll:

| Allowed | Not allowed (during collecting / before public reveal) |
|---------|--------------------------------------------------------|
| Poll title | Vote (Official Vote) |
| Description | Collecting-stage **results** (aggregates, charts, trends) |
| Category | Total votes, option counts, percentages |
| Eligibility requirements (as configured) | Current participant count |
| Statistics period (as defined by product) | Remaining participant threshold |
| Result reveal time | Trend or any signal that reveals answer direction before reveal policy allows |

**Follow result:** Ineligible users **may** follow the poll/result and receive an in-app notification when results are **revealed** (see §9).

### Suggested wording

> You currently do not meet this poll’s voting eligibility. You can follow this poll and view the public results after they are revealed.

---

## 7. Eligible but undecided user UX

Two concepts apply to users who **are** eligible but have **not** voted yet.

### A. Follow result / notify me (MVP priority)

- User has not voted yet.
- User **retains the right** to return and vote before poll close (unless a future explicit state says otherwise).
- User may opt in to **notification when results are revealed**.
- User may **cancel** follow at any time before or after reveal (exact persistence model is implementation detail; must not leak option choice).

### B. Give up voting and only view result (Future — Phase 41+)

- Formal user state: user declares they will not vote and only wants the public result after reveal.
- **Not** in MVP implementation. Requires later design on:
  - Can the user undo the declaration?
  - Does it count as “participation” for analytics or founder dashboards?
  - Can founders see abandon counts without leaking intermediate signals?
  - Could the state leak an intermediate signal (for example “gave up” before close correlating with options)?
- Phase 40 policy **documents** the concept only; do not ship MVP UI or APIs for this path.

---

## 8. Result reveal notification

**“Notify me when results are revealed”** may appear in these contexts:

| Context | Allowed in MVP policy |
|---------|------------------------|
| Ineligible user (cannot vote) | Yes |
| Eligible user who has not voted yet | Yes |
| After successful Official Vote | Yes (optional opt-in) |
| Collecting result page (where product shows lifecycle-appropriate actions) | Yes, when copy and state machine allow |

### Channels

| Channel | MVP | Future |
|---------|-----|--------|
| **In-app notification** | Yes — sole MVP channel | — |
| Email | No | Yes |
| Push (mobile/web push) | No | Yes |

Notifications must not include option-level content tied to the recipient’s identity, session, or device in a way that reconstructs a vote (Raw Option Linkage Ban unchanged).

---

## 9. Voting page UI additions (future)

The vote page should include an **eligibility block** showing:

- Configured eligibility requirements (age range, region, gender if ever applicable)
- Whether the **current user** is eligible
- If not eligible, a **clear reason** (for example age below range, region mismatch)
- **Follow result** action when follow is offered

**Example block:**

```text
Eligibility:
Age: 12–15
Region: Kaohsiung City
Gender: unrestricted

You are not eligible to vote in this poll (age).
[Follow result — notify me when results are revealed]
```

Exact layout and accessibility are implementation concerns; this policy only requires the information to be visible before vote attempts.

---

## 10. Result page states (future additions)

Existing lifecycle-oriented result UI states (from `docs/www-project-phase-39-poll-lifecycle-policy-v1.md` and public MVP) include concepts such as:

- collecting / voted
- collecting / unvoted
- published
- locked
- archived

Phase 40 adds **eligibility- and follow-aware** collecting states:

| State | Meaning |
|-------|---------|
| **collecting / ineligible** | User cannot vote; no collecting-stage result aggregates; may follow for reveal |
| **collecting / followed** | User is following for result reveal (may overlap with eligible-unvoted or ineligible; product must define precedence in UI spec) |

These states must respect §6 visibility rules: ineligible and followed-without-vote users do not see collecting-stage result signals forbidden in §6.

---

## 11. Founder dashboard visibility rules

During **collecting**, founders **may** see:

- Configured eligibility conditions: age range, region, gender (when gender restrictions exist in a future phase)

During **collecting**, founders **must not** see:

- Current vote count
- Current participant count
- Option counts or percentages
- Eligible user count
- Follower count
- Abandon count (Phase 41+ concept)
- Demographic trends or breakdowns
- Any other **intermediate result signal** that could inform answer direction or manipulation

After **reveal** and per existing result-display tiers, founders receive the same **display-safe** public result objects as other users unless a separate admin/founder spec grants more (must still not expose raw counters or user-level vote reconstruction).

---

## 12. Data modification cooldown (future policy)

Profile edits affect eligibility; cooldowns reduce gaming (change region to vote, then revert).

| Field | Modification policy (intent) |
|-------|------------------------------|
| **nickname** | Relatively free changes; abuse handled by moderation/reporting, not eligibility cooldown |
| **birth year / month** | **Strongly restricted** — e.g. 365-day cooldown and/or admin review after initial set |
| **residential region** | Allowed with **eligibility effect cooldown** — e.g. 7 days before new region applies to vote eligibility |
| **gender** | Modifiable; if gender-based eligibility is enabled in a future phase, apply a similar cooldown before eligibility updates |

Exact durations and review flows require implementation spec approval; this document sets directional policy only.

---

## 13. Privacy wording correction

Avoid copy that overclaims anonymity, for example:

- ❌ “anonymous submission, contains no personal information”

Prefer:

- ✅ “anonymous submission; personal data is not publicly shown”
- ✅ “Voting does not publicly reveal personal data or individual voting records.”

Official Vote remains anonymous with respect to **public** disclosure of who chose which option; profile data exists for eligibility and account identity but must not be shown in public result or vote surfaces in a way that links a user to an option (per `AGENTS.md` §3–§5).

---

## 14. MVP vs future

| Area | MVP (Phase 40 intent) | Future |
|------|------------------------|--------|
| Profile fields (nickname, birth year/month, region, gender) | Yes | Stronger verification optional |
| Birth year/month (no day) | Yes | — |
| Age eligibility (creator-defined ranges) | Yes | Official age verification |
| Region eligibility | Yes | Finer geo rules, cross-border policy |
| Follow result notification (in-app) | Yes | Email, push |
| Ineligible user UX (see §6) | Yes | — |
| Founder cannot see intermediate result signals | Yes | — |
| Gender-based eligibility | No (default) | Yes, with sensitivity review |
| Give up voting / only view result | No | Phase 41+ |
| Demographic breakdown in results | No | Yes, with privacy thresholds |
| Minimum sample thresholds for demographic breakdown | No | Yes |
| Stronger identity / eligibility verification | No | Yes |

---

## 15. Alignment with Phase 39

| Document | Responsibility |
|----------|----------------|
| **Phase 39** (`docs/www-project-phase-39-poll-lifecycle-policy-v1.md`) | Poll lifecycle, close/reveal, lock, cancel, unpublish, system archive; visibility **by poll state** |
| **Phase 40** (this file) | User profile, age/region eligibility, ineligible UX, follow-result notification; visibility **by user eligibility** |

**Implementation must satisfy both:**

1. **No collecting-stage result leakage** for any viewer (voter, founder, ineligible, follower)—Phase 39 §4; Phase 40 §6.
2. **Ineligible / followed users** may see basic poll information and **public** results after reveal, but not collecting-stage aggregates—Phase 40 §6; Phase 39 §13.
3. **Founders** cannot see intermediate vote/result/progress signals during collecting—Phase 39 §14; Phase 40 §11.
4. **Ranking / feed** must not use answer-direction or collecting progress to manipulate pre-vote discovery (`AGENTS.md` §7).

When Phase 39 and Phase 40 are implemented, handoff documents should cite both files and any agent spec deltas.

---

## 16. Privacy and integrity checklist (Phase 40 implementation gate)

When Phase 40 is implemented, engineering must verify:

1. **No durable user–option linkage** from profile, follow, or notification flows (`AGENTS.md` §3).
2. **No collecting-stage result leakage** to ineligible users (§6; Phase 39 §4).
3. **No founder intermediate signals** during collecting (§11; Phase 39 §14).
4. **Self-declared eligibility** copy does not imply verification (§3).
5. **Ranking / feed** does not use answer-direction or ineligible-user engagement to steer pre-vote discovery (`AGENTS.md` §7).
6. **Logs / metrics / notifications** do not pair `option_id` (or equivalent) with user, session, device, or request identifiers.

---

## 17. Document validation note

This file is **docs-only**. It does not alter schema, migrations, APIs, frontend bundles, or tests. Implementation phases must reference this policy in their own handoff documents and agent spec deltas as needed.
