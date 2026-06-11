# WWW Project Phase 107 - Official Vote Pre-vote UX Runtime Review / Hardening v1

**Status:** review, focused guard tests, docs, and smoke coverage only. Reviewed the Phase 106 vote-page pre-vote hint runtime and adjacent public UI surfaces:

- `public/frontend/official-vote-pre-vote-hints.js`
- `public/frontend/vote-page.js`
- `public/frontend/public-mvp-ui.js`
- `public/frontend/policy-ui-placeholders.js`
- `public/frontend/public-mvp-layout.js`
- `public/vote.html`
- Phase 106 tests, docs, and public smoke coverage

No runtime, API, schema, auth, Official Vote backend, vote evaluator, vote transaction order, or `vote-by-index` eligibility-before-option-resolve behavior changed.

---

## Review Conclusion

Phase 106 runtime remains within the approved Phase 105 boundary. The pre-vote UX is a neutral hint only. It does not decide eligibility, does not block browsing, does not auto-navigate, does not auto-submit a vote, and does not resolve public option indexes into internal option IDs.

### 1. Anonymous `/vote/:pollId`

- Shows neutral `/login` guidance.
- Does not call `GET /users/me/profile`.
- Does not display profile completeness details.
- Does not expose age, region, trust, role, or eligibility pass/fail details.

### 2. Signed-in `/vote/:pollId`

- Calls `GET /users/me/profile` only from `official-vote-pre-vote-hints.js`.
- Uses `credentials: 'same-origin'`.
- Reduces the profile response to only `birth_year_month` and `residential_region`.
- Checks only whether either value is `null`.
- Does not read, display, or infer age eligibility, region eligibility, trust eligibility, role eligibility, or overall pass/fail.
- Does not guarantee that a later Official Vote can be counted.

### 3. Pre-vote UX Boundaries

- The hint mounts after poll detail load and remains non-blocking.
- The hint does not call `POST /polls/:id/vote`.
- The hint does not call `POST /polls/:id/vote-by-index`.
- The hint does not resolve `option_index` to `option_id`.
- The hint does not record which option a user is preparing to choose.
- The vote page still submits through the existing explicit user submit path only.
- Existing `vote-by-index` eligibility before option resolve remains unchanged.

### 4. Copy Boundaries

- Pre-vote copy does not say the visitor is eligible or ineligible.
- Pre-vote copy does not expose age thresholds, region conditions, trust rules, or role rules.
- Vote failure copy remains one neutral frontend message.
- Vote success copy remains generic and does not include option, vote token, counter, shard, session, cookie, or user identifiers.

### 5. Raw Option Linkage Ban

No new durable or client-side linkage was introduced between an option choice and a user, session, device, request, log, trace, metric, error payload, or analytics record.

The Phase 107 focused tests intentionally avoid adding fixtures that represent a user's planned option choice. Eligibility failure copy remains option-identity-free.

### 6. Existing Boundaries Preserved

- `GET /users/me` response shape is unchanged.
- `GET /users/me/profile` behavior is unchanged.
- `PUT /users/me/profile` behavior is unchanged.
- `UserAuthResolver` is unchanged.
- Reference Answer remains disconnected from `UserAuthResolver` and profile eligibility.
- `/registration` still keeps `data-login-state-read="disabled"`.
- `creator_session` and `X-User-Id` boundaries are unchanged.
- DB schema and migrations are unchanged.
- Vote token schema remains `user_id + poll_id`.
- Counter schema remains `poll_id + option_id + shard_id`.

---

## Added Guard Coverage

- `tests/frontend/phase-107-official-vote-pre-vote-ux-runtime-guard.test.ts`
  - anonymous pre-vote hint does not call the profile API.
  - signed-in profile parsing keeps only the two nullable profile fields.
  - profile loading uses same-origin credentials.
  - pre-vote runtime remains separate from vote APIs, option resolution, persistent storage, analytics, logs, and traces.
  - scoped frontend copy avoids eligibility outcome and internal identifier leakage.
  - `/registration` remains opted out of login-state reads.

- `tests/docs/phase-107-official-vote-pre-vote-ux-runtime-review-doc.test.ts`
  - locks this review document and README index coverage.
  - checks the preserved runtime/API/schema/auth/vote backend boundaries.

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

`design-drafts/` remains outside the committed delivery scope.

---

## Logs / Metrics / APM / Error Payload Self-check

I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
