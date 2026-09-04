# Conceal Wiki bootstrap design

Date: 2026-09-05
Status: Approved direction; implementation pending

## Context

The current Conceal Wiki is a DokuWiki application running from the shared-hosting account at `https://conceal.network/wiki/`. The team has approved migrating the documentation to Fumadocs. This first phase creates a clean repository and a public GitHub Pages preview without changing the current wiki, its hosting account, DNS, or FTP contents.

`ConcealNetwork/conceal-docs` already exists and publishes a legacy GitHub Pages site. It will remain unchanged. The new work will use a separate repository so the team can review the replacement independently.

## Goals

- Create the public repository `ConcealNetwork/conceal-wiki` with `main` as its default branch.
- Scaffold a maintainable Fumadocs site using Next.js and local MDX content.
- Produce a fully static site that works at the GitHub project Pages path `/conceal-wiki/`.
- Deploy automatically from the default branch through GitHub's native Pages artifact workflow.
- Publish an initial Conceal-branded landing page so the team can review navigation, typography, responsive behaviour, and the editing workflow before content migration begins.
- Establish reproducible builds, narrowly scoped workflow permissions, and basic automated validation.

## Non-goals

- Do not alter or delete `ConcealNetwork/conceal-docs`.
- Do not change `conceal.network`, its `/wiki/` directory, DNS, `.htaccess`, DokuWiki, or the hosting account.
- Do not connect to FTP or store FTP credentials in GitHub during this phase.
- Do not migrate the full DokuWiki corpus, revision history, users, or permissions yet.
- Do not add a CMS, analytics, external search provider, database, authentication, or other hosted integration.

## Repository and application structure

The repository will contain one Next.js application at its root. Fumadocs MDX will load documentation from `content/docs`. Application code will remain separate from content so documentation changes are easy to review.

Expected high-level structure:

```text
conceal-wiki/
├── .github/workflows/
├── app/
├── content/docs/
├── lib/
├── public/
├── tests/
├── next.config.*
├── package.json
└── package-lock.json
```

The initial content set will be deliberately small: one landing page plus navigation metadata. It will identify the site as a migration preview and link to the current production wiki. The full content conversion will be a separate, reviewable phase.

## Static routing

Next.js will use static export and trailing-slash URLs. Production builds for GitHub Pages will use:

- `output: "export"`
- `basePath: "/conceal-wiki"`
- `assetPrefix: "/conceal-wiki/"` only if the generated asset URLs require it
- `trailingSlash: true`
- unoptimized local images where required by static export

Local development will continue to run at the root path. Base-path handling will be derived from an explicit build-time setting so links and assets work both locally and on GitHub Pages. The source loader and navigation URLs will use the same base-path contract.

## Continuous integration and GitHub Pages

Pull requests and pushes will run dependency installation from the committed lockfile, linting, type checking, tests, and the production static build. Only a push to `main` or a manually triggered workflow may deploy.

The Pages workflow will:

1. Check out the exact commit.
2. Install the pinned Node.js major version and dependencies with `npm ci`.
3. Run the complete validation command.
4. Build the static `out/` directory for `/conceal-wiki/`.
5. Upload only `out/` as the Pages artifact.
6. Deploy through the `github-pages` environment.
7. Expose the resulting Pages URL in the deployment record.

Workflow permissions will default to read-only. The deployment job will receive only `contents: read`, `pages: write`, and `id-token: write`. Third-party Actions will be avoided where practical; required official Actions will be pinned to verified full commit SHAs, with their human-readable release versions documented in comments.

Concurrency will allow only one Pages deployment at a time. A newer deployment may cancel an older in-progress deployment, but an active deployment step will not be interrupted if doing so could leave ambiguous state.

## Security and dependency controls

- No application secrets are required for GitHub Pages.
- No FTP credentials, hosting credentials, API keys, or copied environment files will enter the repository or workflow.
- The previously disclosed FTP password will not be reused in any later deployment design.
- The lockfile will be committed and CI will use `npm ci`.
- Dependabot will be configured for npm and GitHub Actions updates.
- Generated output will not be committed to `main`; GitHub Pages will receive a build artifact.
- Imported DokuWiki HTML will not be rendered as arbitrary raw HTML. Later conversion must map supported constructs to Markdown/MDX components or explicitly sanitize exceptional HTML.
- The repository will contain a security contact path and contribution guidance before outside contributions are encouraged.

## Post-plan compatibility note

This note records the as-built dependency decision after the original execution
plan was approved. The project uses Microsoft's supported side-by-side
transition: `@typescript/native` aliases TypeScript 7 for the `tsc` CLI, while
`typescript` aliases `@typescript/typescript6` so the current typescript-eslint
integration continues to receive a TypeScript 6 compiler API. This preserves a
valid peer graph while adopting the TypeScript 7 compiler.

## Validation

Implementation will use test-first development for custom routing and base-path behaviour. At minimum, automated checks must demonstrate:

- internal documentation URLs include the GitHub project base path in the Pages build;
- local asset URLs resolve beneath `/conceal-wiki/` in the exported site;
- the landing page is present in the static output;
- no server-only route is required by the exported site;
- the generated output contains no absolute local filesystem paths;
- a clean checkout can reproduce the build with the committed lockfile.

Before the phase is considered complete, the deployed Pages URL must return HTTP 200, its scripts and styles must load successfully, the landing page must render in a browser at desktop and mobile widths, and navigation must work under the project base path. A successful workflow alone is not sufficient evidence of a working site.

## Rollout and rollback

This phase is isolated from production, so rollback is a GitHub Pages redeployment of the last known-good commit. The existing DokuWiki remains the authoritative production documentation until a later cutover is separately approved and verified.

After the team accepts the Pages preview, the next design phase will cover repeatable DokuWiki export, markup conversion, media handling, link redirects, content review, and eventual production hosting. FTP deployment will not be added until credentials have been rotated and a least-privilege deployment account or equivalent safe boundary is available.

## Acceptance criteria

- `ConcealNetwork/conceal-wiki` exists as a public repository with `main` as the default branch.
- The repository contains the Fumadocs source, committed lockfile, tests, documentation, and GitHub Pages workflow.
- CI passes from a clean checkout.
- GitHub Pages uses the Actions publishing source.
- `https://concealnetwork.github.io/conceal-wiki/` returns the intended preview over HTTPS.
- The existing `conceal-docs` Pages site and the production DokuWiki are unchanged.
- No secret or hosting credential is present in source, history, workflow logs, or build output.
