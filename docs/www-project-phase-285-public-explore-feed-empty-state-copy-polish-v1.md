# WWW Project Phase 285 — Public Explore Feed Empty State Copy Polish v1

**Status:** presentation-only copy polish — implements Phase 282 backlog candidate **BL-282-07** (explore feed empty-state messaging). Updates `/explore` empty-state copy only; no API, DB, backend, auth, vote, result, lifecycle, or ranking behavior change.

**No runtime API behavior, DB, migration, schema, auth resolver, creator ownership, lifecycle state machine, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, logging, metrics, analytics, APM, trace, or debug payload behavior changed.**

**Baseline HEAD:** `b0cd39c` (`origin/master` after Phase 284 documentation cleanup / release docs cross-link implementation).

**Backlog linkage:** [Phase 282 product backlog seed plan](./www-project-phase-282-public-mvp-post-authorization-product-backlog-seed-plan-v1.md) — **BL-282-07** (later runtime improvement candidates → explore feed empty-state messaging; presentation-only).

---

## 1. Purpose

When `/polls/feed` returns zero display-safe items, `/explore` shows the empty-state panel (`#explore-empty`). Phase 285 polishes that copy so visitors understand:

1. There are currently **no browsable public polls** on the explore feed.
2. They may **return later** or **create a new poll** using the existing CTA.

Loading, load-failure, and load-more-unavailable copy are **unchanged**.

---

## 2. Copy changes

| Constant | Before | After |
|----------|--------|-------|
| `PUBLIC_EXPLORE_EMPTY_MESSAGE` | 目前沒有正在收集中的公開問卷。 | **目前沒有可瀏覽的公開問卷。** |
| `PUBLIC_EXPLORE_EMPTY_SUMMARY` | 你可以先發起一則問卷並分享投票連結。 | **請稍後再回來看看，或建立一則新問卷。** |
| `PUBLIC_EXPLORE_EMPTY_CTA_LABEL` | 建立問卷 | **unchanged** |

Status region (`#explore-status`) continues to announce `EXPLORE_FEED_EMPTY_MESSAGE` (re-export of `PUBLIC_EXPLORE_EMPTY_MESSAGE`) when the feed loads with zero items.

Existing CTA preserved: `/polls/new?live=1` with label `建立問卷`.

---

## 3. Files touched

| File | Change |
|------|--------|
| `public/frontend/public-mvp-ui.js` | `PUBLIC_EXPLORE_EMPTY_MESSAGE` / `PUBLIC_EXPLORE_EMPTY_SUMMARY` |
| `public/explore.html` | static empty-state fallback aligned with runtime sync |
| `docs/www-project-phase-285-public-explore-feed-empty-state-copy-polish-v1.md` | this document |
| `tests/frontend/phase-285-public-explore-feed-empty-state-copy-polish.test.ts` | guard tests |
| `tests/docs/phase-285-public-explore-feed-empty-state-copy-polish-doc.test.ts` | doc tests |
| `README.md` | Phase 285 index |

`public/frontend/explore-page.js` — **no logic change**; continues importing shared constants via `public-mvp-ui.js`.

---

## 4. Unchanged surfaces

| Surface | Copy | Status |
|---------|------|--------|
| Loading | `載入探索列表中，請稍候。` | unchanged |
| Initial load failure | `目前無法載入探索列表，請稍後再試。` | unchanged |
| Load-more failure | `目前無法載入更多問卷，請稍後再試。` | unchanged |
| Populated feed status | `顯示公開問卷列表（依最近發布排序；非熱門、票數、個人化或榜單。）` | unchanged |
| Feed API | `GET /polls/feed` | unchanged |
| Feed item allowlist | `poll_id`, `title`, `category`, `status`, `published_display`, `result_page_url`, `quality_badge` | unchanged |

---

## 5. Fixed boundaries (unchanged)

- Raw Option Linkage Ban preserved
- vote-by-index `{ option_index }` only; eligibility-before-option-resolve unchanged
- Official Vote transaction order unchanged
- result visibility / lifecycle state machine / result evaluator unchanged
- `UserAuthResolver` unchanged
- registration / `/users/me` / profile / creator session boundaries unchanged
- `quality_badge`: `positive_feedback` →「回饋良好」only; presentation-only; not used for ranking/recommendation/personalization/trust/score/governance
- no hidden aggregate in explore empty state
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

**Phase 285 complete — explore feed empty-state copy polish only.**

**Phase 286 blockers: none identified.**

---

## 8. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```
