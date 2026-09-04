# Task 1 report: Fumadocs baseline and static export contract

## Result

Generated the official `create-fumadocs-app@16.1.24` static Fumadocs baseline at the repository root, preserving the existing `.git` and `docs/` paths. Restored the pre-existing `.worktrees/` exclusion after the scaffold rewrote `.gitignore`. Added the exact red static-export contract from the task brief.

The generated template declared TypeScript `^7.0.2`, which caused the generated Next ESLint configuration to fail before linting because the resolved `typescript-eslint` version does not support TypeScript 7. To make the required baseline verification runnable, TypeScript was pinned to `^6.0.3`; the generated baseline then passed lint, typecheck, and build.

## Verification evidence

Commands run:

```text
CI=1 npx --yes create-fumadocs-app@16.1.24 "$scaffold_dir/site" --template +next+fuma-docs-mdx+static --pm npm --install --no-git --linter eslint
rsync -a --exclude='.git' "$scaffold_dir/site/" ./
npm install --save-dev typescript@^6.0.3
npm ci --ignore-scripts --no-audit --no-fund
npm run lint
npm run types:check
npm run build
```

Results after the TypeScript compatibility pin:

```text
ci:0
lint:0
types:0
build:0
out-index:present
```

The unmodified generated build uses Next's current static-export layout and produced `out/index.html` and `out/docs.html` (not `out/docs/index.html`), so the brief's exact `out/docs/index.html` expectation is captured by the red contract as intended.

Expected-failure verification:

```text
GITHUB_PAGES=true npm run build
pages-build:0
node --test tests/static-export.test.mjs
contract:1
```

Test summary:

```text
tests 3
pass 1
fail 2
```

The two failing tests are the project-path/assets assertion (baseline emits `/docs` and `/_next`) and the Conceal migration preview assertion (baseline has no preview copy and no `out/docs/index.html`). The local filesystem path test passes.

## Files

- Scaffold application: `app/`, `components/`, `content/`, `lib/`
- Scaffold configuration: `.gitignore`, `eslint.config.mjs`, `next.config.mjs`, `package.json`, `package-lock.json`, `postcss.config.mjs`, `tsconfig.json`
- Generated scaffold readme: `README.md`
- Contract: `tests/static-export.test.mjs`

Build outputs, dependencies, environment files, and credentials are ignored and were not staged.

## Concerns

- The generated scaffold currently identifies the site as `My App` and contains the default Hello World/Components content; later tasks must replace this with Conceal branding and migration preview content.
- The generated Next 16 export names the docs page `out/docs.html`; the contract intentionally requires `out/docs/index.html` and therefore remains red until the project export routing is adapted.
- The TypeScript pin is a bootstrap compatibility adjustment necessitated by the current generator dependency range and ESLint peer support.
