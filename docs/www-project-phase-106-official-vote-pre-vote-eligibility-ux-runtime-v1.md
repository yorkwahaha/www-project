# WWW Project Phase 106 — Official Vote Pre-vote Eligibility UX Runtime v1

**Status:** frontend runtime + focused tests + docs. Implements the Phase 105 vote-page pre-vote UX as a neutral, non-blocking hint. This phase does not change DB schema, migrations, backend auth, `UserAuthResolver`, `GET /users/me` response shape, `GET`/`PUT /users/me/profile` behavior, `POST /registration`, login session routes, Official Vote transaction order, vote evaluator logic, `vote-by-index` eligibility before option resolve, vote token schema, counter schema, Reference Answer, ranking, personalization, analytics, or demographic breakdowns.

**Baseline:** Phase 105 plan at `40b3cb67c3f89a3cf973ca76a2e6f3ce5061ca44`.

---

## Runtime Behavior

Phase 106 adds `public/frontend/official-vote-pre-vote-hints.js` and mounts it from `public/frontend/vote-page.js` after poll detail is loaded. The hint does not block poll browsing, does not auto-navigate, and does not auto-submit votes.

### Anonymous visitor

- Shows neutral copy that formal voting may require login.
- Provides a user-clicked `/login` link.
- Does not call `GET /users/me/profile`.
- Does not show profile completeness or eligibility details.

### Signed-in visitor with incomplete profile

- Reads `GET /users/me/profile` with `credentials: 'same-origin'`.
- Uses only `birth_year_month === null` or `residential_region === null`.
- Shows a neutral `/profile` prompt when either field is null.
- Does not say the user is eligible or ineligible and does not guarantee a vote can be counted.

### Signed-in visitor with complete profile

- Shows a general pre-submit reminder that vote handling happens at submit time.
- Does not guarantee that the user can vote.
- Does not expose age thresholds, region allowlists, trust/role requirements, or other rule details.

---

## Vote Submit Copy

Frontend vote-submit failures now map to one neutral message:

```text
目前無法完成這次投票。請確認已登入並完成必要的個人資料後再試；若問題持續，請稍後再試。
```

The frontend does not distinguish age, region, trust, role, duplicate, invalid option, token, counter, shard, session, cookie, user id, or internal option identity in user-visible failure copy. Backend response shapes are unchanged.

Vote success remains generic:

```text
投票已送出，感謝參與。
```

It does not display `option_id`, token, counter, shard, personalized result previews, or demographic breakdowns.

---

## Raw Option Linkage Ban

The pre-vote hint runtime:

- does not call vote APIs.
- does not resolve `option_index` to `option_id`.
- does not read or store the selected option.
- does not write local storage, session storage, IndexedDB, logs, metrics, traces, analytics, or error payloads.
- does not create option choice + user/session/device/request/log/trace/metric/error linkage.

The existing vote form still keeps only ephemeral in-page selection state until the user explicitly submits, and clears that state after submit, navigation, and BFCache restore as guarded by existing tests.

---

## `/registration` Boundary

`/registration` remains unchanged:

- keeps `data-login-state-read="disabled"`.
- does not mount the vote-page pre-vote hint.
- does not read login state for this prompt.
- does not call `GET /users/me/profile` from registration UI.

---

## Files

- `public/frontend/official-vote-pre-vote-hints.js`
- `public/frontend/vote-page.js`
- `public/frontend/public-mvp-ui.js`
- `public/frontend/policy-ui-placeholders.js`
- `public/frontend/public-mvp-layout.js`
- `public/frontend/public-mvp.css`
- `public/vote.html`
- `tests/frontend/phase-106-official-vote-pre-vote-eligibility-ux.test.ts`
- `tests/frontend/phase-106-official-vote-pre-vote-eligibility-copy-guard.test.ts`
- `tests/docs/phase-106-official-vote-pre-vote-eligibility-ux-runtime-doc.test.ts`

---

## Validation

```text
git diff --check
npm run typecheck
npm test
npm run build
npm run smoke:public:local
```

`design-drafts/` remains outside the committed delivery scope.
