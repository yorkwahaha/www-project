# WWW Project Phase 288 — My Polls Empty State Copy Polish v1

**Status:** presentation-only copy polish — improves `/my-polls` live empty-state messaging when the signed-in creator has zero owned polls. Updates empty-state copy constants only; no API, DB, backend, auth, creator session, ownership, lifecycle, vote, or result behavior change.

**No runtime API behavior, DB, migration, schema, auth resolver, creator session issuance, creator ownership rules, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline HEAD:** `21455e9` (`origin/master` after Phase 287 login account-flow card copy polish).

---

## 1. Purpose

When `/my-polls?live=1` loads and `GET /creator/polls` returns zero owned polls, the live manage panel (`#creator-live-manage`) shows an empty-state panel via `renderCreatorPollsEmptyState()`. Phase 288 polishes that copy so creators understand:

1. They currently have **no polls they created** to manage on this page.
2. They can **create a new poll** using the existing CTA.

Loading, sign-in-required, session-failure, and load-failure copy are **unchanged**.

---

## 2. Copy changes

| Constant | Before | After |
|----------|--------|-------|
| `PUBLIC_MY_POLLS_EMPTY_MESSAGE` | 你目前還沒有建立問卷。 | **目前還沒有你建立的問卷。** |
| `PUBLIC_MY_POLLS_EMPTY_SUMMARY` | 你目前還沒有透過本流程建立的問卷。可先建立一則問卷，完成後在此管理並分享投票連結。 | **可前往建立一則新問卷，完成後回到此頁管理。** |
| `PUBLIC_MY_POLLS_EMPTY_HEADLINE` | 你目前還沒有建立問卷 | **目前還沒有你建立的問卷** |

Existing CTA preserved: `/polls/new?live=1` with label `前往建立問卷（即時模式）` (`PUBLIC_CTA_GO_TO_CREATE_POLL_LIVE_LABEL`).

---

## 3. Files touched

| File | Change |
|------|--------|
| `public/frontend/public-mvp-ui.js` | `PUBLIC_MY_POLLS_EMPTY_*` constants |
| `docs/www-project-phase-288-my-polls-empty-state-copy-polish-v1.md` | this document |
| `tests/frontend/phase-288-my-polls-empty-state-copy-polish.test.ts` | guard tests |
| `tests/docs/phase-288-my-polls-empty-state-copy-polish-doc.test.ts` | doc tests |
| `README.md` | Phase 288 index |

`public/frontend/my-polls-page.js` — **no logic change**; continues re-exporting shared constants.

`public/my-polls.html` — **no empty-state static shell** (empty panel is live-mode runtime only); demo dashboard unchanged.

---

## 4. Unchanged surfaces

| Surface | Copy | Status |
|---------|------|--------|
| Loading | `載入你的問卷中，請稍候。` | unchanged |
| Load failure | `目前無法載入你建立的問卷，請稍後再試。` | unchanged |
| Sign-in required | `請先登入，才能查看並管理你建立的問卷…` | unchanged |
| Creator session failure | `PUBLIC_CREATOR_SESSION_FAILURE_MESSAGE` | unchanged |
| Page lead / banner / nav hints | unchanged | unchanged |
| Creator APIs | `GET /creator/polls`, `POST /creator/session` | unchanged |

---

## 5. Fixed boundaries (unchanged)

- Raw Option Linkage Ban preserved
- vote-by-index `{ option_index }` only; eligibility-before-option-resolve unchanged
- Official Vote transaction order unchanged
- result visibility / lifecycle state machine / result evaluator unchanged
- `UserAuthResolver` unchanged
- registration / login / session / `/users/me` boundaries unchanged
- creator session / ownership / lifecycle API unchanged
- `quality_badge`: `positive_feedback` →「回饋良好」only; not used for ranking/recommendation/personalization/trust/score/governance
- no hidden aggregate
- no `localStorage` / `sessionStorage` / analytics / metrics / APM / debug tracking

---

## 6. Validation

```bash
git diff --check
npm test
npm run typecheck
npm run build
npm run migrate:check
npm run smoke:public:local
```

---

## 7. Conclusion

**Phase 288 complete — my-polls empty-state copy polish only.**

**Phase 289 blockers: none identified.**

---

## 8. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```
