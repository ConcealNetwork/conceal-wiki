import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import * as releaseDrift from '../scripts/check-doc-release-drift.mjs';

const {
  checkDocumentedReleaseDrift,
  compareReleaseTags,
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
      Core: 'v6.7.6',
    }),
    [{ component: 'Core', documentedTag: 'v6.7.5', latestTag: 'v6.7.6' }],
  );
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

test('the issue-only drift workflow is scheduled, manual, and least-privilege', async () => {
  const workflow = await readFile(new URL('../.github/workflows/docs-drift.yml', import.meta.url), 'utf8');

  assert.match(workflow, /^on:\n(?:[\s\S]*\n)?\s*schedule:/m);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /issues: write/);
  assert.match(workflow, /actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7\.0\.1/);
  assert.match(workflow, /actions\/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7\.0\.0/);
  assert.match(workflow, /actions\/github-script@ed597411d8f924073f98dfc5c65a23a2325f34 # v8\.0\.0/);
  assert.doesNotMatch(workflow, /npm run (?:build|verify)|next build|deploy|configure-pages|upload-pages-artifact/i);
  assert.doesNotMatch(workflow, /(?:ftp|hosting|api)[_-]?(?:key|token|secret|credential)|secrets\./i);
});
