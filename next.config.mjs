import { createMDX } from 'fumadocs-mdx/next';
import { resolveBasePath } from './lib/base-path.mjs';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  reactStrictMode: true,
  trailingSlash: true,
  basePath: resolveBasePath(),
  images: { unoptimized: true },
};

export default withMDX(config);
