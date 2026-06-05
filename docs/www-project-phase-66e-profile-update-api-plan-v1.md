# WWW Project Phase 66E-P — Profile Update API Foundation Plan v1

**Status:** plan/docs/spec only. No runtime API, route, migration, frontend UX, scheduler, ranking, feed, result, notice, personalization, demographic breakdown, or Reference Answer behavior is implemented by this phase.

**Baseline:** `origin/master` @ `63e5c58225ec4d4c75499a5052e4f69fbdc69420`.

**Depends on:**

- [Phase 66 profile eligibility boundary spec](./www-project-phase-66-profile-eligibility-boundary-spec-v1.md)
- [Phase 66B user profile schema foundation](../migrations/010_phase66b_user_profile_foundation.sql)
- [Phase 56 eligibility / collecting privacy guardrails](./www-project-phase-56-eligibility-collecting-privacy-guardrails-v1.md)

---

## 1. Scope

Phase 66E future implementation may add a user-authenticated profile update API foundation for these existing `users` columns only:

- `birth_year_month`
- `residential_region`

The profile remains user-scoped account data. It is not poll-scoped vote data, not creator authority, not demographic reporting data, and not a vote-time eligibility snapshot.

This plan exists to define the API boundary before implementation. A later implementation phase must separately add routes, tests, and any auth wiring after review.

---

## 2. Non-Scope

Phase 66E-P explicitly does not implement or authorize:

- Runtime API routes, route adapters, service changes, frontend UX, migration changes, or schema changes.
- `gender` or any gender-equivalent field in the first profile update API.
- Exact birthday, full date of birth, age in days, timestamped birth data, address, GPS, geocode, neighborhood, postal address, or precise location.
- Demographic breakdowns, demographic charts, demographic exports, or profile-based public result slicing.
- Vote-time eligibility snapshots, historical eligibility rows, profile-at-vote backups, vote replay, vote recalculation, backfill, or changed treatment of already-cast votes.
- Ranking, personalization, Wonder Flow changes, feed changes, result changes, notices changes, scheduler changes, or creator eligibility edits.
- Reference Answer profile eligibility.
- Any durable row, log, metric, trace, cache, debug payload, analytics event, or error payload that links profile eligibility or profile values with selected `option_id`, option text, or `option_index`.

---

## 3. API Draft

The preferred future API shape is:

| Method | Draft path | Purpose |
|--------|------------|---------|
| `GET` | `/users/me/profile` | Return the authenticated user's editable profile fields |
| `PUT` | `/users/me/profile` | Replace the authenticated user's editable profile fields |

Alternative path under review: `/profile`. The implementation phase must choose one path and document the public contract before coding.

Draft `GET` response:

```json
{
  "birth_year_month": "1998-07",
  "residential_region": "TW-TPE"
}
```

Draft `PUT` request:

```json
{
  "birth_year_month": "1998-07",
  "residential_region": "TW-TPE"
}
```

Both fields may be nullable if the user has not provided them:

```json
{
  "birth_year_month": null,
  "residential_region": null
}
```

The API must not accept or return poll option fields, selected option fields, vote tokens, counter shards, result counters, creator session internals, or eligibility decision traces.

---

## 4. Field Validation Draft

### 4.1 `birth_year_month`

Allowed:

- `null`, meaning not provided.
- A normalized `YYYY-MM` string.

Required validation:

- Month must be `01` through `12`.
- Year must be bounded by product policy in the implementation phase; do not infer exact birthday.
- The API must not accept `YYYY-MM-DD`, timestamps, timezone-bearing dates, age in days, exact birthday, or raw date strings that can encode a precise birth date.
- Stored value should remain month-granular, matching the Phase 66B `users.birth_year_month` foundation.

### 4.2 `residential_region`

Allowed:

- `null`, meaning not provided.
- A coarse region code from an approved allowlist, for example jurisdiction-level codes such as `TW-TPE` or an equivalent coarse product policy code.

Required validation:

- Reject addresses, street names, latitude/longitude, geohashes, postal addresses, precise neighborhoods, free-form location text, or high-precision location data.
- Keep the value coarse enough for eligibility checks without creating precise location records.
- The implementation phase must define the initial allowlist source and update process.

### 4.3 Forbidden Fields

The first profile update API must reject or ignore, by explicit contract, fields such as:

- `gender`
- `birthday`, `birth_date`, `date_of_birth`, exact birthday aliases
- `address`, `postal_address`, `lat`, `lng`, `geocode`, precise location aliases
- `poll_id`, `option_id`, `option_text`, `option_index`, `selected_option_index`
- `vote_token`, `shard_id`, result counters, eligibility trace fields

Error responses must be user-safe and must not echo sensitive submitted values when those values could include option choices or precise profile data.

---

## 5. Auth Boundary

The future profile API must use user auth for the current user only.

Rules:

- `creator_session` is not user profile authority.
- `creator_session` must not authorize or deny `/users/me/profile` or `/profile`.
- Creator-owned poll authority remains limited to `/creator/*`.
- Public vote, `vote-by-index`, Reference Answer, public read, result, feed, notices, and scheduler must remain unaffected by `creator_session`.
- A user can update only their own user-scoped profile fields; no admin, creator, poll owner, or client-selected user override is part of this plan.

If user auth is not available in the implementation phase, stop and report instead of substituting `creator_session`, `X-User-Id`, body identity, or a forwarded header as durable production authority.

---

## 6. Privacy Boundary

Profile fields are user-scoped and must not be copied into vote rows, Reference Answer rows, counter rows, logs, metrics, traces, debug payloads, analytics events, or error payloads together with selected option data.

Required durable shapes remain:

- Vote tokens: `user_id + poll_id` only.
- Official vote counters: `poll_id + option_id + shard_id` only.
- User profile: `user_id + birth_year_month + residential_region`, with no selected option fields.

Forbidden durable or side-channel shapes include:

- `user_id + poll_id + option_id + birth_year_month`
- `user_id + poll_id + option_index + residential_region`
- `request_id + profile eligibility decision + selected option_id`
- `creator_session + option_index`
- metric labels such as `vote_denied{region="TW-TPE", option_index="2"}`
- traces, debug payloads, analytics, or error payloads that combine selected option data with profile values or eligibility result

No demographic breakdown is part of this plan. Aggregating results by birth month, age range, region, or eligibility status is out of scope and requires a separate privacy review.

---

## 7. Interaction With Participation Paths

### 7.1 Official Vote and `vote-by-index`

The Phase 66C evaluator remains the only approved profile eligibility runtime behavior.

Required ordering remains:

```text
1. Participation guard
2. Official trust guard
3. Profile / poll eligibility evaluation inside the vote transaction
4. Resolve option_index to internal option_id
5. Write vote token
6. Increment sharded counter
```

Profile eligibility must stay inside the vote transaction and must run before option resolution, token write, or counter increment.

When profile is incomplete or the user is ineligible, `vote-by-index` responses must avoid revealing whether the submitted `option_index` exists. Valid and nonexistent `option_index` submissions on the ineligible path must keep indistinguishable status/body shape and must write no token or counter.

The profile update API must not change already-cast votes. It must not backfill, recalculate, replay, delete, or snapshot historical eligibility.

### 7.2 Reference Answer

Reference Answer remains outside profile eligibility.

Rules:

- Do not apply profile eligibility to Reference Answer.
- Do not require `birth_year_month` or `residential_region` for Reference Answer.
- Do not create Reference Answer option-level counters.
- Do not store Reference Answer selected option choices in durable storage.
- Do not link Reference Answer request data with profile fields in logs, metrics, traces, debug payloads, analytics, or error payloads.

### 7.3 Public Reads, Results, Feed, Notices, Scheduler

The profile update API must not change:

- public poll detail reads
- public result display and display tiers
- collecting counter-free result shells
- public feed freshness-only ordering
- public notices
- lifecycle scheduler behavior
- creator-owned poll APIs

---

## 8. Future Implementation Test Plan

The implementation phase should add targeted tests before or with runtime code:

- `GET /users/me/profile` requires user auth and never accepts `creator_session` as profile authority.
- `PUT /users/me/profile` accepts valid `birth_year_month` and `residential_region`, including nullable values.
- `PUT /users/me/profile` rejects `gender`, exact birthday, precise location, option fields, vote token fields, shard fields, and unexpected sensitive fields.
- Validation errors do not echo precise submitted profile values or option-choice-like fields.
- Updating profile does not create migrations, vote snapshots, demographic breakdown rows, vote event rows, or option-linked audit rows.
- Public vote and `vote-by-index` remain unaffected by `creator_session`.
- Incomplete-profile or ineligible `vote-by-index` valid/nonexistent `option_index` responses remain indistinguishable and write no token/counter.
- Reference Answer remains unaffected by profile eligibility and `creator_session`.
- Logs, metrics, APM traces, debug payloads, analytics, and error payloads do not link profile eligibility/profile values with selected options.
- Public read/result/feed/notices/scheduler behavior remains unchanged.

---

## 9. Rollback / Migration Note

No new migration is needed for Phase 66E-P or the planned first API foundation. The plan uses the existing Phase 66B nullable fields:

- `users.birth_year_month`
- `users.residential_region`

Rollback for a future API-only implementation should be route/service removal or feature gating, not schema rollback, because this plan does not require new tables or columns.

Do not modify existing votes, vote tokens, counters, Reference Answer tokens, public result data, or historical poll data during profile API rollout or rollback.

---

## 10. Implementation Stop Conditions

Stop and report before coding if the implementation appears to require:

- `gender` in the first profile API.
- Exact birthday or precise location.
- `creator_session` as profile/user auth.
- Profile values stored with selected `option_id`, option text, or `option_index`.
- Vote-time eligibility snapshots or historical vote recalculation.
- Reference Answer profile eligibility.
- Demographic result breakdowns.
- Ranking, personalization, feed, result, notice, scheduler, or frontend behavior changes.

---

## 11. Change Log

| Version | Content |
|---------|---------|
| v1 / 66E-P | Plan-only profile update API foundation for `birth_year_month` and `residential_region`; no runtime/schema/frontend changes |
