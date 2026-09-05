# Conceal Docs

This repository contains the official Conceal Network documentation. The Fumadocs site is published at https://concealnetwork.github.io/conceal-wiki/.

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

## Release-drift monitoring

The weekly release check compares documented versions with the latest GitHub releases. When a tag changes, it creates or updates one review issue. It never edits or publishes documentation.
