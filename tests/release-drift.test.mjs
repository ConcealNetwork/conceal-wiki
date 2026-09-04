import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import * as releaseDrift from '../scripts/check-doc-release-drift.mjs';

const {
  checkDocumentedReleaseDrift,
  compareReleaseTags,
  createOrUpdateDocumentationDriftIssue,
  DOCUMENTED_RELEASES,
  fetchOfficialReleaseTags,
  formatDriftIssue,
  OFFICIAL_RELEASE_ENDPOINTS,
} = releaseDrift;

test('reports only official release tags that differ from the documented snapshot', () => {
  assert.deepEqual(compareReleaseTags(DOCUMENTED_RELEASES, DOCUMENTED_RELEASES), []);
  assert.deepEqual(
    compareReleaseTags(DOCUMENTED_RELEASES, {
      ...DOCUMENTED_RELEASES,
      Core: '6.7.6',
    }),
    [{ component: 'Core', documentedTag: '6.7.5', latestTag: '6.7.6' }],
  );
});

test('uses the exact Task 2 release-tag snapshot', () => {
  assert.deepEqual(DOCUMENTED_RELEASES, {
    Core: '6.7.5',
    Desktop: '6.7.8',
    'Web Wallet': 'v2.1.4',
    Android: 'v6.0.4-f-droid',
    Guardian: 'v0.7.8',
  });
});

test('matches the release monitor map to the wallet and node documentation snapshot', async () => {
  const sources = Object.fromEntries(await Promise.all([
    ['Core', '../content/docs/wallets/core-cli.mdx', /Core (\d+\.\d+\.\d+)/],
    ['Desktop', '../content/docs/wallets/desktop.mdx', /Desktop (\d+\.\d+\.\d+)/],
    ['Web Wallet', '../content/docs/wallets/web.mdx', /Web Wallet (\d+\.\d+\.\d+)/, 'v'],
    ['Android', '../content/docs/wallets/android.mdx', /Android (\d+\.\d+\.\d+-f-droid)/, 'v'],
    ['Guardian', '../content/docs/run-a-node.mdx', /Guardian (\d+\.\d+\.\d+)/, 'v'],
  ].map(async ([component, file, pattern, prefix = '']) => {
    const source = await readFile(new URL(file, import.meta.url), 'utf8');
    const version = source.match(pattern)?.[1];
    assert.ok(version, `${component}: documented release snapshot`);
    return [component, `${prefix}${version}`];
  })));

  assert.deepEqual(DOCUMENTED_RELEASES, sources);
});

test('formats a deterministic documentation-drift issue body', () => {
  assert.equal(
    formatDriftIssue([{ component: 'Core', documentedTag: 'v6.7.5', latestTag: 'v6.7.6' }]),
    `## Documentation release drift\n\nThe documented release snapshot differs from the official GitHub release tags. Review the linked official release before changing documentation.\n\n| Component | Documented tag | Official latest tag |\n| --- | --- | --- |\n| Core | v6.7.5 | v6.7.6 |\n\nThis issue is a review signal only. It does not publish or change documentation.\n`,
  );
});

test('reads tags only from the literal official GitHub latest-release endpoints', async () => {
  assert.equal(typeof fetchOfficialReleaseTags, 'function');
  if (typeof fetchOfficialReleaseTags !== 'function') return;

  const requestedEndpoints = [];
  const latestTags = await fetchOfficialReleaseTags(async (endpoint) => {
    requestedEndpoints.push(endpoint);
    const component = Object.entries(OFFICIAL_RELEASE_ENDPOINTS)
      .find(([, officialEndpoint]) => officialEndpoint === endpoint)?.[0];
    return {
      ok: true,
      json: async () => ({ tag_name: DOCUMENTED_RELEASES[component] }),
    };
  });

  assert.deepEqual(requestedEndpoints, Object.values(OFFICIAL_RELEASE_ENDPOINTS));
  assert.deepEqual(latestTags, DOCUMENTED_RELEASES);
});

test('compares the documented snapshot after reading official release tags', async () => {
  assert.equal(typeof checkDocumentedReleaseDrift, 'function');
  if (typeof checkDocumentedReleaseDrift !== 'function') return;

  const mismatches = await checkDocumentedReleaseDrift(async (endpoint) => {
    const component = Object.entries(OFFICIAL_RELEASE_ENDPOINTS)
      .find(([, officialEndpoint]) => officialEndpoint === endpoint)?.[0];
    return {
      ok: true,
      json: async () => ({ tag_name: component === 'Guardian' ? 'v0.7.9' : DOCUMENTED_RELEASES[component] }),
    };
  });

  assert.deepEqual(mismatches, [
    { component: 'Guardian', documentedTag: 'v0.7.8', latestTag: 'v0.7.9' },
  ]);
});

test('updates the existing documentation-drift issue after filtering pull requests', async () => {
  assert.equal(typeof createOrUpdateDocumentationDriftIssue, 'function');
  if (typeof createOrUpdateDocumentationDriftIssue !== 'function') return;

  const calls = { paginate: [], update: [], create: [] };
  const listForRepo = () => {};
  const github = {
    paginate: async (...args) => {
      calls.paginate.push(args);
      return [
        { number: 10, title: 'Documentation release drift', pull_request: {} },
        { number: 20, title: 'Documentation release drift' },
      ];
    },
    rest: {
      issues: {
        listForRepo,
        update: async (parameters) => calls.update.push(parameters),
        create: async (parameters) => calls.create.push(parameters),
      },
    },
  };

  const result = await createOrUpdateDocumentationDriftIssue(
    github,
    { owner: 'ConcealNetwork', repo: 'conceal-wiki' },
    'changed release tags',
  );

  assert.deepEqual(calls.paginate, [[listForRepo, {
    owner: 'ConcealNetwork', repo: 'conceal-wiki', state: 'open', per_page: 100,
  }]]);
  assert.deepEqual(calls.update, [{
    owner: 'ConcealNetwork', repo: 'conceal-wiki', issue_number: 20, body: 'changed release tags',
  }]);
  assert.deepEqual(calls.create, []);
  assert.deepEqual(result, { action: 'updated', issueNumber: 20 });
});

test('creates the documentation-drift issue only when no actual issue exists', async () => {
  assert.equal(typeof createOrUpdateDocumentationDriftIssue, 'function');
  if (typeof createOrUpdateDocumentationDriftIssue !== 'function') return;

  const calls = { update: [], create: [] };
  const github = {
    paginate: async () => [{ number: 10, title: 'Documentation release drift', pull_request: {} }],
    rest: {
      issues: {
        listForRepo: () => {},
        update: async (parameters) => calls.update.push(parameters),
        create: async (parameters) => calls.create.push(parameters),
      },
    },
  };

  const result = await createOrUpdateDocumentationDriftIssue(
    github,
    { owner: 'ConcealNetwork', repo: 'conceal-wiki' },
    'changed release tags',
  );

  assert.deepEqual(calls.update, []);
  assert.deepEqual(calls.create, [{
    owner: 'ConcealNetwork', repo: 'conceal-wiki', title: 'Documentation release drift', body: 'changed release tags',
  }]);
  assert.deepEqual(result, { action: 'created' });
});

test('the issue-only drift workflow is scheduled, manual, singleton-safe, and least-privilege', async () => {
  const workflow = await readFile(new URL('../.github/workflows/docs-drift.yml', import.meta.url), 'utf8');

  assert.match(workflow, /^on:\n(?:[\s\S]*\n)?\s*schedule:/m);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /issues: write/);
  assert.match(workflow, /^concurrency:\n\s+group: docs-release-drift-\$\{\{ github\.repository \}\}\n\s+cancel-in-progress: false/m);
  assert.match(workflow, /actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7\.0\.1/);
  assert.match(workflow, /actions\/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7\.0\.0/);
  assert.match(workflow, /actions\/github-script@ed597411d8f924073f98dfc5c65a23a2325f34 # v8\.0\.0/);
  assert.match(workflow, /await import\(\s*`\$\{process\.env\.GITHUB_WORKSPACE\}\/scripts\/check-doc-release-drift\.mjs`,\s*\)/);
  assert.match(workflow, /createOrUpdateDocumentationDriftIssue\(github, context\.repo, body\)/);
  assert.doesNotMatch(workflow, /npm run (?:build|verify)|next build|deploy|configure-pages|upload-pages-artifact/i);
  assert.doesNotMatch(workflow, /(?:ftp|hosting|api)[_-]?(?:key|token|secret|credential)|secrets\./i);
});
