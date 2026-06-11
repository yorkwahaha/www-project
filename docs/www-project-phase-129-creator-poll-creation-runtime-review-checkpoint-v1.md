# WWW Project Phase 129 — Creator Poll Creation Runtime Review Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Reviews `/polls/new` and `/polls/new?live=1` creator poll creation runtime in `create-poll.html`, `create-poll-page.js`, and adjacent creator-flow helpers, building on Phase 58B–59 creator lifecycle polish, Phase 65C-A creator API cutover, Phase 121 my-polls runtime review, and Phase 128 static public copy privacy boundaries.

No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, `GET /users/me` behavior, `GET /users/me/profile` behavior, `POST /registration` behavior, `POST /login/session` behavior, `creator_session` boundary, Reference Answer, ranking personalization, demographic breakdown, analytics linkage, logging, metrics, APM, trace, debug payload, or error payload behavior changed.

**Baseline:** Phase 65C-A live creator frontend cutover and `tests/frontend/create-poll-page.test.ts`.

**Prior checkpoint:** [Phase 128 static public pages copy privacy boundary review](./www-project-phase-128-static-public-pages-copy-privacy-boundary-review-checkpoint-v1.md).

**Prior privacy context:** [Phase 109 official vote privacy guard checkpoint](./www-project-phase-109-official-vote-privacy-guard-checkpoint-v1.md).

---

## Reviewed Surfaces

- `public/create-poll.html`
- `public/frontend/create-poll-page.js`
- `public/frontend/public-mvp-demo.js`
- `public/frontend/poll-lifecycle-controls.js` (`ensureCreatorSessionForLiveMode`)
- `public/frontend/creator-flow-copy.js`
- `public/frontend/policy-ui-placeholders.js`
- `tests/frontend/create-poll-page.test.ts`
- `tests/frontend/poll-lifecycle-controls.test.ts`

---

## Review Checkpoint Conclusion

Phase 129 found no runtime gap requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch. Current creator poll creation runtime remains within approved demo/live separation, creator-session, payload, error-fallback, and Raw Option Linkage Ban boundaries.

### 1. `/polls/new` static showcase and `/polls/new?live=1` live creator flow are explicitly separated

- `parseLiveApiMode(search)` returns true only when `live=1`.
- Default `/polls/new` submit label is `建立問卷（展示用，不儲存）`; live mode uses `建立問卷`.
- Static path calls `submitCreatePollDemo()` and returns `poll_id: 'demo'` with `status: 'demo_static'`.
- Live path calls `ensureCreatorSessionForLiveMode()` then `POST /creator/polls`.
- `create-poll.html` banner states `公開展示版` and `資料不會儲存`.

### 2. Static showcase does not call creator APIs and does not create real polls

- `submitCreatePollDemo()` performs local normalization only; no `fetch`.
- Static success renders demo vote/result/my-polls links using `DEMO_POLL_SLUG` (`/vote/demo`, `/results/demo?ui_state=collecting`).
- Static path does not call `/creator/session` or `/creator/polls`.

### 3. Live creator flow uses existing `creator_session` demo/local/test boundary

- Live submit calls `ensureCreatorSessionForLiveMode()` before `POST /creator/polls`.
- Session bootstrap uses `GET /creator/session`; on localhost-only 401, `POST /creator/session` with seeded `LOCAL_DEMO_CREATOR_USER_ID`.
- Requests use `credentials: 'same-origin'`; creator identity comes from `creator_session` cookie, not client `X-User-Id` headers on create.

### 4. `creator_session` is not production identity

- Live create path does not present `creator_session` as a general user login.
- Creator session bootstrap is limited to `/creator/session` and localhost demo hostname guard in `ensureCreatorSessionForLiveMode()`.
- Static HTML and adjacent copy continue to describe live creator flow as local/demo (`creator_session`).

### 5. `creator_session` does not replace formal login/session

- Create page does not call `POST /login/session`, `GET /users/me`, or `GET /users/me/profile`.
- Create runtime does not read browser `www_session` or mutate user login state.
- Live creator auth remains separate from voter `POST /login/session` boundary.

### 6. `X-User-Id` remains explicit non-production compatibility only

- `submitCreatePoll()` sends only `Content-Type: application/json`; no `X-User-Id` or `X-Display-Name` headers.
- Create page source does not reference `X-User-Id`.
- Non-production `X-User-Id` compatibility remains on other MVP demo paths only, not on creator poll creation.

### 7. Create poll request body does not add profile, eligibility, demographic, analytics, or tracking fields

- Live `POST /creator/polls` body is limited to: `title`, `description`, `options`, `category: 'general'`, `eligible_rule_id: null`, `closes_at`, `publish: true`.
- Form fields for category, close time, and eligibility remain disabled in HTML (`mvp-form-demo-fields`, `aria-disabled="true"`).
- No `birth_year_month`, `residential_region`, `display_name`, demographic, analytics, or tracking keys are sent from create runtime.

### 8. Poll options on create do not establish option-choice + user/session/device/request/log/trace/metric/error linkage

- Options are normalized text labels only; no `option_id`, `option_index` persistence, or per-option counters on create.
- Create flow does not log, metric, trace, or store which option text was typed alongside identity.
- Success UI shares poll links only; it does not reconstruct voter option choices.

### 9. Raw Option Linkage Ban preserved

- Create runtime does not persist `user_id + poll_id + option_id` or equivalent durable linkage.
- No `localStorage`, `sessionStorage`, `IndexedDB`, cookies, or URL query params store option choices on create.
- Create page does not call vote, Reference Answer, or result counter APIs during form submit.

### 10. Create page does not display vote counts, result previews, voter status, eligibility status, or internal identifiers

- Static copy states `收集中看不到期中結果` and `收集中看不到期中票數`.
- Success panels render share/manage links and lifecycle actions; they do not fetch or render result percentages, vote totals, or voter status.
- Disabled future eligibility fields are labeled `正式上線後開放`; create runtime does not evaluate or display eligibility outcomes.

### 11. Create page does not read or display vote token, counter shard, `user_id`, session id, or creator token

- Create runtime does not call vote-token, shard, or counter endpoints.
- Success share URLs expose public poll routes only (`/vote/<pollId>`, `/results/<pollId>`).
- UI does not render `vote_token`, `shard_id`, `session_id`, `www_session`, or raw `user_id`.

### 12. Error handling uses frontend neutral fallback without echoing backend payload or `error.message`

- `submitCreatePoll()` maps network failure, non-OK responses, and JSON parse failure to `目前無法建立問卷，請稍後再試。`
- Backend error bodies are not surfaced to the status region.
- Form validation messages (`請填寫問卷標題。`, `請至少填寫兩個選項。`) are frontend-owned only.
- `ensureCreatorSessionForLiveMode()` failures map to `目前無法確認發起者身分，請稍後再試。`

### 13. Lifecycle boundaries unchanged

- Post-create lifecycle panel uses `lifecycleActionsForState('collecting')` → cancel/close only.
- UI mock preview via `?ui_state=` remains presentation-only on create page; it does not mutate backend lifecycle.
- Collecting / cancelled / revealed / locked / post_lock / unpublished semantics remain delegated to existing lifecycle controls and backend routes.

### 14. Official Vote transaction order unchanged

- Create page does not participate in Official Vote path.
- No vote-token creation, shard assignment, or counter increment on create submit.

### 15. Vote-by-index eligibility before option resolve unchanged

- Create runtime does not call vote-by-index or eligibility evaluators.
- Disabled eligibility form fields are not wired to create payload.

### 16. Reference Answer remains disconnected from UserAuthResolver and profile eligibility

- Create page source does not import or call Reference Answer modules.
- Create runtime does not read profile eligibility or `UserAuthResolver` outputs.

### 17. No new precise location, extra profile fields, demographic breakdown, ranking personalization, or analytics linkage

- Create HTML copy mentions coarse future eligibility placeholders only; fields stay disabled.
- No gender, address, GPS, demographic breakdown, ranking personalization, or analytics hooks in create runtime.

### 18. No new observability linkage

- Phase 129 adds docs/tests only; no new logs, metrics, analytics, debug payloads, or error payloads were introduced.

---

## Raw Option Linkage Ban Conclusion

No new durable or side-channel linkage was introduced between poll creation runtime and an option choice, vote intent, or voter identity in logs, metrics, analytics, APM traces, or error payloads.

- Create submit stores option text as poll definition only; it does not bind option text to a user, session, device, request, or traceable identifier.
- Create success UI does not expose per-user option choices or counter internals.
- Phase 129 review adds docs/tests only; no new option-user linkage paths were introduced.

---

## Boundaries Preserved

- No backend/API/schema/auth/vote evaluator/result evaluator changes.
- Official Vote transaction order unchanged.
- Collecting hidden-count, reveal/lock lifecycle, registration/login-session, and `creator_session` boundaries unchanged.
- Reference Answer remains disconnected from create-page runtime.

---

## Added Guard Coverage

- `tests/frontend/phase-129-creator-poll-creation-runtime-review-checkpoint.test.ts`
  - confirms demo/live separation via `parseLiveApiMode`, `submitCreatePollDemo`, and bootstrap branching.
  - confirms live create payload field allowlist and absence of profile/eligibility/analytics keys.
  - confirms neutral API/session failure copy without backend payload echo.
  - confirms create runtime avoids vote/result/profile/Reference Answer paths and forbidden storage.
  - confirms static HTML demo banner, disabled future fields, and no internal-identifier leakage.

- `tests/docs/phase-129-creator-poll-creation-runtime-review-checkpoint-doc.test.ts`
  - locks this checkpoint document and README index coverage.
  - checks preserved create-flow privacy/auth/creator-session boundaries and Raw Option Linkage Ban.

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
