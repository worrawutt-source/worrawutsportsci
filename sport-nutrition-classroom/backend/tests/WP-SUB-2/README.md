# WP-SUB-2 — Test Utilities

Reserved for WP-SUB-2 TEST-only utilities, including:

- Preflight checks for TEST configuration and Drive folder safety.
- Controlled test Runner for approved binary upload and access scenarios.
- Read-only post-run reconciliation and evidence reporting.

## Current status

**No test utility has been implemented or authorized for execution in this directory.**

Before implementation, re-fetch the latest `development` source and obtain explicit owner approval of the exact utility behavior, fixture/actor mapping, permitted Drive mutations, failure-injection points, notification stubbing/restoration, and file disposition.

## Hard boundaries

- TEST environment only; synthetic data only.
- No production changes, migrations, triggers, deployment, cleanup, or external LINE/UrlFetch calls.
- Never replay a persistent Runner without first reconciling its manifest and exact existing IDs.
- Do not claim runtime PASS without owner-supplied GAS execution evidence.
