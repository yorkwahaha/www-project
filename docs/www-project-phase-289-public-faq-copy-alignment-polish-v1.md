# WWW Project Phase 289 — Public FAQ Copy Alignment Polish v1

**Status:** presentation-only copy polish — aligns `/faq` visitor copy with recent login / registration / profile / release-status messaging. Small targeted fixes only; no full FAQ rewrite and no new release-execution / NOT EXECUTED documentation arc.

**No runtime API behavior, DB, migration, schema, auth resolver, creator session, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline HEAD:** `2138f60` (`origin/master` after Phase 288 my-polls empty-state copy polish).

**Authoritative release status (unchanged):** launch approved for manual release preparation; operator release execution authorized; actual deployment **NOT EXECUTED**; no deploy scripts added; no production configuration changed.

---

## 1. Purpose

Phase 289 reviews `/faq` static fallback and `PUBLIC_FAQ_*` synced copy for consistency with:

1. Registration does not auto-login or create a browser session.
2. Login establishes header account-name display.
3. Profile completion does not guarantee vote eligibility.
4. Vote guidance does not promise eligibility outcomes before submit.
5. Collecting results do not show vote counts / percentages (hidden aggregate).
6. Public MVP is not formally launched for general visitors.
7. Project release records remain **NOT EXECUTED** (no deploy scripts / production config changes in this phase).

---

## 2. Review findings

| Check | Status | Notes |
|-------|--------|-------|
| Registration no auto-login | **Already aligned** | `PUBLIC_FAQ_ACCOUNT_FLOW_INTRO`（不會自動登入） |
| No browser session on registration | **Already aligned** | same constant（也不會建立瀏覽器工作階段） |
| Login shows account name | **Already aligned** | `PUBLIC_FAQ_ACCOUNT_FLOW_LOGIN_STEP` |
| Profile no eligibility guarantee | **Already aligned** | profile step + eligibility hint（不表示可保證） |
| Pre-vote / vote guidance neutral | **Polished** | `PUBLIC_FAQ_PARTICIPANT_VOTE_STEP` |
| Hidden aggregate / collecting | **Already aligned** | collecting steps（不顯示票數、百分比）use `PUBLIC_VOTE_POLICY_COLLECTING_HIDDEN_TEXT` |
| `quality_badge` copy | **Already aligned** | FAQ lists「回饋良好」(`positive_feedback`) as feedback only |
| Not formally launched | **Polished** | `PUBLIC_FAQ_PAGE_BANNER_BODY` |
| Deployment NOT EXECUTED | **Preserved** | no deploy scripts; no production config; FAQ uses visitor wording only |

---

## 3. Copy changes

| Constant / surface | Before | After |
|--------------------|--------|-------|
| `PUBLIC_FAQ_PAGE_BANNER_BODY` (new) | — | **政策說明頁：展示用，不儲存。以下為公開 MVP 規則摘要；本產品尚未正式對外上線，部分功能尚未開放，上線後以系統狀態與公告為準。** |
| `faq.html` `#faq-page-banner` | 公開展示版規則摘要；正式上線後… | Same as constant |
| `PUBLIC_FAQ_PARTICIPANT_VOTE_STEP` | …送出當下由系統處理，並判定是否可計票。 | **…送出當下由系統判定是否可計票。此說明不代表一定可以完成投票。** |
| `faq.html` `#faq-participant-vote-step` | (old vote step) | Same as constant |

`faq-page.js` syncs `#faq-page-banner` via `syncFaqPageOnboardingCopy()`.

---

## 4. Files touched

| File | Change |
|------|--------|
| `public/frontend/public-page-copy.js` | `PUBLIC_FAQ_PAGE_BANNER_BODY`; `PUBLIC_FAQ_PARTICIPANT_VOTE_STEP` |
| `public/frontend/public-mvp-ui.js` | `PUBLIC_FAQ_ONBOARDING_MESSAGES` allowlist |
| `public/frontend/faq-page.js` | banner sync |
| `public/faq.html` | static fallback alignment |
| `docs/www-project-phase-289-public-faq-copy-alignment-polish-v1.md` | this document |
| `tests/frontend/phase-289-public-faq-copy-alignment-polish.test.ts` | guard tests |
| `tests/docs/phase-289-public-faq-copy-alignment-polish-doc.test.ts` | doc tests |
| `README.md` | Phase 289 index |

---

## 5. Fixed boundaries (unchanged)

- Raw Option Linkage Ban preserved
- vote-by-index `{ option_index }` only; eligibility-before-option-resolve unchanged
- Official Vote transaction order unchanged
- result visibility / lifecycle state machine / result evaluator unchanged
- `UserAuthResolver` / registration / login / session unchanged
- creator session / ownership / lifecycle API unchanged
- no API / DB / migration changes
- `quality_badge`: `positive_feedback` →「回饋良好」only
- no hidden aggregate
- no deploy scripts; no production configuration changes
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

**Phase 289 complete — public FAQ copy alignment polish only.**

Actual deployment remains **NOT EXECUTED**. No deploy scripts or production configuration were added or changed.

**Phase 290 blockers: none identified.**

---

## 8. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```
