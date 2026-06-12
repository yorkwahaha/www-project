# WWW Project Phase 181 — Post-vote Quality Feedback Frontend UX v1

**Status:** frontend UX foundation. Adds post-vote quality feedback on the public vote success panel only. Calls `POST /polls/:pollId/quality-feedback` with `{ "feedback_tag": "<tag>" }` only. No backend/API/schema/auth/vote/result changes.

**Baseline:** `origin/master` after Phase 180-R quality feedback write API runtime review checkpoint (`a2afa37`).

**Prior specs:**

- [Phase 171 Poll quality feedback mechanism product spec](./www-project-phase-171-poll-quality-feedback-mechanism-product-spec-v1.md)
- [Phase 174 Quality feedback API & runtime boundary planning spec](./www-project-phase-174-quality-feedback-api-runtime-boundary-planning-spec-v1.md)
- [Phase 180 Quality feedback aggregate write API runtime foundation](./www-project-phase-180-quality-feedback-aggregate-write-api-runtime-foundation-v1.md)
- [Phase 180-R Quality feedback write API runtime review checkpoint](./www-project-phase-180r-quality-feedback-write-api-runtime-review-checkpoint-v1.md)

---

## 1. Scope

Phase 181 adds **post-vote quality feedback UX only**:

- Feedback block appears **only after a successful vote** on `/vote/:pollId`.
- Feedback block does **not** appear before voting and does **not** affect the vote flow.
- Five MVP tags: `表達清楚`, `選項公平`, `值得思考`, `期待結果`, `題目不優`.
- User-facing copy:
  - Prompt: `這題給你的感覺是？`
  - Privacy note: `回饋只用來累計題目品質，不會記錄你選了哪個選項。`
  - Success: `已收到，謝謝你的回饋。`
  - Failure: `目前無法送出回饋，稍後可再試一次。`

Demo poll routes keep the existing preview-only placeholder from `policy-ui-placeholders.js` and do not call the write API.

---

## 2. API Payload

Frontend calls:

```http
POST /polls/:pollId/quality-feedback
Content-Type: application/json

{ "feedback_tag": "表達清楚" }
```

The request body must contain **only** `feedback_tag`.

Frontend must **not** send:

- `option_id`, `option_index`, selected option, `user_id`, `session_id`, `request_id`
- device / IP / UA
- trace / metric / error / analytics id
- vote token, counter shard, profile fields

`credentials: 'omit'` is used so feedback submit does not attach cookies by default.

---

## 3. Response Handling

On success, the UI shows only the fixed success copy. It does **not** display:

- `aggregate_count`
- `threshold_state`
- `bucket_state`
- ranking signal
- creator score
- poll result
- option info

On failure, the UI shows only the neutral failure copy. It does **not** display backend error detail, stack, internal code, request id, or trace id.

---

## 4. Duplicate UX

Phase 181 does **not** add durable dedup.

Page-local soft lock only:

- After a successful tag submit on the same page, feedback buttons are disabled.
- No `localStorage`, `sessionStorage`, or cookie.
- No identity linkage.

---

## 5. Privacy & Integrity

- The feedback API does not know which option the user selected.
- Selected option remains in frontend runtime memory only during the vote flow and is cleared per Design B rules before feedback submit.
- No analytics, log, trace, or metric linkage is added in this phase.

---

## 6. Explicit Non-Goals

Phase 181 does not add:

- durable duplicate prevention
- creator-facing feedback display
- threshold / bucket / ranking / creator score UI
- feedback before vote or after failed vote
- changes to Official Vote transaction order
- changes to vote-by-index body `{ option_index }`
- changes to eligibility, auth, Reference Answer, UserAuthResolver, profile fields, `/users/me`, `/users/me/profile`
- `creator_session` production identity boundary changes

**Phase 182** may add a review checkpoint for this frontend UX.

---

## 7. Frontend Artifacts

| File | Role |
|------|------|
| `public/frontend/post-vote-quality-feedback.js` | Post-vote feedback UI + API submit |
| `public/frontend/vote-page.js` | Mount feedback only in `renderVoteSuccess` for non-demo polls |
| `public/frontend/public-mvp.css` | Post-vote feedback styles |

Demo preview placeholder remains in `public/frontend/policy-ui-placeholders.js`.

---

## 8. Tests

| Test file | Role |
|-----------|------|
| `tests/frontend/phase-181-post-vote-quality-feedback-ux.test.ts` | Runtime UX, payload, success/failure copy, pre-vote guard |
| `tests/docs/phase-181-post-vote-quality-feedback-ux-doc.test.ts` | Doc + README index guard |

Retained vote guards:

- `tests/frontend/vote-page.test.ts`
- `tests/http/quality-feedback-routes.test.ts`

---

## 9. Preserved Boundaries

| Boundary | Status |
|----------|--------|
| Raw Option Linkage Ban | Unchanged |
| Official Vote transaction order | Unchanged |
| `vote-by-index` eligibility-before-option-resolve | Unchanged |
| `vote-by-index` body `{ option_index }` | Unchanged |
| Vote token / counter schema | Unchanged |
| Result visibility | Unchanged |
| Eligibility | Unchanged |
| Auth | Unchanged |
| Reference Answer | Unchanged |
| UserAuthResolver | Unchanged |
| Profile fields / `/users/me` / `/users/me/profile` | Unchanged |
| `creator_session` production identity boundary | Unchanged |

---

## 10. Validation

```bash
npm test
npm run typecheck
npm run build
npm run smoke:public:local   # when local server is available
```

Focused tests:

- `tests/frontend/phase-181-post-vote-quality-feedback-ux.test.ts`
- `tests/docs/phase-181-post-vote-quality-feedback-ux-doc.test.ts`

`design-drafts/` remains outside the committed delivery scope.
