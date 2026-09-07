# Brand assets

Official Conceal imagery for the **site shell** (logo, coin). Not documentation walkthroughs.

How to contribute: see [CONTRIBUTING.md](../../CONTRIBUTING.md).

## What belongs here

- Vector marks used in the header and layout (`conceal-mark.svg`, `conceal-mark-on-light.svg`)
- Photographic or render assets for the homepage (`conceal-coin.webp`)

Wallet and service screenshots → `public/screenshots/`.
Diagrams → `public/diagrams/`.

## How to add a file

1. Take the asset from an official Conceal source (branding page, official site, or official wallet brand folder).
2. Keep vectors as SVG. Encode photos/renders as WebP when a bitmap is required. Name files in kebab-case (`conceal-mark.svg`), same as screenshots.
3. Wire it in the layout or homepage component that should show it. Do not embed brand files with `ProjectImage` on docs pages unless the page is actually about branding.
4. In the PR, say where it came from. Do not append a ledger to this file; git history is enough.
