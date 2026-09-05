export const DOCUMENTED_RELEASES = Object.freeze({
  Core: '6.7.5',
  Desktop: '6.7.8',
  'Web Wallet': 'v2.1.4',
  Android: 'v6.0.4-f-droid',
  Guardian: 'v0.7.8',
});

export const OFFICIAL_RELEASE_ENDPOINTS = Object.freeze({
  Core: 'https://api.github.com/repos/ConcealNetwork/conceal-core/releases/latest',
  Desktop: 'https://api.github.com/repos/ConcealNetwork/conceal-desktop/releases/latest',
  'Web Wallet': 'https://api.github.com/repos/ConcealNetwork/conceal-web-wallet/releases/latest',
  Android: 'https://api.github.com/repos/ConcealNetwork/conceal-wallet-cordova/releases/latest',
  Guardian: 'https://api.github.com/repos/ConcealNetwork/conceal-guardian/releases/latest',
});

export function compareReleaseTags(documentedTags, latestTags) {
  return Object.entries(documentedTags)
    .filter(([component, documentedTag]) => latestTags[component] !== documentedTag)
    .map(([component, documentedTag]) => ({
      component,
      documentedTag,
      latestTag: latestTags[component],
    }));
}

export function formatDriftIssue(mismatches) {
  if (mismatches.length === 0) return '';

  const rows = mismatches
    .map(({ component, documentedTag, latestTag }) => `| ${component} | ${documentedTag} | ${latestTag} |`)
    .join('\n');

  return `## Documentation versions changed\n\nThe versions listed in the docs no longer match the latest GitHub releases. Check each release, then update the affected guides.\n\n| Component | Documented tag | Latest tag |\n| --- | --- | --- |\n${rows}\n\nThis issue does not edit or publish documentation.\n`;
}

export async function fetchOfficialReleaseTags(fetchImplementation = fetch) {
  const entries = await Promise.all(Object.entries(OFFICIAL_RELEASE_ENDPOINTS).map(async ([component, endpoint]) => {
    const response = await fetchImplementation(endpoint, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) throw new Error(`${component}: official release lookup failed (${response.status})`);

    const release = await response.json();
    if (typeof release.tag_name !== 'string' || release.tag_name.length === 0) {
      throw new Error(`${component}: official release response has no tag_name`);
    }
    return [component, release.tag_name];
  }));

  return Object.fromEntries(entries);
}

export async function checkDocumentedReleaseDrift(fetchImplementation = fetch) {
  return compareReleaseTags(DOCUMENTED_RELEASES, await fetchOfficialReleaseTags(fetchImplementation));
}

export async function createOrUpdateDocumentationDriftIssue(github, repository, body) {
  const title = 'Documentation release drift';
  const issues = await github.paginate(github.rest.issues.listForRepo, {
    ...repository,
    state: 'open',
    per_page: 100,
  });
  const existingIssue = issues
    .filter((issue) => !issue.pull_request)
    .find((issue) => issue.title === title);

  if (existingIssue) {
    await github.rest.issues.update({
      ...repository,
      issue_number: existingIssue.number,
      body,
    });
    return { action: 'updated', issueNumber: existingIssue.number };
  }

  await github.rest.issues.create({ ...repository, title, body });
  return { action: 'created' };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const mismatches = await checkDocumentedReleaseDrift();
  process.stdout.write(formatDriftIssue(mismatches));
}
