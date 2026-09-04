import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const externalLinks = await import('../scripts/check-external-links.mjs').catch(() => ({}));
const {
  checkExternalLinks,
  extractExternalLinks,
  formatExternalLinkReport,
} = externalLinks;

function response(status, url, body = '', headers = {}) {
  return {
    headers: { get: (name) => headers[name.toLowerCase()] ?? null },
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
    url,
  };
}

test('extracts and de-duplicates actual external Markdown and autolinks', () => {
  assert.equal(typeof extractExternalLinks, 'function');
  if (typeof extractExternalLinks !== 'function') return;

  assert.deepEqual(
    extractExternalLinks(`
[Guide](https://example.test/guide)
<https://example.test/reference>
[Duplicate](https://example.test/guide)
[Internal](../guide.mdx)
\`https://example.test/not-a-link\`
`, 'content/docs/example.mdx'),
    [
      { url: 'https://example.test/guide', sources: ['content/docs/example.mdx:2', 'content/docs/example.mdx:4'] },
      { url: 'https://example.test/reference', sources: ['content/docs/example.mdx:3'] },
    ],
  );
});

test('checks redirects, retries transient failures, and rejects a SPA fallback page', async () => {
  assert.equal(typeof checkExternalLinks, 'function');
  if (typeof checkExternalLinks !== 'function') return;

  const attempts = new Map();
  const fetchImplementation = async (url, options) => {
    assert.equal(options.redirect, 'manual');
    assert.ok(options.signal instanceof AbortSignal);
    attempts.set(url, (attempts.get(url) ?? 0) + 1);

    if (url === 'https://example.test/redirect') {
      return response(302, url, '', { location: '/final' });
    }
    if (url === 'https://example.test/final') {
      return response(200, url, '<title>Working page</title>');
    }
    if (url === 'https://example.test/retry' && attempts.get(url) === 1) {
      return response(503, url);
    }
    if (url === 'https://example.test/retry') {
      return response(200, url, '<h1>Recovered</h1>');
    }
    return response(200, url, '<title>404 Not Found</title><div id="app"></div>');
  };

  const results = await checkExternalLinks([
    { url: 'https://example.test/fallback', sources: ['fallback.mdx:1'] },
    { url: 'https://example.test/retry', sources: ['retry.mdx:1'] },
    { url: 'https://example.test/redirect', sources: ['redirect.mdx:1'] },
  ], {
    fetchImplementation,
    retries: 1,
    sleep: async () => {},
  });

  assert.deepEqual(results, [
    {
      finalUrl: 'https://example.test/fallback',
      ok: false,
      reason: 'response resembles a not-found fallback page',
      sources: ['fallback.mdx:1'],
      status: 200,
      url: 'https://example.test/fallback',
    },
    {
      finalUrl: 'https://example.test/final',
      ok: true,
      redirects: ['https://example.test/final'],
      sources: ['redirect.mdx:1'],
      status: 200,
      url: 'https://example.test/redirect',
    },
    {
      finalUrl: 'https://example.test/retry',
      ok: true,
      sources: ['retry.mdx:1'],
      status: 200,
      url: 'https://example.test/retry',
    },
  ]);
  assert.equal(attempts.get('https://example.test/retry'), 2);
});

test('bounds request concurrency and formats results deterministically', async () => {
  assert.equal(typeof checkExternalLinks, 'function');
  assert.equal(typeof formatExternalLinkReport, 'function');
  if (typeof checkExternalLinks !== 'function' || typeof formatExternalLinkReport !== 'function') return;

  let active = 0;
  let peak = 0;
  const results = await checkExternalLinks(
    ['c', 'a', 'b'].map((name) => ({ url: `https://example.test/${name}`, sources: [`${name}.mdx:1`] })),
    {
      concurrency: 2,
      fetchImplementation: async (url) => {
        active += 1;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setImmediate(resolve));
        active -= 1;
        return response(200, url, '<h1>OK</h1>');
      },
    },
  );

  assert.equal(peak, 2);
  assert.deepEqual(results.map(({ url }) => url), [
    'https://example.test/a',
    'https://example.test/b',
    'https://example.test/c',
  ]);
  assert.equal(
    formatExternalLinkReport(results),
    'OK https://example.test/a\nOK https://example.test/b\nOK https://example.test/c\n',
  );
});

test('times out a request through AbortSignal', async () => {
  assert.equal(typeof checkExternalLinks, 'function');
  if (typeof checkExternalLinks !== 'function') return;

  const results = await checkExternalLinks(
    [{ url: 'https://example.test/hangs', sources: ['hangs.mdx:1'] }],
    {
      fetchImplementation: async (_url, { signal }) => new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason), { once: true });
      }),
      retries: 0,
      timeoutMs: 5,
    },
  );

  assert.equal(results[0].ok, false);
  assert.match(results[0].reason, /timed out/i);
});

test('external-link workflow is separate, scheduled/manual, pinned, read-only, and non-deploying', async () => {
  const workflowUrl = new URL('../.github/workflows/external-links.yml', import.meta.url);
  const exists = await access(workflowUrl).then(() => true, () => false);
  assert.equal(exists, true, 'expected separate external-link workflow');
  if (!exists) return;

  const workflow = await readFile(workflowUrl, 'utf8');
  assert.match(workflow, /^on:\n(?:[\s\S]*\n)?\s*schedule:/m);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /permissions:\n\s+contents: read/);
  assert.match(workflow, /actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7\.0\.1/);
  assert.match(workflow, /actions\/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7\.0\.0/);
  assert.match(workflow, /node scripts\/check-external-links\.mjs/);
  assert.doesNotMatch(workflow, /npm run (?:build|verify)|next build|deploy|configure-pages|upload-pages-artifact/i);
  assert.doesNotMatch(workflow, /issues: write|pages: write|id-token: write|secrets\./i);
});
