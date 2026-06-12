# WWW Project Phase 171 — Poll Quality Feedback Mechanism Product Spec v1

**Status:** docs/spec only. Defines a future post-vote poll quality feedback mechanism for product alignment. **Not implemented.** No runtime behavior, frontend JS/CSS, backend, API, DB schema, migration, `UserAuthResolver`, vote evaluator, Official Vote transaction order, `vote-by-index` eligibility before option resolve, vote token schema, counter schema, Reference Answer, result visibility, ranking, personalization, analytics, logging, metrics, APM, trace, debug payload, or error payload behavior is changed by this phase.

**Baseline:** `origin/master` after Phase 170 Public MVP Showcase Readiness Milestone (`1bb7315`).

**Prior checkpoint:** [Phase 170 Public MVP showcase readiness milestone](./www-project-phase-170-public-mvp-showcase-readiness-milestone-v1.md).

**Related policy draft (separate, not implemented):** [Quality question incentive policy draft](./www-project-quality-question-incentive-policy-draft-v1.md).

---

## 1. Purpose

After a user completes an allowed Official Vote attempt, the product **may** ask for lightweight, optional feedback about poll quality. The goal is to encourage positive contribution habits—clear questions, fair options, thoughtful topics—without creating option-choice linkage, creator punishment surfaces, ranking manipulation, or analytics tracking.

Phase 171 defines:

1. why the proposed MVP feedback tags exist and how they are interpreted.
2. when feedback may appear in the post-vote UX.
3. privacy and integrity boundaries preserving Raw Option Linkage Ban.
4. explicit non-goals and compatibility constraints with existing vote, result, and Reference Answer rules.
5. future-open questions for a later implementation phase.

**Core principle:** Poll quality feedback is **participant perspective only**. It must not become a durable bridge between a user's selected option and their feedback, and must not feed pre-vote ranking or in-collection answer-direction signals.

---

## 2. Non-Goals

Phase 171 does **not**:

- implement runtime, frontend JS/CSS, backend, API, schema, migration, or auth changes.
- change vote token schema, counter schema, Official Vote transaction order, or `vote-by-index` eligibility-before-resolve behavior.
- change eligibility rules, result visibility tiers, or Reference Answer storage/memory rules.
- store or expose option choice + user/session/device/request/log/trace/metric/error payload linkage.
- introduce logs, metrics, analytics, tracking, APM traces, ranking personalization, or creator scoring runtime.
- create creator-facing punishment UI, public shame labels, or per-voter feedback attribution.
- claim that poll quality feedback is live in the product.

---

## 3. Proposed MVP Feedback Tags

Future runtime may present up to five single-select or multi-select tags. MVP proposal:

| Tag | Polarity | Primary intent |
|-----|----------|----------------|
| **表達清楚** | Positive | Question and options are understandable |
| **選項公平** | Positive | Options are balanced and not manipulative |
| **值得思考** | Positive | Topic invites meaningful reflection |
| **期待結果** | Positive | Participant is interested in the eventual aggregate outcome |
| **題目不優** | Soft negative | Participant felt the poll quality was low |

Feedback must remain **optional** and **lightweight**: one tap or skip, no free-text requirement, no modal blocking navigation away from the vote success path.

---

## 4. Tag Rationale and Interpretation

### 4.1 Why these five tags

The five tags were chosen to cover distinct, non-overlapping quality dimensions that participants can judge **without** needing to know vote counts, creator identity details, or which option they or others selected:

1. **表達清楚** — readability and comprehension of the poll itself.
2. **選項公平** — perceived balance and neutrality of the option set.
3. **值得思考** — intrinsic value of the question as a civic or curiosity prompt.
4. **期待結果** — post-vote engagement with the public outcome (without using answer-direction signals for ranking).
5. **題目不優** — a bounded soft-negative channel so low-quality perception has a dignified outlet instead of abuse, brigading, or option-linked complaint data.

Together they encourage constructive habits ("this was clear / fair / thoughtful / I'm curious about results") while reserving one negative tag for quality concerns, not for attacking creators or voters.

### 4.2「選項公平」replaces overlapping ideas like「無刻意引導」and「中立客觀」

Earlier brainstorms split option balance into multiple near-duplicate tags—for example「無刻意引導」(no deliberate steering) and「中立客觀」(neutral/objective). Those overlap in participant mental models and invite inconsistent tagging.

**「選項公平」** is the consolidated MVP tag. It means:

- options feel mutually comparable and not rigged toward one outcome;
- wording does not obviously nudge toward a preferred answer;
- no option is framed as the "obvious correct" choice unless the poll topic truly requires that framing.

It intentionally does **not** require participants to judge legal neutrality, editorial objectivity, or creator intent—only whether the option set feels fair enough to answer honestly.

### 4.3「表達清楚」means question and options are understandable

**「表達清楚」** applies to **both** the poll question and its options:

- the question text is readable and unambiguous at face value;
- option labels are understandable without hidden context;
- punctuation, typos, or formatting do not block comprehension (distinct from Admin Typo Correction scope).

It does **not** mean "I agree with the premise," "the topic is important," or "the poll should rank higher."

### 4.4「不太想答」as a soft negative signal, not a public shame label

**「不太想答」** is **not** an MVP tag in the five-tag set above. It may appear in future UX copy or as an optional additional soft-negative path. When used, it must be understood as:

- a **participant disengagement** signal ("I didn't feel like answering this kind of question right now");
- **not** a public badge on the poll, creator, or voter;
- **not** a synonym for "this poll is bad and everyone should see that";
- **not** shown to creators as individualized blame or to other users as a warning label.

Contrast with **「題目不優」**, which is quality-focused ("the poll itself felt low quality") rather than mood-focused ("I wasn't in the mood"). A future implementation phase must decide whether to offer both, merge them in UI, or keep only **「題目不優」** for MVP simplicity. Regardless, neither tag may surface as public shame copy.

### 4.5 Optional and lightweight by design

- Feedback is **skippable** with no penalty to voting success.
- No required comment field in MVP.
- No gamification points tied to leaving feedback.
- No blocking overlay that prevents viewing results or leaving the page.
- Copy should frame feedback as "helpful to the community's question culture," not "rate this creator."

---

## 5. When Feedback May Appear

### 5.1 Post-vote only

Feedback UI may appear **only after** a vote attempt reaches an **allowed post-vote UX point**, meaning:

- Official Vote submit succeeded and the product is already in a post-success state; **or**
- another explicitly approved post-vote path documented in a future runtime phase (for example, duplicate-vote denial is **not** an allowed trigger unless separately specified).

Feedback must **not** appear:

- before submit;
- during option selection;
- on explore/homepage cards;
- on results pages as a precondition to viewing aggregates;
- on creator dashboards as a real-time stream tied to identities.

### 5.2 Compatibility with vote success UX

Future runtime must preserve Phase 110 vote success boundaries:

- success copy remains generic (`投票已送出，感謝參與。`);
- feedback prompt is additive and optional, not a replacement for success confirmation;
- feedback must not reveal `option_id`, selected option label, token, counter, shard, or eligibility internals.

---

## 6. Privacy Guard and Raw Option Linkage Ban

Poll quality feedback must comply with `/AGENTS.md` and the three MVP core principles.

### 6.1 Forbidden durable linkages

Do **not** create durable storage or side channels that link:

- `user_id + poll_id + feedback_tag`
- `session_id + poll_id + feedback_tag` when reconstructable to a person
- `request_id + user identifier + poll_id + feedback_tag`
- `poll_id + option_id + feedback_tag` derived from per-user vote knowledge
- any structure that joins a user's **selected option** with their **feedback tags**

If feedback is stored at all in a future phase, it must be **poll-level anonymous aggregate only** unless a separate approved privacy review explicitly defines a stronger model. This spec does not approve per-user feedback rows.

### 6.2 Forbidden observability linkage

Do **not** log, metric, trace, or analytics-record:

- `option_id` or `option_index` together with feedback tags and a user, session, device, request, or traceable identifier;
- feedback payloads in error logs or APM spans;
- creator dashboards fed by real-time per-voter feedback streams.

### 6.3 Ranking and result integrity

- Feedback tags must **not** affect pre-vote ranking, Wonder Flow, explore ordering, trending, or homepage personalization.
- Feedback must **not** use in-collection vote percentages, option growth, or answer-direction signals.
- Feedback must **not** change official results, result visibility tiers, or counter behavior.

### 6.4 Creator and governance posture

- No creator punishment score computed from feedback in MVP.
- No public "shame wall" or visible negative tag counts on poll cards before vote.
- Governance paths (reports, admin typo correction, suspension) remain separate from this lightweight feedback mechanism.

---

## 7. Compatibility Constraints (Unchanged by This Phase)

The following remain fixed; this spec does not authorize changes:

| Area | Constraint |
|------|------------|
| Official Vote body | `{ option_index }` only |
| Transaction order | Vote token creation and counter increment in the same DB transaction |
| Eligibility | Vote-time evaluator only; no feedback-driven eligibility |
| Result visibility | Lifecycle-tier display-safe aggregate rules unchanged |
| Reference Answer | Design B; no durable option storage; runtime memory cleared on `pagehide` / BFCache `pageshow` |
| Registration / login | `POST /registration` does not auto-login; `POST /login/session` is session boundary |
| Profile | `birth_year_month` and `residential_region` only in public profile scope |
| Explore feed | Freshness-only; not hot/ranking/personalized |
| `creator_session` | Local/demo/test creator flow; not production public identity |

---

## 8. Future-Open Questions

A later implementation phase must resolve these explicitly before schema or API work:

1. **Anonymous aggregate only?** Should feedback be stored only as `poll_id + tag + count` with no per-user rows, or is any ephemeral deduplication token allowed without creating linkage risk?
2. **「優質題目」qualification?** Can enough positive tags (`表達清楚`, `選項公平`, `值得思考`, `期待結果`) qualify a poll as "優質題目" for incentive policy drafts—and only after collection ends?
3. **「不太想答」or「題目不優」dominance?** If soft-negative tags dominate aggregate feedback, should that block quality qualification even when positives exist?
4. **Abuse without identity-choice linkage?** How to limit brigading (coordinated negative tagging) without storing `user_id + poll_id + tag` or tying feedback to option choice?
5. **Creator-facing feedback?** Should creators ever see delayed, bucketed, or thresholded aggregate tags—or only internal governance tools separate from this participant prompt?

This phase records the questions only; it does not decide them.

---

## 9. Guard Tests Added

| Test file | Role |
|-----------|------|
| `tests/docs/phase-171-poll-quality-feedback-mechanism-product-spec-doc.test.ts` | Doc + README index guard |

No frontend runtime guard is required for this docs-only phase.

---

## 10. Validation

```bash
npm run typecheck
npm test
npm run build
git diff --check
```

Focused test:

- `tests/docs/phase-171-poll-quality-feedback-mechanism-product-spec-doc.test.ts`

`design-drafts/` remains outside the committed delivery scope.

---

## 11. Privacy and integrity self-check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 171 is documentation only. It does not introduce durable user-option linkage, feedback analytics, creator scoring runtime, or pre-vote answer-direction ranking signals. Raw Option Linkage Ban preserved.

Vote-by-index body remains `{ option_index }` only. Official Vote transaction order unchanged. Reference Answer remains disconnected from `UserAuthResolver` and profile eligibility. Poll quality feedback is **not implemented**.
