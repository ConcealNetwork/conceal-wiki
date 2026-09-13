const pagesBasePath = '/conceal-wiki';
const pagesOrigin = 'https://concealnetwork.github.io';

function normalizeBasePath(value) {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return '';

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

/**
 * Resolves the subdirectory the build is published under.
 *
 * `SITE_BASE_PATH` selects an explicit prefix for shared hosting. Otherwise
 * `GITHUB_PAGES=true` keeps the project-path build used by the Pages test
 * deployment, and an unset environment builds for the domain root.
 */
export function resolveBasePath(env = process.env) {
  const explicit = env.SITE_BASE_PATH;
  if (explicit !== undefined) return normalizeBasePath(explicit);

  return env.GITHUB_PAGES === 'true' ? pagesBasePath : '';
}

/**
 * Resolves the absolute origin the build is published under, used as the
 * metadata base for canonical and Open Graph URLs.
 */
export function resolveSiteUrl(env = process.env) {
  const origin = (env.SITE_ORIGIN ?? pagesOrigin).replace(/\/+$/, '');

  return `${origin}${resolveBasePath(env)}/`;
}
