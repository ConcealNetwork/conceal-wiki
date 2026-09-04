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
