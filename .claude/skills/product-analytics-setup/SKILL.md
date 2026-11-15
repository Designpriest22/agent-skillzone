---
name: product-analytics-setup
description: Instrument product analytics correctly — event taxonomy, properties, naming, schema versioning, identity, funnels, retention cohorts, North Star metric, trustworthy dashboards. Use when adding tracking or a live analytics dashboard.
---
<!-- Condensed from SkillHub rampstackco/product-analytics-setup v1.0.0. -->
# Product analytics setup

- Events: snake_case, object_action, past tense (`run_started`, `run_finished`). Verbs are events; states are properties.
- 30–50 events max; track semantic actions, not button clicks. When in doubt, instrument less.
- Properties: event-level (immutable payload) vs user-level (joined). Types: enums as strings, numbers as numbers, ISO 8601 timestamps.
- Identity: one canonical layer (anonymous id → user id on sign-in).
- Schema in code (TypeScript), validated on ingest; additive changes ship freely, breaking changes get `_v2`.
- Funnels anchor on a high-intent event, fixed time window, ≤ 6 steps.
- Retention: cohort by first-seen day; compare matched ages; bracket retention for stability.
- North Star: one user-value metric + 3–5 inputs + health metrics.
- Dashboards: each metric has a definition, source, caveats, owner; reproducible queries.
- If data is missing, show the gap — never interpolate numbers.
