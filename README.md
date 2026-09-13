# Conceal Docs

This repository contains the official Conceal Network documentation. The Fumadocs site is published at https://concealnetwork.github.io/conceal-wiki/.

See [CONTRIBUTING.md](./CONTRIBUTING.md) to suggest a change with an issue or send a pull request.

## Requirements

- Node.js 24
- npm

## Local development

Install the locked dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

Run the full validation, including the GitHub Pages project-path build and static-export assertions:

```bash
npm run verify
```

### Previewing the static build

`lib/base-path.mjs` resolves the subdirectory each build is published under, and `next.config.mjs` applies it as `basePath`. `GITHUB_PAGES=true` selects the `/conceal-wiki` project path used by the Pages test deployment; an unset environment builds for the domain root. That prefix decides how the generated `out/` can be served.

For a local preview, build without the flag and serve at the root:

```bash
npm run build
npm start
```

To check the exact artifact CI deploys, build with the flag and serve it under the project path:

```bash
GITHUB_PAGES=true npm run build
mkdir -p /tmp/pages-preview && ln -sfn "$PWD/out" /tmp/pages-preview/conceal-wiki
serve -S /tmp/pages-preview
```

Then open http://localhost:3000/conceal-wiki/. The `-S` flag is required because `serve` returns 404 for symlinks by default.

Serving a `GITHUB_PAGES=true` build with `npm start` instead renders an unstyled page with full-size icons: the HTML requests `/conceal-wiki/_next/...` while `serve` exposes those files at `/_next/...`, so every stylesheet and script returns 404. Because `npm run verify` finishes with a Pages build, run `npm run build` again before `npm start`.

### Production build

`npm run build:prod` builds for the `/wiki` subdirectory of the main site and leaves an uploadable tree in `dist/`:

```bash
npm run build:prod
```

Validate that artifact with the same export contract the Pages build uses, then upload it:

```bash
npm run test:prod
```

Upload the **contents** of `dist/` into the hosting `wiki/` directory, so the server ends up with `wiki/index.html` and `wiki/_next/`. Uploading the `dist` folder itself would publish the site one level too deep.

The Namecheap tree also needs `wiki/.htaccess`. Keep a local copy at `public/.htaccess` (gitignored) so `build:prod` copies it into `dist/.htaccess`. On the host that file must be **mode `0644`** (`rw-r--r--`): owner read/write, group and others read, not executable and not world-writable. Apache has to read it; `0600` can 500 the whole `/wiki` tree if the worker is a different user, and `0777` is wrong.

Preview it locally with the prefix in place:

```bash
mkdir -p /tmp/wiki-preview && ln -sfn "$PWD/dist" /tmp/wiki-preview/wiki
serve -S /tmp/wiki-preview
```

Then open http://localhost:3000/wiki/.

`build:prod` moves `out/` to `dist/`, so run `npm run build` again before `npm start`.

Two variables override the deployment target for any other host:

- `SITE_BASE_PATH` — the published subdirectory, such as `/wiki`. An empty value builds for the domain root.
- `SITE_ORIGIN` — the origin used as the metadata base for canonical and Open Graph URLs.

### Linting and formatting

Biome handles both. The checks are read-only; the `:fix` variants write changes:

```bash
npm run lint
npm run format
npm run lint:fix
npm run format:fix
```

## Release-drift monitoring

The weekly release check compares documented versions with the latest GitHub releases. When a tag changes, it creates or updates one review issue. It never edits or publishes documentation.
