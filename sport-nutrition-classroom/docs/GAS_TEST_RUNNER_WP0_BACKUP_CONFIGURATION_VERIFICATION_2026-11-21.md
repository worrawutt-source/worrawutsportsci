# GAS Test Runner v1.0 — WP-0 Backup & Configuration Verification

- Document ID: SNC-TEST-RUNNER-WP0-001
- Version: 1.0.0
- Review date: 21 November 2026
- Repository: `worrawutt-source/worrawutsportsci`
- Working branch: `development`
- Snapshot branch: `backup/gas-test-runner-wp0-2026-11-21`
- Status: **PARTIALLY COMPLETE — BLOCKED pending owner-side GAS/Cloudflare verification**

## 1. Purpose and scope

Record the baseline checks and backup actions completed for WP-0 of GAS Test Runner v1.0. This document distinguishes repository evidence from dashboard information supplied by the Project Owner and from items that cannot be independently verified through the connected GitHub access.

No GAS source, GAS deployment, Cloudflare Worker code, Cloudflare configuration, Script Properties, secrets, database schema, or production data were changed during this WP-0 pass.

## 2. GitHub baseline and backup

### 2.1 Repository and branch

- Repository: `worrawutt-source/worrawutsportsci`
- Working branch confirmed: `development`
- A snapshot branch was created from the current `development` ref before this WP-0 report was committed:
  - `backup/gas-test-runner-wp0-2026-11-21`

The snapshot branch preserves the repository tree as it existed at the time of branch creation. It is a Git reference backup, not a backup of the live GAS project or Cloudflare deployment.

### 2.2 Source file blob SHAs observed on development

| File | Blob SHA | Verification |
|---|---|---|
| `sport-nutrition-classroom/proxy/worker.js` | `725c25b5b4a814fa11ee6d1223a3cd92d193a095` | Fetched from development |
| `sport-nutrition-classroom/backend/Code.gs` | `845936d02880cf457d7f4e2bbb2ec466b0cb77c4` | Fetched from development |
| `sport-nutrition-classroom/backend/AssignmentManagement.gs` | `25be673a0f56425d925f52b3ec979aee24672622` | Fetched from development |
| `sport-nutrition-classroom/backend/CourseManagement.gs` | `52a7f4049ff51772226fe33369cc26a0acb02a1b` | Fetched from development |
| `sport-nutrition-classroom/backend/EnrollmentManagement.gs` | `a4ccfc11c4825155aa0732de6460cc4ac1c705db` | Fetched from development |
| `sport-nutrition-classroom/backend/setup.gs` | `fc00c98986102a6ac0d19025f5f6cdbf82dbafb5` | Fetched from development |

These are Git blob identifiers, not runtime/deployment fingerprints. They do not prove that the same source is currently deployed to GAS or Cloudflare.

### 2.3 GitHub backup result

**PASS — Repository snapshot branch created.**

The branch `backup/gas-test-runner-wp0-2026-11-21` was created from `development`. Do not delete or move this branch until the Runner release and rollback period are complete.

## 3. GAS configuration evidence

### 3.1 Values observed from Project Owner screenshots

| Item | Observed value | Status |
|---|---|---|
| Script ID | `1SL2JzGAsz625HiyLjmjmS_v-j3C9Htoc2UIKVsT8zDCIJc4VRITIUyYO` | Owner screenshot + supplied value |
| GCP project | Default | Owner screenshot |
| Time zone | GMT+07:00 Indochina Time – Bangkok | Owner screenshot |
| Chrome V8 runtime | Enabled | Owner screenshot |
| Uncaught exception logging | Enabled | Owner screenshot |
| Deployment type | Web app | Owner screenshot |
| Deployment status | Active | Owner screenshot |
| Execute as | Me | Owner screenshot |
| Who has access | Anyone | Owner screenshot |

Security interpretation:
- GAS Web App is publicly callable at the platform access layer.
- Every Runner request must be authenticated and authorized within GAS itself.
- Web App execution uses the deployer's authority; no caller identity can be inferred from that setting.
- GCP Default is accepted for this plan; no project switch is requested.

### 3.2 Script Properties names observed

The following names were visible or confirmed during review:
- `LINE_CHANNEL_ID`
- `SNC_ACCOUNT_LINKING_SCHEMA_VERSION`
- `SNC_ASSIGNMENT_SCHEDULER_SPREADSHEET_ID`
- `SNC_INITIAL_ADMIN_STUDENT_ID`
- `SNC_OTP_PEPPER`
- `SNC_SCHEDULER_TRIGGER_TEST_TAG`

No property value is copied into this report. Do not reuse any existing property for Runner credentials.

**Credential exposure note:** A supplied screenshot displayed the value of `SNC_OTP_PEPPER`. Treat the value as potentially exposed. This report does not rotate it. Before any rotation, assess existing OTP generation/verification compatibility, active challenges and migration implications, then obtain explicit approval for a controlled rotation.

### 3.3 GAS backup status

**BLOCKED — Live GAS source backup not performed.**

The connected GitHub access does not provide direct access to the Apps Script editor/source or deployment history. The GitHub source snapshot is not a substitute for a backup of the actual deployed GAS project.

Required owner-side action:
1. Open the exact GAS project identified by the Script ID above.
2. Export/download all current project source files, including `appsscript.json` if present.
3. Preserve the export as a dated, access-restricted backup outside the live project.
4. Record the archive/file name, timestamp and a checksum (SHA-256) if available.
5. Do not edit or redeploy the project while creating the backup.
6. Confirm completion without sending any secret values.

Required evidence: a screenshot of the downloaded source archive/file list or another verifiable backup record. The source files themselves may be uploaded to the project workspace if source comparison is required.

## 4. Cloudflare Worker evidence

### 4.1 Owner screenshots

| Item | Observed value | Status |
|---|---|---|
| Worker | `snc-test-api-proxy` | Owner screenshot |
| Selected environment | Production | Owner screenshot |
| workers.dev URL | `https://snc-test-api-proxy.worrawutt.workers.dev` | Owner screenshot |
| Variable name | `GAS_API_URL` | Owner screenshot |
| Bindings | No connected bindings shown | Owner screenshot |
| Custom domain | None shown | Owner screenshot |
| Additional route | None shown | Owner screenshot |
| Workers Logs | Enabled | Owner screenshot |
| Workers Traces | Disabled | Owner screenshot |
| Git repository connection | Not configured in shown Builds section | Owner screenshot |
| Cron triggers | None shown | Owner screenshot |
| Queue consumers | None shown | Owner screenshot |

### 4.2 Source-level observations

The Worker source in GitHub `development` was fetched and its blob SHA recorded above. The prior static review identified the current route as the existing Classroom proxy, with Origin/CORS checks that are not authentication. The Worker uses `env.GAS_API_URL` as its upstream configuration.

### 4.3 Items not verified

**BLOCKED — Upstream target not independently verified.**

The full value of `GAS_API_URL` was not exposed in the screenshots. It must be privately compared in the Cloudflare dashboard against the GAS Script ID and intended active deployment. Do not paste the full URL into chat or commit it to GitHub.

**BLOCKED — Complete Secret inventory not verified.**

The screenshots do not establish the complete list of Production and Preview Secrets. Owner should inspect the names only and confirm whether any secrets exist. Never reveal or copy secret values.

**BLOCKED — Deployed Worker/source parity not verified.**

The GitHub blob SHA is known, but the deployed Worker version's exact source fingerprint has not been independently compared with the GitHub source. The dashboard showed a deployed version identifier, but no source export or reproducible build evidence was provided.

## 5. Access and operational controls

**BLOCKED — GAS Editor access not verified.**

Project Owner must review the Apps Script project's editor/share list and confirm that only the Project Owner and explicitly trusted maintainers have edit access. Script Properties are not a security boundary against project editors who can alter and execute code.

**BLOCKED — Rollback evidence not complete.**

- GitHub source snapshot: PASS.
- GAS source export and deployment rollback evidence: BLOCKED.
- Cloudflare last-known-good deployed version and rollback procedure: version identifier was visible in the editor screenshot, but the complete rollback verification was not performed.

## 6. WP-0 status matrix

| WP-0 requirement | Status | Evidence / blocker |
|---|---|---|
| Confirm working repository/branch | PASS | `development` found |
| Create GitHub source snapshot | PASS | Backup branch created from `development` |
| Record relevant Git blob SHAs | PASS | Section 2.2 |
| Back up live GAS source | BLOCKED | Requires owner-side export |
| Record GAS deployment identity | PARTIAL | Script ID and settings known; exact deployment ID/URL mapping not confirmed |
| Verify `GAS_API_URL` target | BLOCKED | Full target not independently checked |
| Verify Worker Secret names | BLOCKED | Complete Production/Preview inventory unavailable |
| Verify GAS Editor access | BLOCKED | Share list not supplied |
| Verify deployed Worker/source parity | BLOCKED | Runtime source fingerprint not compared |
| Verify approved data target/scope | BLOCKED | Exact active spreadsheet/data scope not confirmed |
| Record rollback readiness | PARTIAL | GitHub snapshot exists; GAS/Worker rollback not evidenced |

**Overall WP-0: PARTIALLY COMPLETE — NOT CLEARED FOR IMPLEMENTATION.**

## 7. Required actions to close WP-0

Project Owner actions:
1. Export and preserve the complete live GAS source backup; provide a backup completion record.
2. Privately verify that `GAS_API_URL` points to the GAS Script ID and active deployment recorded in this document. Reply only with “ตรงกับ Script ID” or “ไม่ตรง” and, if not matching, the corrected target identity without exposing the full URL.
3. Inspect Production and Preview Variables & Secrets and provide names only; confirm whether any Secrets exist.
4. Review GAS Editor access and confirm the list contains only trusted maintainers. Do not send personal details beyond what is needed to confirm access control.
5. Confirm the intended active Spreadsheet ID/data scope for initial L1 pilot. Do not include student data.
6. Confirm the Worker deployed version intended as the rollback target.

After evidence is received, update this report and re-evaluate WP-0. Do not begin WP-1 or WP-2 until the blockers are closed or explicitly accepted through a documented risk decision by the Project Owner.

## 8. Change log

- 2026-11-21: Created GitHub snapshot branch from `development`.
- 2026-11-21: Fetched and recorded current development blob SHAs for Worker and core GAS backend source files.
- 2026-11-21: Recorded Owner-provided GAS and Cloudflare dashboard evidence.
- 2026-11-21: No application source, GAS deployment, Worker configuration, secrets, or data changed.

**End of WP-0 report.**
