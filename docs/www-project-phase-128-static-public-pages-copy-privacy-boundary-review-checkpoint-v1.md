# WWW Project Phase 128 — Static Public Pages Copy / Privacy Boundary Review Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Reviews static public pages and policy copy in `faq.html`, `trust-levels.html`, `index.html`, `explore.html`, `registration.html`, `login.html`, `vote.html`, `results.html`, `my-polls.html`, and adjacent public showcase copy, building on Phase 67/68 public UX copy guards, Phase 45 trust-level preview copy, Phase 76 public demo auth UX closure, and Phase 127 homepage profile prompt runtime review.

No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, `GET /users/me` behavior, `GET /users/me/profile` behavior, `POST /registration` behavior, `POST /login/session` behavior, `creator_session` boundary, Reference Answer, ranking personalization, demographic breakdown, analytics linkage, logging, metrics, APM, trace, debug payload, or error payload behavior changed.

**Baseline:** Phase 67 public profile eligibility UX copy guard and Phase 68–69 public demo copy guard.

**Prior checkpoint:** [Phase 127 homepage profile prompt runtime review](./www-project-phase-127-homepage-profile-prompt-runtime-review-checkpoint-v1.md).

**Prior privacy context:** [Phase 109 official vote privacy guard checkpoint](./www-project-phase-109-official-vote-privacy-guard-checkpoint-v1.md).

---

## Reviewed Surfaces

- `public/faq.html`
- `public/trust-levels.html`
- `public/index.html`
- `public/explore.html`
- `public/registration.html`
- `public/login.html`
- `public/vote.html`
- `public/results.html`
- `public/my-polls.html`
- `public/frontend/auth-state-copy.js`
- `tests/frontend/phase-67-public-ux-copy-guard.test.ts`
- `tests/frontend/phase-68-public-demo-copy-guard.test.ts`
- `tests/frontend/trust-level-preview-copy.test.ts`

---

## Review Checkpoint Conclusion

Phase 128 found no runtime gap requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch. Current static public pages and policy copy remain within approved privacy, eligibility-display, auth, result-visibility, and Raw Option Linkage Ban boundaries.

### 1. FAQ does not imply creator visibility of individual vote choices

- FAQ states collecting-period rules apply to creators as well (`發起者也不例外，無法查看中途統計`).
- FAQ states profile data is not used to publicly expose individual vote records (`不對外公開個人投票紀錄`).
- FAQ does not say creators can inspect which option a specific voter chose.

### 2. FAQ does not imply collecting-period counts or result previews

- FAQ summary cards and answers state collecting hides counts, percentages, rankings, and trends.
- FAQ explicitly says creators cannot view interim statistics during collecting.
- FAQ does not promise live counters, partial result previews, or mid-collection analytics.

### 3. FAQ preserves revealed / locked / post-lock aggregate result boundary

- FAQ explains close/reveal timing, about 5-day public lock period, and post-lock unpublish behavior.
- FAQ distinguishes cancel (no public result) from unpublish after lock period ends.
- FAQ does not imply aggregate results are visible before reveal.

### 4. FAQ does not imply demographic breakdown, ranking personalization, or analytics linkage

- FAQ states profile fields are not used for public demographic breakdown display (`不做公開統計分群展示`).
- FAQ does not describe personalized ranking, analytics dashboards, or voter-status public reads.

### 5. Trust Levels page does not imply live credit score / points / rewards / paid promotion runtime

- `trust-levels.html` banner marks the matrix as draft policy (`草案`) with registration, verification, quota, and permission checks `尚未開放`.
- Credit points, feature points, rewards, paid promotion, and Lv.4 rows are labeled `尚未開放`, `草案`, or `規劃中`.
- Page footer states login, registration, and trust calculation will open later.

### 6. Homepage and public copy do not guarantee voting

- Homepage hero and value cards describe collecting privacy and lock period; they do not say visitors can definitely vote.
- Vote-page static copy says formal voting `可能需要登入` and is decided `送出當下由系統處理`.
- Public copy avoids “you are eligible” or “you can vote for sure” guarantees.

### 7. Homepage and public copy do not display or infer eligibility outcomes

- Static pages do not show `can_vote`, `age_passed`, `region_passed`, or equivalent pass/fail badges.
- FAQ ineligible guidance describes fixed neutral page copy without revealing which rule failed or which option would work.

### 8. Registration copy does not imply auto-login

- `registration.html` states `不會自動登入` and `不會自動建立瀏覽器工作階段`.
- Homepage registration note repeats `只建立帳號，不會自動登入`.
- Registration shell keeps `data-login-state-read="disabled"`.

### 9. Login copy preserves `POST /login/session` session boundary

- `login.html` explains login creates the browser session and controls header signed-in state.
- Login copy directs visitors who only registered to return via `/login`; registration alone does not sign in.
- Login copy distinguishes production credential flow from MVP `X-User-Id` and `creator_session` demo paths.

### 10. Demo / sample / showcase copy is separated from live runtime

- Homepage static poll cards use `data-static-examples="true"` and `靜態範例` / `範例資料` labeling.
- Explore page describes live freshness-only feed separately from homepage static examples.
- My Polls and Results pages mark mock/showcase content and point live flows to `?live=1` / `creator_session` where appropriate.

### 11. Explore / My Polls / Results / Vote public copy avoids public vote-status leakage

- Explore lead copy says the list does not show vote counts or result percentages.
- Vote and Results static copy repeat collecting hidden-count rules.
- My Polls states collecting hides counts and uses mock quota/example labeling.
- Static copy does not expose voter status, eligibility outcomes, or internal identifiers such as `user_id`, session ids, vote tokens, or shard ids.

### 12. `creator_session` boundary preserved

- Static copy marks `creator_session` as local/demo creator flow only (`僅 /creator/*，非一般 user auth`).
- Static copy does not present `creator_session` as production identity.

### 13. No new observability linkage

- Phase 128 adds docs/tests only; no new logs, metrics, analytics, debug payloads, or error payloads were introduced.

---

## Raw Option Linkage Ban Conclusion

No new durable or side-channel linkage was introduced between static public copy and an option choice, vote intent, or voter identity in logs, metrics, analytics, APM traces, or error payloads.

- Static public pages do not instruct visitors to store or transmit `option_id`, `option_index`, or selected option text alongside identity.
- Policy copy does not describe public reads of per-user option choices.
- Static copy review adds docs/tests only; no new option-user linkage paths were introduced.

---

## Boundaries Preserved

- No backend/API/schema/auth/vote evaluator/result evaluator changes.
- Official Vote transaction order unchanged.
- Collecting hidden-count, reveal/lock lifecycle, registration/login-session, and `creator_session` boundaries unchanged.
- Reference Answer remains disconnected from static eligibility-display copy.

---

## Added Guard Coverage

- `tests/frontend/phase-128-static-public-pages-copy-privacy-boundary-review-checkpoint.test.ts`
  - confirms FAQ collecting/reveal/lock copy and absence of creator per-vote-choice implication.
  - confirms Trust Levels draft/not-open disclaimers for credit score, points, rewards, and paid promotion.
  - confirms homepage/demo separation, registration no auto-login, and login session boundary copy.
  - confirms Explore/My Polls/Results/Vote static copy avoids public vote-status and internal identifier leakage.

- `tests/docs/phase-128-static-public-pages-copy-privacy-boundary-review-checkpoint-doc.test.ts`
  - locks this checkpoint document and README index coverage.
  - checks preserved static-copy privacy/auth/result-visibility boundaries and Raw Option Linkage Ban.

---

## Validation

Required validation for this phase:

```text
git diff --check
npm run typecheck
npm test
npm run build
npm run smoke:public:local
```

If Docker Desktop remains unavailable, `npm run smoke:public:local` may be blocked by the local Docker engine rather than by test content. Record the exact blocker in the phase handoff.

`design-drafts/` remains outside the committed delivery scope.

---

## Logs / Metrics / APM / Error Payload Self-check

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
