export const DOCUMENTED_RELEASES = Object.freeze({
  Core: '6.7.5',
  Desktop: '6.7.8',
  'Web Wallet': 'v2.1.4',
  Android: 'v6.0.4-f-droid',
  Guardian: 'v0.7.8',
  'Conceal API': '0.8.8',
  'JS Library': 'v0.3.1',
  'Wallet SDK': 'v0.2.14',
});

export const OFFICIAL_RELEASE_ENDPOINTS = Object.freeze({
  Core: 'https://api.github.com/repos/ConcealNetwork/conceal-core/releases/latest',
  Desktop: 'https://api.github.com/repos/ConcealNetwork/conceal-desktop/releases/latest',
  'Web Wallet': 'https://api.github.com/repos/ConcealNetwork/conceal-web-wallet/releases/latest',
  Android: 'https://api.github.com/repos/ConcealNetwork/conceal-wallet-cordova/releases/latest',
  Guardian: 'https://api.github.com/repos/ConcealNetwork/conceal-guardian/releases/latest',
  'Conceal API': 'https://registry.npmjs.org/conceal-api/latest',
  'JS Library': 'https://api.github.com/repos/ConcealNetwork/conceal-lib-js/releases/latest',
  'Wallet SDK': 'https://api.github.com/repos/ConcealNetwork/conceal-wallet-sdk/releases/latest',
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

  return `## Documentation versions changed\n\nThe versions listed in the docs no longer match their official release sources. Check each release, then update the affected guides.\n\n| Component | Documented tag | Latest tag |\n| --- | --- | --- |\n${rows}\n\nThis issue does not edit or publish documentation.\n`;
}

export async function fetchOfficialReleaseTags(fetchImplementation = fetch) {
  const entries = await Promise.all(Object.entries(OFFICIAL_RELEASE_ENDPOINTS).map(async ([component, endpoint]) => {
    const requestOptions = component === 'Conceal API'
      ? {}
      : { headers: { Accept: 'application/vnd.github+json' } };
    const response = await fetchImplementation(endpoint, requestOptions);
    if (!response.ok) throw new Error(`${component}: official release lookup failed (${response.status})`);

    const release = await response.json();
    const version = component === 'Conceal API' ? release.version : release.tag_name;
    if (typeof version !== 'string' || version.length === 0) {
      throw new Error(`${component}: official release response has no version`);
    }
    return [component, version];
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
