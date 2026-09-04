# Conceal Wiki Content Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the GitHub Pages migration shell with a verified, maintainable Conceal Network documentation set.

**Architecture:** Organize source-backed MDX into task-oriented sections using Fumadocs `meta.json` navigation. Add content-policy and static-export tests that enforce the approved status, dating, safety, and route contracts; keep volatile data linked to canonical live sources rather than copied into prose.

**Tech Stack:** Next.js 16 static export, React 19, Fumadocs, MDX, Node.js built-in test runner, GitHub Actions, GitHub Pages

**Spec:** `docs/superpowers/specs/2026-09-05-conceal-wiki-content-migration-design.md`

## Global Constraints

- Do not access or modify the legacy FTP hosting, DokuWiki files, DNS, or production `/wiki/` deployment.
- Every operational MDX page visibly contains `Status: Current` or `Status: Experimental`, `Last verified: 2026-09-05`, and primary-source links.
- Every retired MDX page visibly contains `Status: Historical` or `Status: Unavailable`, `Last verified: 2026-09-05`, and a clear non-operational warning.
- Prefer fresh prose from first-party sources; identify substantially adapted legacy material and GNU Free Documentation License 1.3 attribution in `ATTRIBUTION.md`.
- Do not hard-code pool fees, exchange availability, market prices, bridge liquidity, or yields as timeless facts.
- Do not include seeds, private keys, passwords, FTP credentials, API secrets, destructive `rm -rf` recovery commands, or working `conceal.cloud` instructions.
- Keep Next Wallet and post-quantum work explicitly experimental and unaudited.
- Keep the existing dependency versions and GitHub Pages project-path behaviour unchanged.

---

### Task 1: Content contract, navigation, and landing pages

**Files:**
- Create: `content/docs/meta.json`
- Create: `content/docs/start-here/index.mdx`
- Create: `content/docs/start-here/choose-a-wallet.mdx`
- Create: `content/docs/network-and-ccx.mdx`
- Create: `ATTRIBUTION.md`
- Modify: `content/docs/index.mdx`
- Modify: `app/(home)/page.tsx`
- Modify: `README.md`
- Create: `tests/content-policy.test.mjs`
- Modify: `tests/static-export.test.mjs`

**Interfaces:**
- Consumes: existing Fumadocs loader at `lib/source.ts` and GitHub Pages path helpers.
- Produces: ordered root navigation; the exact status/date/source conventions consumed by Tasks 2-4; reusable test helpers that enumerate `content/docs/**/*.mdx` and expected public routes.

- [ ] **Step 1: Write failing content and export tests**

Add Node tests that expect the new root metadata, landing routes, visible `Status: Current` and `Last verified: 2026-09-05` text, removal of `Migration preview`, and an attribution file. The break caught is publishing a shell or undated/unattributed migrated content.

- [ ] **Step 2: Run the focused tests and observe RED**

Run `node --test tests/content-policy.test.mjs tests/static-export.test.mjs`. It must fail because the content contract, routes, and attribution do not yet exist.

- [ ] **Step 3: Implement the navigation and foundation content**

Create root navigation metadata and write the start, wallet-choice, and network pages from the approved spec. Include links to Core consensus configuration, live explorer information, current release pages, and the legacy source pages where relevant. Replace preview wording on the home page and README while preserving the no-cutover boundary.

- [ ] **Step 4: Build and run focused tests**

Run `GITHUB_PAGES=true npm run build && node --test tests/content-policy.test.mjs tests/static-export.test.mjs`. Expected: all focused tests pass and all new routes export beneath `/conceal-wiki/`.

- [ ] **Step 5: Commit**

Commit as `docs: establish verified documentation structure`.

### Task 2: Wallet, backup, deposits, messaging, and support guides

**Files:**
- Create: `content/docs/wallets/meta.json`
- Create: `content/docs/wallets/index.mdx`
- Create: `content/docs/wallets/desktop.mdx`
- Create: `content/docs/wallets/core-cli.mdx`
- Create: `content/docs/wallets/web.mdx`
- Create: `content/docs/wallets/android.mdx`
- Create: `content/docs/wallets/next-wallet.mdx`
- Create: `content/docs/wallets/paper-wallet.mdx`
- Create: `content/docs/backup-and-security.mdx`
- Create: `content/docs/earn-and-deposits.mdx`
- Create: `content/docs/messaging.mdx`
- Create: `content/docs/support.mdx`
- Modify: `tests/content-policy.test.mjs`
- Modify: `tests/static-export.test.mjs`

**Interfaces:**
- Consumes: Task 1 status/date/source convention and root navigation.
- Produces: complete end-user documentation routes and current wallet version snapshot used by Task 4 release-drift checking.

- [ ] **Step 1: Extend tests for every user route and safety boundary**

Add expected-route assertions for all files above, require `Experimental` on Next Wallet, and scan exported/user-source content to reject seed/private-key examples, `rm -rf`, claims that a browser wallet stores keys on a Conceal server, and native iOS wallet claims. The break caught is a missing guide or unsafe recovery guidance.

- [ ] **Step 2: Run the focused tests and observe RED**

Run `node --test tests/content-policy.test.mjs tests/static-export.test.mjs`. It must fail on missing pages.

- [ ] **Step 3: Write the user guides**

Use the verified release values and official repositories named in the spec. Explain wallet trade-offs, backup-before-change workflows, checksum verification, browser storage risks, Android APK verification, deposit lockups and dated displayed rates, messaging limitations, and official support routes. Do not fabricate screenshots or reproduce old destructive commands.

- [ ] **Step 4: Build and run focused tests**

Run `GITHUB_PAGES=true npm run build && node --test tests/content-policy.test.mjs tests/static-export.test.mjs`. Expected: all user routes export and policy checks pass.

- [ ] **Step 5: Commit**

Commit as `docs: add current wallet and user guides`.

### Task 3: Mining, node, developer, release, and bridge guides

**Files:**
- Create: `content/docs/mining.mdx`
- Create: `content/docs/run-a-node.mdx`
- Create: `content/docs/developer-and-api.mdx`
- Create: `content/docs/releases-and-verification.mdx`
- Create: `content/docs/wccx-bridge.mdx`
- Modify: `tests/content-policy.test.mjs`
- Modify: `tests/static-export.test.mjs`

**Interfaces:**
- Consumes: Task 1 content contract and Task 2 current release snapshot.
- Produces: operator/developer routes, canonical live pool/API links, and bridge safety boundaries.

- [ ] **Step 1: Extend tests for operator routes and volatile-data policy**

Assert that every route exports; require links to Core OpenAPI, Core and Guardian releases, live explorer pool data, and wCCX source. Reject static pool fee/hashrate tables, exchange recommendations, localhost RPC exposure advice, and bridge-solvency claims. The break caught is stale or unsafe operational documentation.

- [ ] **Step 2: Run the focused tests and observe RED**

Run `node --test tests/content-policy.test.mjs tests/static-export.test.mjs`. It must fail on the missing routes.

- [ ] **Step 3: Write operator and developer guides**

Document CN-GPU mining fundamentals without recommending a miner, current Core and Guardian installation entry points, safe RPC defaults and canonical OpenAPI, maintained JavaScript library entry points, checksum verification, and chain-specific wCCX contract verification. Clearly separate token contracts, bridge operation, reserves, liquidity, and gas requirements.

- [ ] **Step 4: Build and run focused tests**

Run `GITHUB_PAGES=true npm run build && node --test tests/content-policy.test.mjs tests/static-export.test.mjs`. Expected: all operator routes export and policy checks pass.

- [ ] **Step 5: Commit**

Commit as `docs: add operator developer and bridge guides`.

### Task 4: Research, historical archive, drift monitoring, and final validation

**Files:**
- Create: `content/docs/research.mdx`
- Create: `content/docs/historical/meta.json`
- Create: `content/docs/historical/index.mdx`
- Create: `content/docs/historical/conceal-live.mdx`
- Create: `content/docs/historical/conceal-id.mdx`
- Create: `content/docs/historical/conceal-pay.mdx`
- Create: `content/docs/historical/roadmap-and-media.mdx`
- Create: `.github/workflows/docs-drift.yml`
- Create: `scripts/check-doc-release-drift.mjs`
- Create: `tests/release-drift.test.mjs`
- Modify: `tests/content-policy.test.mjs`
- Modify: `tests/static-export.test.mjs`
- Modify: `README.md`

**Interfaces:**
- Consumes: Task 2 documented version snapshot and all prior navigation/routes.
- Produces: explicit retirement boundaries, experimental research page, and a scheduled issue-only release drift signal.

- [ ] **Step 1: Write failing archive and release-drift tests**

Require the research and historical routes, the correct status labels, an unavailable warning for ID/Pay, and a release-drift checker whose pure comparison function returns mismatches for changed tags and none for equal tags. Assert that the workflow is scheduled/manual, uses pinned actions, has `contents: read` and `issues: write`, and never builds or deploys. The breaks caught are accidental revival of unavailable services and silent release-version drift.

- [ ] **Step 2: Run the focused tests and observe RED**

Run `node --test tests/release-drift.test.mjs tests/content-policy.test.mjs tests/static-export.test.mjs`. It must fail because the archive and checker do not exist.

- [ ] **Step 3: Implement historical/research content and issue-only drift monitoring**

Label post-quantum material experimental, explain that it is provisional and not a consensus decision, and add non-operational historical pages for discontinued or unavailable products. Implement a Node script that reads a literal documented-version map, queries only official GitHub latest-release endpoints when executed, and emits a deterministic issue body. Configure a weekly plus manual workflow to create or update one documentation-drift issue; it must not edit content or deploy.

- [ ] **Step 4: Run the complete verification suite**

Run `npm run verify`, `npx actionlint`, and `git diff --check`. Expected: lint, types, Pages build, all tests, workflow validation, and whitespace validation pass.

- [ ] **Step 5: Commit**

Commit as `docs: archive legacy services and monitor release drift`.
