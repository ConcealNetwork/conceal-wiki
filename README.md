# Conceal Wiki

This repository hosts source-backed Conceal Network documentation. It is a static Fumadocs site prepared for GitHub Pages at https://concealnetwork.github.io/conceal-wiki/.

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

## Publishing boundary

This repository does not modify the existing FTP-hosted wiki or the production site. The legacy production wiki at https://conceal.network/wiki/ remains authoritative until migration and cutover are separately approved.

## Release-drift monitoring

The weekly, manually runnable documentation-drift workflow compares the dated release snapshot in this repository with official GitHub latest-release endpoints. When a tag differs, it creates or updates one review issue. It does not change documentation, build or deploy the site, access hosting, or use stored credentials.
