# Conceal Wiki Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a new Fumadocs-based Conceal Wiki preview from `ConcealNetwork/conceal-wiki` through GitHub Pages without changing the current DokuWiki or legacy `conceal-docs` site.

**Architecture:** Generate the official Next.js static Fumadocs template, then add a GitHub-project base-path contract and a small Conceal preview page. A least-privilege GitHub Actions workflow builds the static `out/` artifact and deploys it through GitHub Pages; the public deployment is verified independently of the workflow result.

**Tech Stack:** Node.js 24, npm, Next.js 16.3.4, React 19.2.8, Fumadocs Core/UI 16.15.6, Fumadocs MDX 15.4.0, TypeScript 7.0.2, ESLint 9, Node test runner, GitHub Actions, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-05-conceal-wiki-bootstrap-design.md`

## Global Constraints

- Create a new public `ConcealNetwork/conceal-wiki` repository with `main` as its default branch.
- Keep `ConcealNetwork/conceal-docs`, its Pages site, `https://conceal.network/wiki/`, DNS, FTP, and shared hosting unchanged.
- Require no FTP credential, hosting credential, API key, database, CMS, analytics, authentication, or external search service.
- Build a static export for `/conceal-wiki/` with trailing-slash URLs.
- Commit the npm lockfile and run `npm ci` in automation.
- Pin required GitHub Actions to verified full commit SHAs.
- Treat the official scaffold and declarative configuration as bootstrap artifacts validated through observable behaviour; apply test-first development to custom routing and page behaviour.
- Require public HTTP and real-browser evidence before completion.

---

### Task 1: Generate the Fumadocs baseline and failing export contract

**Files:**
- Generate: `.gitignore`, `app/**`, `components/**`, `content/docs/**`, `lib/**`
- Generate: `eslint.config.mjs`, `next.config.mjs`, `package.json`, `package-lock.json`, `postcss.config.mjs`, `tsconfig.json`
- Create: `tests/static-export.test.mjs`

**Interfaces:**
- Consumes: the approved bootstrap design.
- Produces: the official static template and a failing contract for project-path URLs and Conceal preview content.

- [ ] **Step 1: Generate the official static template**

~~~bash
scaffold_dir=$(mktemp -d /tmp/conceal-wiki-scaffold.XXXXXX)
CI=1 npx --yes create-fumadocs-app@16.1.24 "$scaffold_dir/site" \
  --template +next+fuma-docs-mdx+static --pm npm --install --no-git --linter eslint
rsync -a --exclude='.git' "$scaffold_dir/site/" ./
~~~

Expected: the existing `.git` and `docs/` remain, while the official template and lockfile appear at the repository root.

- [ ] **Step 2: Verify the unmodified baseline**

~~~bash
npm ci
npm run lint
npm run types:check
npm run build
~~~

Expected: exit 0 and both `out/index.html` and `out/docs/index.html` exist.

- [ ] **Step 3: Write the failing static-output test**

Create `tests/static-export.test.mjs`:

~~~js
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const outputDirectory = path.resolve('out');

async function collectHtml(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectHtml(entryPath)));
    if (entry.isFile() && entry.name.endsWith('.html')) files.push(entryPath);
  }
  return files;
}

test('exports links and assets beneath the GitHub project path', async () => {
  const home = await readFile(path.join(outputDirectory, 'index.html'), 'utf8');
  assert.match(home, /href="\/conceal-wiki\/docs\/"/);
  assert.match(home, /(?:src|href)="\/conceal-wiki\/_next\//);
});

test('exports the Conceal migration preview', async () => {
  const home = await readFile(path.join(outputDirectory, 'index.html'), 'utf8');
  const docs = await readFile(path.join(outputDirectory, 'docs/index.html'), 'utf8');
  assert.match(home, /Conceal Wiki/);
  assert.match(home, /Migration preview/);
  assert.match(home, /https:\/\/conceal\.network\/wiki\//);
  assert.match(docs, /Conceal documentation is moving/);
});

test('does not expose a local filesystem path', async () => {
  const files = await collectHtml(outputDirectory);
  const html = (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n');
  assert.doesNotMatch(html, /(?:file:\/\/)?\/Users\/travis\//);
  assert.doesNotMatch(html, /\/tmp\/conceal-wiki-/);
});
~~~

Production breaks caught: incorrect Pages base path, scaffold copy replacing project identity, and leaked local build paths.

- [ ] **Step 4: Verify the expected failure**

~~~bash
GITHUB_PAGES=true npm run build
node --test tests/static-export.test.mjs
~~~

Expected: build succeeds; tests fail on `/docs`, root `/_next/`, and missing Conceal preview copy.

- [ ] **Step 5: Commit the baseline and failing contract**

~~~bash
git add .
git status --short
git commit -m "test: define Conceal Wiki static export contract"
~~~

Confirm `out/`, `.next/`, `node_modules/`, environment files, and credentials are absent from the staged set.

---

### Task 2: Implement project-path routing and the Conceal preview

**Files:**
- Modify: `next.config.mjs`, `lib/shared.ts`, `lib/layout.shared.tsx`
- Modify: `app/(home)/page.tsx`, `app/layout.tsx`, `content/docs/index.mdx`, `package.json`, `README.md`
- Delete: `content/docs/test.mdx`
- Test: `tests/static-export.test.mjs`

**Interfaces:**
- Consumes: Task 1's static-output contract.
- Produces: `GITHUB_PAGES=true npm run build` with `/conceal-wiki/` URLs and `npm run verify` as the validation entry point.

- [ ] **Step 1: Configure the Pages base path**

Replace `next.config.mjs` with:

~~~js
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  reactStrictMode: true,
  trailingSlash: true,
  basePath: isGitHubPages ? '/conceal-wiki' : '',
  images: { unoptimized: true },
};

export default withMDX(config);
~~~

- [ ] **Step 2: Set repository identity**

Replace `lib/shared.ts` with:

~~~ts
export const appName = 'Conceal Wiki';
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

export const gitConfig = {
  user: 'ConcealNetwork',
  repo: 'conceal-wiki',
  branch: 'main',
};
~~~

Keep `lib/layout.shared.tsx` using `appName` and `gitConfig`.

- [ ] **Step 3: Implement the tested landing page**

Replace `app/(home)/page.tsx` with:

~~~tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-fd-muted-foreground">
        Migration preview
      </p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Conceal Wiki</h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-fd-muted-foreground">
        A new, searchable home for Conceal Network documentation. This preview establishes the
        publishing platform before the existing wiki content is migrated.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/docs/" className="rounded-full bg-fd-primary px-5 py-3 font-medium text-fd-primary-foreground">
          Open documentation preview
        </Link>
        <a href="https://conceal.network/wiki/" className="rounded-full border border-fd-border px-5 py-3 font-medium">
          Visit the current production wiki
        </a>
      </div>
    </main>
  );
}
~~~

- [ ] **Step 4: Replace sample documentation**

Replace `content/docs/index.mdx` with:

~~~mdx
---
title: Conceal Wiki preview
description: Preview the new home for Conceal Network documentation.
---

Conceal documentation is moving to a version-controlled, reviewable publishing workflow built with Fumadocs.

<Callout type="warn" title="Preview environment">
  The existing wiki remains the authoritative documentation while migration and review continue.
</Callout>

## What this preview proves

- Documentation can be reviewed through GitHub pull requests.
- Every accepted change produces a reproducible static build.
- GitHub Pages provides an isolated review site before production cutover.

## Current documentation

Use the [current production wiki](https://conceal.network/wiki/) until migration is approved for cutover.
~~~

Delete `content/docs/test.mdx`.

- [ ] **Step 5: Add metadata and the validation command**

Export from `app/layout.tsx`:

~~~ts
export const metadata = {
  title: { default: 'Conceal Wiki', template: '%s | Conceal Wiki' },
  description: 'Documentation for Conceal Network.',
};
~~~

Add to `package.json`:

~~~json
"test:static": "node --test tests/static-export.test.mjs",
"verify": "npm run lint && npm run types:check && GITHUB_PAGES=true npm run build && npm run test:static"
~~~

- [ ] **Step 6: Replace the README**

Document Node.js 24, `npm ci`, `npm run dev`, `npm run verify`, the Pages URL, and the boundary that this preview does not touch FTP or production.

- [ ] **Step 7: Verify green and commit**

~~~bash
npm run verify
git diff --check
git add app content lib next.config.mjs package.json package-lock.json README.md tests
git add -u content/docs/test.mdx
git commit -m "feat: add Conceal Wiki Pages preview"
~~~

Expected: lint, types, build, and all three tests pass before commit.

---

### Task 3: Add least-privilege Pages automation

**Files:**
- Create: `.github/workflows/pages.yml`, `.github/dependabot.yml`
- Modify: `.gitignore`
- Test: `npm run verify` locally and remote workflow execution in Task 4.

**Interfaces:**
- Consumes: Task 2's `npm run verify` and `out/`.
- Produces: a Pages workflow that deploys only a validated `main` commit.

- [ ] **Step 1: Create `.github/workflows/pages.yml`**

~~~yaml
name: Verify and deploy Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: github-pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6
      - uses: actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38 # v6
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run verify
      - if: github.event_name != 'pull_request' && github.ref == 'refs/heads/main'
        uses: actions/configure-pages@983d7736d9b0ae728b81ab479565c72886d7745b # v5
      - if: github.event_name != 'pull_request' && github.ref == 'refs/heads/main'
        uses: actions/upload-pages-artifact@7b1f4a764d45c48632c6b24a0339c27f5614fb0b # v4
        with:
          path: out

  deploy:
    if: github.event_name != 'pull_request' && github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e # v4
~~~

- [ ] **Step 2: Configure Dependabot**

Create `.github/dependabot.yml`:

~~~yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule: { interval: weekly }
    groups:
      application-dependencies:
        patterns: ['*']
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: weekly }
~~~

- [ ] **Step 3: Confirm ignored outputs and scan staged source**

Ensure `.gitignore` ignores `.next/`, `out/`, `node_modules/`, and `.env*` while allowing `.env.example`. Run:

~~~bash
npm run verify
git diff --check
git grep -nE '(FTP_|PASSWORD|TOKEN|API_KEY|BEGIN (RSA|OPENSSH) PRIVATE KEY)' -- . ':!package-lock.json' || true
~~~

Expected: verification passes and no credential value or private key is printed.

- [ ] **Step 4: Commit automation**

~~~bash
git add .github .gitignore
git commit -m "ci: deploy Conceal Wiki to GitHub Pages"
~~~

---

### Task 4: Create the repository, deploy Pages, and verify it publicly

**Files:**
- Remote state only: `ConcealNetwork/conceal-wiki`, Pages configuration, workflow run, environment, and homepage metadata.

**Interfaces:**
- Consumes: the clean, verified local `main` branch.
- Produces: public repository and verified `https://concealnetwork.github.io/conceal-wiki/` deployment.

- [ ] **Step 1: Recheck target and authority**

~~~bash
gh auth status
gh api user/memberships/orgs/ConcealNetwork --jq '{state,role}'
if gh repo view ConcealNetwork/conceal-wiki >/dev/null 2>&1; then
  printf 'Repository already exists; stop and inspect ownership before continuing.\n'
  exit 1
fi
npm ci
npm run verify
git status --short --branch
~~~

Expected: active organisation membership, absent target repository, passing verification, and clean `main`.

- [ ] **Step 2: Create the public repository without pushing**

~~~bash
gh repo create ConcealNetwork/conceal-wiki --public \
  --description 'Fumadocs-based documentation for Conceal Network'
git remote add origin https://github.com/ConcealNetwork/conceal-wiki.git
~~~

- [ ] **Step 3: Enable workflow Pages and push**

~~~bash
gh api --method POST repos/ConcealNetwork/conceal-wiki/pages -f build_type=workflow
git push -u origin main
~~~

If GitHub requires a default branch first, push `main`, repeat the Pages API call, and trigger `pages.yml` once with `gh workflow run pages.yml --repo ConcealNetwork/conceal-wiki --ref main`.

- [ ] **Step 4: Wait for the exact workflow**

~~~bash
run_id=$(gh run list --repo ConcealNetwork/conceal-wiki --workflow pages.yml --branch main --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch "$run_id" --repo ConcealNetwork/conceal-wiki --exit-status
gh run view "$run_id" --repo ConcealNetwork/conceal-wiki --json status,conclusion,url,headSha,jobs
~~~

Expected: `build` and `deploy` complete successfully for the pushed commit.

- [ ] **Step 5: Verify deployed HTTP content**

~~~bash
curl -fsSI https://concealnetwork.github.io/conceal-wiki/
curl -fsSL https://concealnetwork.github.io/conceal-wiki/ | rg 'Conceal Wiki|Migration preview'
curl -fsSI https://concealnetwork.github.io/conceal-wiki/docs/
curl -fsSL https://concealnetwork.github.io/conceal-wiki/docs/ | rg 'Conceal documentation is moving'
~~~

Expected: both URLs return HTTP 200 and contain the intended content.

- [ ] **Step 6: Verify desktop and mobile browser behaviour**

Open the public Pages URL in a real browser. Capture desktop and mobile screenshots and verify no horizontal overflow, failed project-path assets, console errors, or broken navigation. Confirm the docs CTA reaches `/conceal-wiki/docs/` and the production-wiki link reaches `https://conceal.network/wiki/`.

- [ ] **Step 7: Record repository metadata**

~~~bash
gh repo edit ConcealNetwork/conceal-wiki --homepage 'https://concealnetwork.github.io/conceal-wiki/'
gh repo view ConcealNetwork/conceal-wiki --json name,url,homepageUrl,visibility,defaultBranchRef
gh api repos/ConcealNetwork/conceal-wiki/pages --jq '{status,html_url,build_type,https_enforced}'
git status --short --branch
~~~

Expected: public visibility, `main`, the verified Pages homepage, workflow-based Pages with HTTPS, and a clean local branch tracking `origin/main`.

Do not configure FTP or modify either existing wiki deployment during this task.
