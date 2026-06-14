# WWW Project Phase 247 — Public Share Link Runtime Review Checkpoint v1

**Status:** review checkpoint, focused guard tests, docs, and README index only. Audits Phase 246 public share link presentation polish (`public-share-link-layout.js`, vote/results/my-polls/create-poll share wiring, static HTML share hosts, `server.ts` static ES module route, and `smoke-public-local.mjs` coverage).

**No runtime change, no API change, no frontend behavior change, no migration, no schema change.** Review documentation and guard tests only.

**No runtime, frontend behavior, API behavior, DB schema, migration, auth resolver, creator ownership rules, lifecycle transition logic, vote evaluator, result evaluator, Official Vote transaction order, vote-by-index eligibility-before-resolve, `quality_badge` derivation, `quality_badge` display gate, logging, metrics, analytics, APM, trace, debug payload, or error payload behavior changed.**

**Baseline:** `origin/master` after Phase 246 public share link presentation polish (`7138b6a`).

**Prior delivery:** [Phase 246 public share link presentation polish](./www-project-phase-246-public-share-link-presentation-polish-v1.md).

**Prior milestone:** [Phase 245 public presentation hierarchy milestone checkpoint](./www-project-phase-245-public-presentation-hierarchy-milestone-checkpoint-v1.md).

---

## 1. Review Purpose

Phase 247 reviews Phase 246 share-link presentation to confirm:

1. Share rows are frontend presentation only across `/vote/:pollId`, `/results/:pollId`, `/my-polls?live=1`, and create-poll success.
2. `copyTextToClipboard` uses Clipboard API → `execCommand` → `prompt` fallback only; no `localStorage`, `sessionStorage`, cookies, analytics, metrics, APM, or debug tracking.
3. Share URLs use existing `/vote/:pollId` and `/results/:pollId` rules only; no share token, short link, QR code, social SDK, or query tracking parameters.
4. `public-share-link-layout.js` does not call `fetch`, does not echo foreign `error.message` / backend internal codes / stack traces, and does not create option choice + user/session/device/request/log/trace/metric/error linkage.
5. Vote, result visibility, creator ownership, lifecycle, auth, profile, and Official Vote boundaries remain unchanged.
6. `src/http/server.ts` adds only `GET /frontend/public-share-link-layout.js` static file serving; no new API route or business logic.
7. `scripts/smoke-public-local.mjs` adds smoke coverage for the layout module only.

---

## 2. Phase 246 Delivery Under Review

| Area | Phase 246 change | Review focus |
|------|------------------|--------------|
| `public-share-link-layout.js` | Shared share row/section helpers (`PUBLIC_SHARE_LINK_ROW_LAYOUT_ORDER`), `copyTextToClipboard`, URL builders | presentation + clipboard feedback only |
| `vote.html` | `#vote-detail-share-links` host in side panel | static shell host only |
| `results.html` | `#results-detail-share-links` host in visibility hints region | static shell host only |
| `vote-page.js` | `syncVotePageShareLinks` after poll detail load | mount only; vote flow unchanged |
| `result-page.js` | `syncResultsPageShareLinks` after result paint | mount only; result evaluator unchanged |
| `my-polls-page.js` | `mountCreatorOwnedPollShareLinks` in creator owned poll secondary slot | replaces bare copy button; lifecycle POST unchanged |
| `create-poll-page.js` | `renderPollSharePanel` via shared layout | success panel only; POST `/creator/polls` unchanged |
| `public-mvp-ui.js` | Re-exports share helpers from layout | backward-compatible exports |
| `public-mvp.css` | Phase 246 share section rhythm | CSS only |
| `src/http/server.ts` | Static route for layout ES module | static serve only |
| `scripts/smoke-public-local.mjs` | Fetch `/frontend/public-share-link-layout.js` + denylist snippet check | smoke coverage only |

**Not modified by Phase 246:** backend vote/result/creator/auth route handlers, migrations, `UserAuthResolver`, lifecycle state machine, result evaluator, vote transaction order, eligibility-before-option-resolve, profile fields, registration/login/session semantics.

---

## 3. Share Link Flow Under Review

```text
pollId + location.origin
  → buildPublicVotePath(`/vote/:pollId`) / buildPublicResultPath(`/results/:pollId`)
  → buildAbsoluteUrl (visible full URL for copy + fallback <code>)
  → section title → link label → copy button → inline feedback → fallback plain URL
  → copyTextToClipboard(url) on click
       → navigator.clipboard.writeText
       → execCommand('copy') fallback
       → prompt('請手動複製以下連結：', url) fallback
  → inline feedback: 已複製連結 / 手動選取下方完整網址
  → no fetch, no storage, no analytics, no option_id in clipboard path
```

### 3.1 Surface wiring

| Surface | Helper | Host |
|---------|--------|------|
| `/vote/:pollId` | `syncVotePageShareLinks` | `#vote-detail-share-links` |
| `/results/:pollId` | `syncResultsPageShareLinks` | `#results-detail-share-links` |
| `/my-polls?live=1` owned poll | `mountCreatorOwnedPollShareLinks` | `.mvp-creator-owned-poll-share-links` |
| `/polls/new` success | `renderPollSharePanel` | create-poll success region |

---

## 4. Runtime Review Checkpoint Conclusion

Phase 247 found **no privacy, auth, creator API, lifecycle, vote transaction, result visibility, API contract, `quality_badge` governance, or linkage gap** in the Phase 246 share-link presentation requiring a frontend, API, schema, auth, vote-backend, or result-evaluator patch.

**APPROVED — Phase 246 share link presentation is frontend-only; no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.**

### 4.1 `copyTextToClipboard` is presentation-only

- Uses `navigator.clipboard.writeText`, `document.execCommand('copy')`, or `prompt` only.
- Does not read or write `localStorage`, `sessionStorage`, `indexedDB`, or cookies.
- Does not emit analytics, metrics, APM, `console.*` logging, or debug payloads.
- Does not record user, device, request, session, or option choice linkage on success or failure.
- Copy feedback uses fixed user-facing copy (`已複製連結。`, `請手動選取下方完整網址。`); no foreign `error.message` echo.

### 4.2 Share URL rules unchanged

- Vote path: `/vote/${encodeURIComponent(pollId)}`.
- Results path: `/results/${encodeURIComponent(pollId)}`.
- No share token, short link, QR code, social SDK, `utm_`, or query tracking parameters.
- Clipboard text is the same absolute URL shown in the fallback `<code class="share-url">` row.

### 4.3 Vote / result / creator boundaries unchanged

| Boundary | Status |
|----------|--------|
| vote-by-index body `{ option_index }` only | **Fixed** |
| eligibility-before-option-resolve in Official Vote transaction | **Fixed** |
| result visibility tiers and `renderResultDisplay` evaluator | **Fixed** |
| collecting / cancelled / unpublished hide counters, option breakdown, hidden aggregate | **Fixed** |
| creator lifecycle `confirmLifecycleTransition` + POST flow | **Fixed** |
| `GET /creator/session`, `GET /creator/polls`, `POST /creator/polls` semantics | **Fixed** |
| creator ownership and session behavior | **Fixed** |

### 4.4 `server.ts` static route only

- Added block: `GET /frontend/public-share-link-layout.js` → `sendPublicFile('frontend/public-share-link-layout.js')`.
- No new REST API, no auth middleware change, no vote/result/creator handler change, no DB access.

### 4.5 Smoke script change is coverage-only

- `smoke-public-local.mjs` now fetches `/frontend/public-share-link-layout.js` and checks `renderPollSharePanel` / `share-url` snippet against `PUBLIC_JSON_DENYLIST`.
- `public-mvp-ui.js` smoke check updated to expect re-export of `public-share-link-layout.js` while retaining `buildAbsoluteUrl` in MVP UI.

### 4.6 Raw Option Linkage Ban preserved

- Share helpers copy poll-level URLs only (`pollId` in path).
- No durable or observability linkage of option choice to user, session, device, request, or traceable identifier was introduced.

---

## 5. Focused Guard Tests

- `tests/frontend/phase-247-public-share-link-runtime-review-checkpoint.test.ts`
- `tests/docs/phase-247-public-share-link-runtime-review-checkpoint-doc.test.ts`

Phase 246 delivery guard tests remain the baseline:

- `tests/frontend/phase-246-public-share-link-presentation-polish.test.ts`
- `tests/docs/phase-246-public-share-link-presentation-polish-doc.test.ts`

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

## 7. Agent Self-Check

```text
I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.
```

Phase 247 is review documentation and guard tests only. No migration, schema DDL, runtime, API, DB, or frontend behavior changes.
