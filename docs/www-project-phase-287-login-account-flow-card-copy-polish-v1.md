# WWW Project Phase 287 — Login Account Flow Card Copy Polish v1

**Status:** presentation-only copy polish — implements Phase 286 follow-up **BL-286-01** (login account-flow value card wording). Updates `/login` account-flow card body only; no API, DB, backend, auth, vote, result, lifecycle, or session behavior change.

**No runtime API behavior, DB, migration, schema, auth resolver, session issuance, cookie, verifier, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline HEAD:** `eb17a11` (`origin/master` after Phase 286 public MVP copy consistency review checkpoint).

**Backlog linkage:** [Phase 286 copy consistency review checkpoint](./www-project-phase-286-public-mvp-copy-consistency-review-checkpoint-v1.md) — **BL-286-01**.

---

## 1. Purpose

The `/login` account-flow value card (`帳號流程`) previously omitted that registration does not create a browser session. Phase 287 aligns that card with registration-page and shared onboarding copy so visitors understand:

1. Registration only creates account and profile fields.
2. Registration does **not** auto-login and does **not** create a browser session.
3. Signing in after registration is what establishes the signed-in header state.

Copy stays concise; no new technical jargon for end users.

---

## 2. Copy change

| Surface | Before | After |
|---------|--------|-------|
| `PUBLIC_LOGIN_ACCOUNT_FLOW_CARD_BODY` (new) | — | **註冊只建立帳號與個人資料欄位，不會自動登入，也不會建立瀏覽器工作階段。請用相同憑證登入後，頁首才會顯示帳號名稱。** |
| `login.html` `#login-account-flow-card-body` | 註冊只建立帳號與個人資料欄位，不會自動登入。完成後請使用相同憑證到登入頁登入；登入才會在頁首顯示帳號名稱。 | Same as constant |

`login-page.js` syncs the card body at runtime via `syncLoginAccountFlowCardCopy()`.

---

## 3. Files touched

| File | Change |
|------|--------|
| `public/frontend/public-page-copy.js` | `PUBLIC_LOGIN_ACCOUNT_FLOW_CARD_BODY` |
| `public/frontend/public-mvp-ui.js` | allowlist entry in `PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES` |
| `public/frontend/login-page.js` | `syncLoginAccountFlowCardCopy()` + onboarding sync hook |
| `public/login.html` | static fallback + element id |
| `docs/www-project-phase-287-login-account-flow-card-copy-polish-v1.md` | this document |
| `tests/frontend/phase-287-login-account-flow-card-copy-polish.test.ts` | guard tests |
| `tests/docs/phase-287-login-account-flow-card-copy-polish-doc.test.ts` | doc tests |
| `README.md` | Phase 287 index |

---

## 4. Unchanged surfaces

| Surface | Status |
|---------|--------|
| `POST /login/session` | unchanged |
| `POST /registration` | unchanged |
| `UserAuthResolver` / session schema / cookie / verifier | unchanged |
| Login primary/secondary leads, banner, form hints | unchanged |
| Registration page copy | unchanged |

---

## 5. Fixed boundaries (unchanged)

- Raw Option Linkage Ban preserved
- vote-by-index `{ option_index }` only; eligibility-before-option-resolve unchanged
- Official Vote transaction order unchanged
- result visibility / lifecycle state machine / result evaluator unchanged
- registration: no auto-login, no `Set-Cookie`, no `GET /users/me` after success
- `/users/me` ceiling: `user_id` / `display_name` only
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

**Phase 287 complete — login account-flow card copy polish only.**

**Phase 288 blockers: none identified.**

---

## 8. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```
