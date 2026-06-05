# WWW Project Phase 66F-P — Profile UX / Onboarding Plan v1

**Status:** docs/spec/test guard only. No runtime route, frontend UI, API behavior, migration, scheduler, ranking, feed, result, notice, personalization, demographic breakdown, or Reference Answer behavior is implemented by this phase.

**Baseline:** `origin/master` @ `31273cd0abbe5c727688595a0cc0fa5cc851442d`.

**Depends on:**

- [Phase 66 profile eligibility boundary spec](./www-project-phase-66-profile-eligibility-boundary-spec-v1.md)
- [Phase 66E profile update API foundation](./www-project-phase-66e-profile-update-api-plan-v1.md)
- [Phase 56 eligibility / collecting privacy guardrails](./www-project-phase-56-eligibility-collecting-privacy-guardrails-v1.md)

---

## 1. Scope

Phase 66F-P defines the future product boundary for a profile UX and onboarding flow that may let users provide only these existing profile fields:

- `birth_year_month`
- `residential_region`

The UX purpose is limited to collecting coarse user-provided profile data for Official Vote eligibility checks. The profile UX is not a demographic reporting feature, not a ranking feature, not personalization, not creator authority, and not a new participation path.

This phase may add documentation and docs guard tests only.

---

## 2. Non-Scope

Phase 66F-P does not implement or authorize:

- Runtime frontend pages, frontend components, API calls, server routes, service changes, migrations, or schema changes.
- `gender` or any gender-equivalent field in the first profile UX.
- Exact birthday, full date of birth, birth day, timestamps, age in days, address, GPS, geocode, postal address, street address, neighborhood, or precise location.
- Demographic breakdowns, demographic charts, demographic exports, result slicing by profile, ranking, Wonder Flow changes, personalization, recommendation logic, or targeted feed behavior.
- Profile snapshot rows, vote-time eligibility snapshot rows, historical backfill, vote replay, vote recalculation, or changed treatment of already-cast votes.
- Reference Answer profile eligibility.
- Any durable row, log, metric, trace, cache, debug payload, analytics event, or error payload that links profile values or profile eligibility with selected `option_id`, option text, `option_index`, or `selected_option_index`.

---

## 3. Profile Field Copy Principles

Future UI copy for profile fields must be plain, bounded, and purpose-specific.

Allowed copy principles:

- Say that `birth_year_month` is a birth year and month, not a full birthday.
- Say that `residential_region` is a coarse residential region used for eligibility.
- Say that these fields help determine whether the current user can cast an Official Vote on polls with eligibility rules.
- Keep examples coarse, such as `YYYY-MM` and jurisdiction-level region codes.
- Make clear that users may clear nullable profile fields if the API supports null clearing.

Forbidden copy principles:

- Do not ask for `gender`.
- Do not ask for exact birthday, full date of birth, age in days, or birth timestamp.
- Do not ask for home address, street, building, GPS, postal address, neighborhood, or precise location.
- Do not say the data is used for demographic breakdowns, ranking, personalization, creator analytics, public charts, or targeted recommendations.
- Do not present profile completion as a way to influence poll direction or ranking.

---

## 4. Incomplete Profile Prompt Principles

When a user has not filled required profile fields for an eligibility-gated Official Vote, the UI may prompt the user to complete profile data.

Required behavior:

- The prompt must be generic and concise.
- The prompt may say profile information is needed to determine eligibility for Official Vote.
- The prompt must not reveal whether a submitted `option_index` exists.
- The prompt must not reveal an internal `option_id`.
- The prompt must not repeat option text in an error or diagnostic context.
- The prompt must not say which specific condition failed if doing so would help infer poll eligibility boundaries or selected-option validity.
- No token, counter, snapshot, analytics, metric, trace, debug payload, or durable audit row may be written with profile data linked to the selected option.

Recommended user-facing shape:

```text
Please complete your profile before voting.
```

Do not include submitted option data, internal IDs, or precise profile values in the prompt.

---

## 5. Ineligible User Prompt Principles

When profile eligibility determines that a user cannot cast an Official Vote, the UX must use a fixed, simple, non-directional message.

Required behavior:

- Use the same status/body shape for valid and nonexistent `option_index` submissions on the ineligible path.
- Do not say which option, option index, option text, region, birth month, age boundary, or precise condition caused the denial.
- Do not reveal whether the selected option exists.
- Do not offer alternate wording that implies a specific option would have been accepted.
- Do not create a profile eligibility audit trail linked to selected option data.

Recommended user-facing shape:

```text
You are not eligible to vote in this poll.
```

The message must stay about Official Vote eligibility only. It must not become a demographic explanation or a per-option explanation.

---

## 6. `vote-by-index` Privacy Notes

The future profile UX may lead a user back to `vote-by-index`, but it must preserve the existing privacy boundary.

Required constraints:

- Official Vote eligibility stays inside the vote transaction.
- Official Vote eligibility runs before option resolution, vote token write, and counter increment.
- Required ordering remains:

```text
1. User / trust guard
2. Public participation guard
3. Profile eligibility
4. Option resolve
5. Vote token
6. Sharded counter
```

- Incomplete or ineligible profile handling must not distinguish valid `option_index` from nonexistent `option_index`.
- Vote tokens remain `user_id + poll_id`.
- Counters remain `poll_id + option_id + shard_id`.
- The UX must not create local, durable, logged, or analytics state that combines profile/profile eligibility with selected option data.

---

## 7. Reference Answer Non-Scope

Reference Answer remains outside profile eligibility.

Rules:

- Do not require `birth_year_month` or `residential_region` for Reference Answer.
- Do not block Reference Answer based on profile fields.
- Do not apply profile eligibility to Reference Answer.
- Do not persist selected Reference Answer option data.
- Do not create Reference Answer option-level counters.
- Do not link Reference Answer request data with profile fields or profile eligibility in logs, metrics, traces, debug payloads, analytics, error payloads, or durable rows.

---

## 8. `creator_session` Separation

`creator_session` is creator authority only. It must not affect profile UX or public participation surfaces.

Rules:

- `creator_session` must not authorize profile view or profile update UX.
- `creator_session` must not deny profile view or profile update UX.
- `creator_session` must not affect public vote, `vote-by-index`, Reference Answer, public poll read, results, feed, notices, or scheduler.
- Profile UX must use user auth for the current user. If user auth is unavailable, stop and report instead of substituting `creator_session`.
- A creator viewing creator-owned poll pages must not gain profile authority over voters.

---

## 9. Future Frontend Implementation Checklist

A future frontend implementation must verify:

- Only `birth_year_month` and `residential_region` are displayed or submitted.
- No `gender` field is present.
- `birth_year_month` input captures `YYYY-MM` only.
- Exact date inputs and date-of-birth aliases are absent.
- `residential_region` is selected from coarse region choices or coarse codes only.
- Free-form address, GPS, postal address, street, neighborhood, and precise location inputs are absent.
- Profile copy says eligibility only and does not mention demographic breakdown, ranking, personalization, analytics, or creator reports.
- Incomplete-profile prompts do not include option IDs, option indexes, option text, tokens, counters, or precise profile values.
- Ineligible prompts use one fixed, concise message and do not explain exact failing conditions.
- No frontend durable storage is introduced for selected option/profile linkage, including `localStorage`, `sessionStorage`, `IndexedDB`, cookies, URL params, or hidden caches.
- `creator_session` cookies do not change profile UX, public vote, `vote-by-index`, or Reference Answer behavior.

---

## 10. Future Tests Checklist

A future implementation should add tests for:

- Profile onboarding renders only `birth_year_month` and `residential_region`.
- Profile onboarding does not render `gender`, exact birthday, address, or precise location controls.
- Profile copy states eligibility-only use and does not mention demographic breakdown, ranking, personalization, analytics, or creator reporting.
- Missing profile prompts are generic and do not reveal whether a submitted `option_index` exists.
- Ineligible vote responses and UI states are indistinguishable for valid and nonexistent `option_index` submissions.
- Reference Answer remains unaffected by profile completeness and profile eligibility.
- `creator_session` does not affect profile UX, public vote, `vote-by-index`, Reference Answer, public reads, results, feed, notices, or scheduler.
- No profile snapshot, vote-time eligibility snapshot, historical backfill, vote replay, or recalculation is introduced.
- Logs, metrics, APM traces, debug payloads, analytics, error payloads, caches, and durable rows do not link profile/profile eligibility with selected options.
- Official Vote source or integration guards keep profile eligibility before option resolve, token write, and counter increment inside the transaction.

---

## 11. Rollback Note

Phase 66F-P is docs-only. There is no runtime rollback, schema rollback, API rollback, frontend rollback, data migration rollback, or historical data cleanup.

If a future implementation violates this plan, rollback should remove or gate that implementation without changing existing votes, vote tokens, counters, Reference Answer tokens, profile rows, public results, feed data, notices, or scheduler state.

---

## 12. Change Log

| Version | Content |
|---------|---------|
| v1 / 66F-P | Plan-only profile UX and onboarding boundary for `birth_year_month` and coarse `residential_region`; no runtime/frontend/API/schema changes |
