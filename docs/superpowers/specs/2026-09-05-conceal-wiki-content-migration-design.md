# Conceal Wiki Content Migration Design

**Status:** Approved 2026-09-05

## Goal

Replace the migration shell with a useful, source-backed Conceal Network documentation set on GitHub Pages without changing the legacy DokuWiki, FTP hosting, DNS, or the production `/wiki/` deployment.

## Editorial model

This is an evidence-led rewrite, not a byte-for-byte mirror. Durable facts come from current first-party code, release pages, live official services, and official repositories. Volatile facts such as releases, pools, exchanges, rates, liquidity, personnel, and service availability either link to a live canonical source or state the date on which they were verified.

Every operational page visibly states one of `Current`, `Experimental`, `Historical`, or `Unavailable`, a `Last verified: 2026-09-05` date, and a short list of primary sources. Absolute privacy, anonymity, profitability, solvency, and investment-return claims are prohibited unless a primary source proves the precise claim.

The old DokuWiki footer states GNU Free Documentation License 1.3. Material substantially adapted from a legacy page must identify the legacy URL and licence. The migration should prefer fresh prose derived from primary sources. Repository-level attribution lives in `ATTRIBUTION.md`.

## Information architecture

The root documentation page becomes a task-oriented start page. Navigation is ordered as follows:

1. Start Here
2. Wallets
3. Backup & Security
4. Network & CCX
5. Earn & Deposits
6. Messaging
7. Mining
8. Run a Node
9. Developer & API
10. wCCX Bridge
11. Releases & Verification
12. Support
13. Research
14. Historical & Retired

Wallet documentation covers choosing a wallet, Desktop, Core CLI, Web Wallet, Android, Next Wallet as experimental, paper wallet, and recovery. Operator and developer documentation covers Core installation, daemon operation, Guardian, RPC/OpenAPI, and current JavaScript libraries.

## Legacy disposition

- Consolidate `start` and `about` into the new start and network pages.
- Split `wallets` into focused wallet and recovery pages.
- Consolidate duplicate `FAQ` and `faq` into troubleshooting material.
- Rewrite `conceal-earn`, `mining`, `smart-nodes`, `security`, and `wrapped-conceal` from current primary sources.
- Keep `clive`, `roadmap`, and `media` only as dated historical summaries.
- Mark Conceal ID and Conceal Pay unavailable; do not reproduce workflows while `conceal.cloud` is unverified.
- Do not migrate the legacy emission table. Explain current network issuance from consensus code and live explorer data instead.

## Canonical sources

- Core code, releases, build documentation, and RPC OpenAPI: `ConcealNetwork/conceal-core`
- Desktop releases: `ConcealNetwork/conceal-desktop`
- Web Wallet and releases: `ConcealNetwork/conceal-web-wallet`
- Android wallet and releases: `ConcealNetwork/conceal-wallet-cordova`
- Next Wallet and its security policy: `ConcealNetwork/conceal-next-wallet`
- Guardian releases and operating instructions: `ConcealNetwork/conceal-guardian`
- Current pool directory and network status: `explorer.conceal.network`
- Paper wallet source: `ConcealNetwork/conceal-paperwallet`
- Wrapped CCX contracts: `ConcealNetwork/wCCX`
- Post-quantum research: `ConcealNetwork/pq-conceal`
- Official help desk: `conceal.network/support/`

Release values verified for this migration are Core 6.7.5, Desktop 6.7.8, Web Wallet 2.1.4, Android 6.0.4-f-droid, and Guardian 0.7.8. These values are dated snapshots, never promises of latest versions.

## Safety boundaries

- Never request or display a seed phrase, private spend key, wallet password, exchange password, FTP credential, or API secret.
- Destructive resync commands are not copied from the old FAQ. Recovery instructions begin with backup and verification.
- Third-party miners, pools, exchanges, and markets are not endorsed. Static tables of their fees or availability are prohibited.
- Bridge instructions distinguish token contract identity, bridge operation, reserves, liquidity, and chain risk.
- Experimental projects are not presented as production replacements.
- The legacy hosting environment remains untouched.

## Validation and maintenance

The static export test suite verifies that the preview language is removed, every planned page is exported, navigation routes resolve, page status and verification dates are visible, historical/unavailable warnings are present, and local filesystem paths or prohibited AI integrations are absent.

A content-policy test scans MDX sources for required metadata, unsafe secret examples, destructive legacy commands, and accidental `conceal.cloud` operational instructions. External link checking runs separately because network failures must not make every Pages deployment flaky. A scheduled GitHub workflow checks current official release tags and opens or updates an issue when documented versions drift; it does not automatically publish content.

## Deployment boundary

The implementation may commit to a feature branch and validate its GitHub Pages-compatible static build. Pushing, creating a pull request, merging, changing DNS, and replacing the production wiki require a separate integration choice.
