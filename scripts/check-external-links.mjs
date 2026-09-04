import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const NOT_FOUND_PAGE = /<(?:title|h1)[^>]*>\s*(?:404(?:\s*[-:|])?|page\s+not\s+found|not\s+found)\b/i;

function maskCode(source) {
  return source
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/[^\n]/g, ' '))
    .replace(/`[^`\n]*`/g, (span) => ' '.repeat(span.length));
}

function sourceLocation(source, index, sourcePath) {
  return `${sourcePath}:${source.slice(0, index).split('\n').length}`;
}

export function extractExternalLinks(source, sourcePath) {
  const searchable = maskCode(source);
  const matches = [
    ...searchable.matchAll(/\[[^\]]*\]\((https?:\/\/[^\s)]+)(?:\s+['"][^)]*['"])?\)/g),
    ...searchable.matchAll(/<(https?:\/\/[^>\s]+)>/g),
  ];
  const links = new Map();

  for (const match of matches) {
    const url = match[1];
    const sources = links.get(url) ?? new Set();
    sources.add(sourceLocation(source, match.index, sourcePath));
    links.set(url, sources);
  }

  return [...links.entries()]
    .map(([url, sources]) => ({ url, sources: [...sources].sort() }))
    .sort((left, right) => left.url.localeCompare(right.url));
}

async function collectMdxFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectMdxFiles(entryPath)));
    if (entry.isFile() && entry.name.endsWith('.mdx')) files.push(entryPath);
  }
  return files;
}

export async function collectDocumentationLinks(directory = path.resolve('content/docs')) {
  const links = new Map();
  for (const file of await collectMdxFiles(directory)) {
    const sourcePath = path.relative(process.cwd(), file);
    for (const link of extractExternalLinks(await readFile(file, 'utf8'), sourcePath)) {
      const sources = links.get(link.url) ?? new Set();
      for (const source of link.sources) sources.add(source);
      links.set(link.url, sources);
    }
  }

  return [...links.entries()]
    .map(([url, sources]) => ({ url, sources: [...sources].sort() }))
    .sort((left, right) => left.url.localeCompare(right.url));
}

async function fetchWithTimeout(url, fetchImplementation, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new Error(`request timed out after ${timeoutMs}ms`)),
    timeoutMs,
  );

  try {
    const response = await fetchImplementation(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
        'User-Agent': 'conceal-wiki-link-checker/1.0',
      },
      redirect: 'manual',
      signal: controller.signal,
    });
    const body = REDIRECT_STATUSES.has(response.status) ? '' : await response.text();
    return { body, response };
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`request timed out after ${timeoutMs}ms`, { cause: error });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchFollowingRedirects(url, options) {
  const redirects = [];
  const visited = new Set([url]);
  let currentUrl = url;

  for (let redirectCount = 0; redirectCount <= options.maxRedirects; redirectCount += 1) {
    const { body, response } = await fetchWithTimeout(
      currentUrl,
      options.fetchImplementation,
      options.timeoutMs,
    );

    if (!REDIRECT_STATUSES.has(response.status)) {
      return { body, response, finalUrl: currentUrl, redirects };
    }

    const location = response.headers.get('location');
    if (!location) {
      return {
        body,
        response,
        finalUrl: currentUrl,
        redirects,
        redirectError: `HTTP ${response.status} redirect has no location`,
      };
    }
    if (redirectCount === options.maxRedirects) {
      return {
        body,
        response,
        finalUrl: currentUrl,
        redirects,
        redirectError: `more than ${options.maxRedirects} redirects`,
      };
    }

    const nextUrl = new URL(location, currentUrl);
    if (!['http:', 'https:'].includes(nextUrl.protocol)) {
      return {
        body,
        response,
        finalUrl: currentUrl,
        redirects,
        redirectError: `redirect uses unsupported protocol ${nextUrl.protocol}`,
      };
    }
    if (visited.has(nextUrl.href)) {
      return {
        body,
        response,
        finalUrl: currentUrl,
        redirects,
        redirectError: 'redirect loop',
      };
    }

    currentUrl = nextUrl.href;
    redirects.push(currentUrl);
    visited.add(currentUrl);
  }

  throw new Error('unreachable redirect state');
}

function looksLikeRootFallback(originalUrl, finalUrl, redirects) {
  if (redirects.length === 0) return false;
  const original = new URL(originalUrl);
  const final = new URL(finalUrl);
  return original.origin === final.origin
    && original.pathname !== '/'
    && final.pathname === '/'
    && final.search === '';
}

async function checkOneExternalLink(link, options) {
  let lastFailure;

  for (let attempt = 0; attempt <= options.retries; attempt += 1) {
    try {
      const result = await fetchFollowingRedirects(link.url, options);
      const base = {
        finalUrl: result.finalUrl,
        sources: [...link.sources].sort(),
        status: result.response.status,
        url: link.url,
      };

      if (result.redirectError) {
        return { ...base, ok: false, reason: result.redirectError };
      }
      if ((result.response.status === 429 || result.response.status >= 500) && attempt < options.retries) {
        lastFailure = { ...base, ok: false, reason: `HTTP ${result.response.status}` };
        await options.sleep(options.retryDelayMs * (2 ** attempt));
        continue;
      }
      if (!result.response.ok) {
        return { ...base, ok: false, reason: `HTTP ${result.response.status}` };
      }
      if (looksLikeRootFallback(link.url, result.finalUrl, result.redirects)) {
        return { ...base, ok: false, reason: 'redirected to the site root fallback' };
      }
      if (NOT_FOUND_PAGE.test(result.body)) {
        return { ...base, ok: false, reason: 'response resembles a not-found fallback page' };
      }

      return result.redirects.length > 0
        ? { ...base, ok: true, redirects: result.redirects }
        : { ...base, ok: true };
    } catch (error) {
      lastFailure = {
        ok: false,
        reason: error instanceof Error ? error.message : String(error),
        sources: [...link.sources].sort(),
        url: link.url,
      };
      if (attempt < options.retries) {
        await options.sleep(options.retryDelayMs * (2 ** attempt));
        continue;
      }
    }
  }

  return lastFailure;
}

export async function checkExternalLinks(links, {
  concurrency = 6,
  fetchImplementation = fetch,
  maxRedirects = 5,
  retries = 2,
  retryDelayMs = 250,
  sleep = (duration) => new Promise((resolve) => setTimeout(resolve, duration)),
  timeoutMs = 10_000,
} = {}) {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new RangeError('concurrency must be a positive integer');
  }

  const sortedLinks = [...links]
    .map((link) => ({ ...link, sources: [...link.sources].sort() }))
    .sort((left, right) => left.url.localeCompare(right.url));
  const results = new Array(sortedLinks.length);
  let nextIndex = 0;
  const options = {
    fetchImplementation,
    maxRedirects,
    retries,
    retryDelayMs,
    sleep,
    timeoutMs,
  };

  async function worker() {
    while (nextIndex < sortedLinks.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await checkOneExternalLink(sortedLinks[index], options);
    }
  }

  await Promise.all(Array.from(
    { length: Math.min(concurrency, sortedLinks.length) },
    () => worker(),
  ));
  return results;
}

export function formatExternalLinkReport(results) {
  return results.map((result) => {
    if (result.ok) {
      const destination = result.finalUrl !== result.url ? ` -> ${result.finalUrl}` : '';
      return `OK ${result.url}${destination}`;
    }
    return `FAIL ${result.url} (${result.reason}) [${result.sources.join(', ')}]`;
  }).join('\n') + (results.length > 0 ? '\n' : '');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const links = await collectDocumentationLinks();
  const results = await checkExternalLinks(links);
  process.stdout.write(formatExternalLinkReport(results));
  if (results.some((result) => !result.ok)) process.exitCode = 1;
}

