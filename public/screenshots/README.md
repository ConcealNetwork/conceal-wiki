# Screenshots

Walkthrough UI for the docs. Files in this folder are committed here. Other Conceal repos are copy sources only; there is no shared asset submodule.

How to contribute (issues vs PRs, local verify): see [CONTRIBUTING.md](../../CONTRIBUTING.md).

## What belongs here

Product screens of wallets and official services used in `content/docs/`.

Not here:

- Marks, coin, homepage chrome → `public/brand/`
- Diagrams → `public/diagrams/`

## How to add a file

1. Capture from a project-controlled release or official service. Use a new browser profile or demo data.
2. Match the spec below. Name files in **kebab-case**: `product-screen.png` (example: `next-wallet-account.png`). Do not use camelCase or snake_case.
3. Embed it on the page with `ProjectImage`, using the real pixel width and height and a `/screenshots/...` path.
4. In the PR, say where the capture came from. Do not append a ledger to this file; git history is enough.

```mdx
<ProjectImage
  src="/screenshots/example.png"
  alt="What the reader should notice."
  caption="Short context. Mention blur or crop if the image is sanitized."
  width={1280}
  height={720}
/>
```

## Spec

| Surface | Format | Size | File budget |
| --- | --- | --- | --- |
| Desktop or browser wallet window | PNG, 8-bit RGB or RGBA | Width **1280 px** (longest edge ≤ 1280). Crop OS chrome that does not teach the step. | Aim **under 200 KB**; do not exceed **500 KB**. |
| Phone | PNG | **707 × 1500** | Same budget |
| Tight dialog crop | PNG | Natural cropped size is fine | Same budget |

Do not use JPEG for wallet UI. WebP belongs in `public/brand/` for photographic renders only.

Safety: empty or demo wallet; blur addresses and QR; never capture a seed, private key, password, or unredacted backup.
