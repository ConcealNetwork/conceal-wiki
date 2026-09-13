# Contributing

This repository is the Conceal Network documentation site. Published docs live at https://concealnetwork.github.io/conceal-wiki/.

You can help in two ways: **open an issue** to suggest a change, or **open a pull request** with the change itself.

## Suggest with an issue

Use an issue when you have found a problem or want a feature discussed before anyone writes it.

Include:

- What page or topic it affects (URL or `content/docs/...` path).
- What is wrong or missing, and why it matters.
- The outcome you want (for example: “Desktop Wallet page shows a current dashboard screenshot”).
- Sources you used (official release, repo, explorer, or capture date). Do not paste recovery material, keys, passwords, or unredacted wallet data.

## Suggest code with a pull request

Use a PR when you already have the wording, screenshot, or code.

Include:

- A short description of the feature or fix and why it belongs in the wiki.
- The pages and files you changed.
- How you checked the change (`npm run verify` locally, and a browser pass if you changed layout or images).
- For images: follow `public/screenshots/README.md` or `public/brand/README.md`. Put the source in the PR description, not in those READMEs.

Keep PRs focused. Do not mix unrelated refactors with a content fix.

## Local setup

Requires Node.js 24 and npm.

```bash
npm ci
npm run dev
```

Lint and format with Biome before opening a PR (`npm run lint:fix` and `npm run format:fix` write the changes):

```bash
npm run lint
npm run format
```

Full check used by CI:

```bash
npm run verify
```

`npm run verify` ends with a `GITHUB_PAGES=true` build, so it leaves `out/` using the `/conceal-wiki` base path. Serving that with `npm start` shows an unstyled page, which is expected rather than a broken layout. Run a plain `npm run build` first to preview at the root — see [Previewing the static build](./README.md#previewing-the-static-build).

## Documentation rules

- Download and version claims must match official Conceal releases or repositories.
- Do not add seed phrases, private keys, or live wallet addresses as examples.
- Destructive commands and unofficial download links stay out of the guides.
- Next Wallet is the redesigned Web Wallet: keep the Desktop-first fallback if you edit its page.

## Screenshots

Product UI captures belong in `public/screenshots/`. They are **copied into this repo**; they are not loaded from another repository at build time.

Brand marks and site chrome belong in `public/brand/`. Diagrams belong in `public/diagrams/`.

Name image files in **kebab-case**: `next-wallet-account.png`. Do not use camelCase (`nextWalletAccount.png`) or snake_case (`next_wallet_account.png`). The same rule applies under `public/brand/` and `public/diagrams/`.

Before adding a wallet screenshot, follow `public/screenshots/README.md`.

Embed walkthrough images with `ProjectImage` and the real pixel width and height:

```mdx
<ProjectImage
  src="/screenshots/example.png"
  alt="What the reader should notice."
  caption="Where it came from and what was sanitized."
  width={1280}
  height={720}
/>
```
