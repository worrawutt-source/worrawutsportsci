# WP-SUB-2 — Test Utilities

TEST-only utilities for controlled binary upload/access verification.

## Current status

- **Preflight source: IMPLEMENTED on `development`** — `SNC_WP_SUB_2_Preflight_READONLY_TEST()`.
- **GAS runtime: NOT YET VERIFIED** — the owner must sync this exact source into the TEST GAS project and run the read-only entry point.
- **Runner: NOT IMPLEMENTED.**
- **Read-only Reconciliation: NOT IMPLEMENTED.**
- No Drive upload, file creation, permission change, Sheet write, Script Property write, trigger, notification, external call, or cleanup has been performed by this utility.

Preflight is intentionally conservative. It reports `BLOCKED` for requirements that cannot be established safely from the current GAS runtime or that still require owner-supplied evidence. A `success=true` result means inspection completed; it does not mean the environment is READY.

## Entry point

`SNC_WP_SUB_2_Preflight_READONLY_TEST()`

File: `SNC_WP_SUB_2_Preflight_TEST.gs`

## Hard boundaries

- TEST environment only; synthetic data only.
- Read-only inspection only. No Sheets/Drive/Properties/Cache writes or Drive mutations.
- No LINE, UrlFetch, email, triggers, deployment, migration, or cleanup.
- Do not implement or run the persistent Runner until separately approved.
- Never replay a persistent Runner without first reconciling its manifest and exact existing IDs.
- Do not claim runtime PASS without owner-supplied GAS execution evidence.
