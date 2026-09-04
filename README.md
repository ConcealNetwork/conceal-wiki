# Conceal Wiki preview

This repository hosts the preview for the new Conceal Network documentation platform. It is a static Fumadocs site prepared for GitHub Pages at https://concealnetwork.github.io/conceal-wiki/.

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

## Preview boundary

This preview does not modify the existing FTP-hosted wiki or the production site. The current production wiki at https://conceal.network/wiki/ remains authoritative until migration and cutover are approved.
