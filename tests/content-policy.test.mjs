import assert from 'node:assert/strict';
import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { operatorSafetyChecks, operatorSafetyMutations } from './operator-safety.mjs';
import { EXPECTED_DOCS } from './expected-docs.mjs';

const docsDirectory = path.resolve('content/docs');
const verificationDate = '2026-09-05';
const expectedNavigation = [
  'start-here',
  'wallets',
  'backup-and-security',
  'network-and-ccx',
  'earn-and-deposits',
  'messaging',
  'mining',
  'run-a-node',
  'developer-and-api',
  'wccx-bridge',
  'releases-and-verification',
  'troubleshooting',
  'support',
  'research',
  'historical',
];
const taskTwoSources = [
  'content/docs/wallets/index.mdx',
  'content/docs/wallets/desktop.mdx',
  'content/docs/wallets/core-cli.mdx',
  'content/docs/wallets/web.mdx',
  'content/docs/wallets/android.mdx',
  'content/docs/wallets/next-wallet.mdx',
  'content/docs/wallets/paper-wallet.mdx',
  'content/docs/backup-and-security.mdx',
  'content/docs/earn-and-deposits.mdx',
  'content/docs/messaging.mdx',
  'content/docs/support.mdx',
];
const taskThreeSources = [
  'content/docs/mining.mdx',
  'content/docs/run-a-node.mdx',
  'content/docs/developer-and-api.mdx',
  'content/docs/releases-and-verification.mdx',
  'content/docs/wccx-bridge.mdx',
];
const taskFourSources = [
  'content/docs/research.mdx',
  'content/docs/historical/index.mdx',
  'content/docs/historical/conceal-live.mdx',
  'content/docs/historical/conceal-id.mdx',
  'content/docs/historical/conceal-pay.mdx',
  'content/docs/historical/roadmap-and-media.mdx',
];
const walletSafetyPatterns = [
  /(?:seed phrase|mnemonic)\s*(?:example|:|\[)/i,
  /private(?:[\s-]+[a-z]+){0,2}[\s-]+key\s*(?:example|:|\[)/i,
  /rm\s+-rf/i,
  /(?:browser|web) wallet[^.\n]{0,160}(?:stores?|uploads?|backs? up)[^.\n]{0,160}conceal (?:server|network)/i,
  /(?:native|official) iOS wallet/i,
];
const privateViewKeyMutation = 'private view key: test-only-sensitive-material';
const canonicalLegacyWikiUrl = /^https:\/\/conceal\.network\/wiki\/doku\.php(?:\?id=[a-z0-9_-]+)?$/i;

async function collectMdxFiles(directory = docsDirectory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectMdxFiles(entryPath)));
    if (entry.isFile() && entry.name.endsWith('.mdx')) files.push(entryPath);
  }
  return files;
}

async function readMdxSources() {
  return Promise.all((await collectMdxFiles()).map(async (file) => [file, await readFile(file, 'utf8')]));
}

async function fileExists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

test('orders the task-oriented root navigation', async () => {
  const meta = JSON.parse(await readFile(path.join(docsDirectory, 'meta.json'), 'utf8'));
  assert.deepEqual(meta.pages, expectedNavigation);
});

test('keeps the canonical expected source manifest present', async () => {
  for (const { source } of EXPECTED_DOCS) {
    assert.equal(await fileExists(path.resolve(source)), true, `${source}: expected documentation source`);
  }
});

test('requires dated operational content and primary sources on every published MDX page', async () => {
  for (const [file, source] of await readMdxSources()) {
    assert.match(source, /Status: (?:Current|Experimental|Historical|Unavailable)/, `${file}: status`);
    assert.match(source, new RegExp(`Last verified: ${verificationDate}`), `${file}: verification date`);
    assert.match(
      source,
      /^## Primary sources\s*$((?:(?!^## ).)*https:\/\/)/ms,
      `${file}: primary-source URL`,
    );
  }
});

test('includes research and historical archive pages with explicit retirement boundaries', async () => {
  for (const source of taskFourSources) {
    assert.equal(await fileExists(path.resolve(source)), true, `${source}: expected Task 4 page`);
  }
  assert.equal(await fileExists(path.resolve('content/docs/historical/meta.json')), true, 'historical navigation');

  const research = await readFile(path.resolve('content/docs/research.mdx'), 'utf8');
  assert.match(research, /Status: Experimental/);
  assert.match(research, /unaudited/i);
  assert.match(research, /provisional/i);
  assert.match(research, /not a consensus decision/i);

  for (const source of [
    'content/docs/historical/conceal-id.mdx',
    'content/docs/historical/conceal-pay.mdx',
  ]) {
    const archive = await readFile(path.resolve(source), 'utf8');
    assert.match(archive, /Status: Unavailable/);
    assert.match(archive, /(?:unavailable|do not use|do not follow)/i);
    assert.doesNotMatch(archive, /https:\/\/conceal\.cloud\/[^\s)]+/i);
  }
});

test('expands the dated legacy archive stubs without reviving them', async () => {
  const concealLive = await readFile(path.resolve('content/docs/historical/conceal-live.mdx'), 'utf8');
  assert.match(concealLive, /Q2 2021/);
  assert.match(concealLive, /discontinued/i);
  assert.match(concealLive, /https:\/\/conceal\.network\/wiki\/doku\.php\?id=clive/);
  assert.match(concealLive, /GNU Free Documentation License 1\.3/);

  const roadmapAndMedia = await readFile(
    path.resolve('content/docs/historical/roadmap-and-media.mdx'),
    'utf8',
  );
  assert.match(roadmapAndMedia, /2018[^\n]{0,80}2025|2025[^\n]{0,80}2018/);
  assert.match(roadmapAndMedia, /2019[^\n]{0,80}2022|2022[^\n]{0,80}2019/);
  assert.match(roadmapAndMedia, /historical|retired/i);
  assert.match(roadmapAndMedia, /https:\/\/conceal\.network\/wiki\/doku\.php\?id=roadmap/);
  assert.match(roadmapAndMedia, /https:\/\/conceal\.network\/wiki\/doku\.php\?id=media/);
  assert.match(roadmapAndMedia, /GNU Free Documentation License 1\.3/);
});

test('uses canonical DokuWiki URLs for legacy entry points and articles', async () => {
  for (const [file, source] of await readMdxSources()) {
    const urls = [...source.matchAll(/https:\/\/conceal\.network\/wiki[^\s)>]*/g)]
      .map(([url]) => url.replace(/[.,;:]$/, ''));
    for (const url of urls) {
      assert.match(url, canonicalLegacyWikiUrl, `${file}: ${url}`);
    }
  }

  for (const nonCanonical of [
    'https://conceal.network/wiki/',
    'https://conceal.network/wiki/start',
    'https://conceal.network/wiki/doku.php/start',
  ]) {
    assert.doesNotMatch(nonCanonical, canonicalLegacyWikiUrl);
  }
});

test('publishes safe troubleshooting for sync, output, and platform-startup failures', async () => {
  const sourcePath = path.resolve('content/docs/troubleshooting.mdx');
  const exists = await fileExists(sourcePath);
  assert.equal(exists, true, 'troubleshooting source');
  if (!exists) return;
  const troubleshooting = await readFile(sourcePath, 'utf8');

  assert.match(troubleshooting, /synchroniz/i);
  assert.match(troubleshooting, /(?:output|transaction)[^\n]{0,100}optimiz|optimiz[^\n]{0,100}(?:output|transaction)/i);
  assert.match(troubleshooting, /(?:start|launch)[^\n]{0,100}(?:fail|error)|(?:fail|error)[^\n]{0,100}(?:start|launch)/i);
  assert.match(troubleshooting, /https:\/\/conceal\.network\/wiki\/doku\.php\?id=faq/i);
  assert.doesNotMatch(
    troubleshooting,
    /(?:^|\n)\s*(?:[-*]\s*)?`?(?:reset\b|rm\s+-rf|(?:delete|remove)\s+(?:the\s+)?(?:blockchain|chain data|data directory))/im,
  );
});

test('describes current consensus issuance separately from a dated explorer snapshot', async () => {
  const network = await readFile(path.resolve('content/docs/network-and-ccx.mdx'), 'utf8');

  assert.match(network, /fixed consensus/i);
  assert.match(network, /200,000,000 CCX/);
  assert.match(network, /120-second|120 seconds/i);
  assert.match(network, /6 CCX/);
  assert.match(network, /live explorer snapshot/i);
  assert.match(network, /33,712,033\.757459 CCX/);
  assert.match(network, /2026-09-05/);
  assert.doesNotMatch(network, /^\|[^\n]*(?:height|reward|emission)[^\n]*\|/im);
});

test('links wallet choices to current internal guides in present tense', async () => {
  const chooseWallet = await readFile(path.resolve('content/docs/start-here/choose-a-wallet.mdx'), 'utf8');

  for (const route of ['desktop', 'core-cli', 'web', 'android', 'next-wallet']) {
    assert.match(chooseWallet, new RegExp(`\\.\\.\\/wallets\\/${route}\\.mdx`));
  }
  assert.doesNotMatch(chooseWallet, /Dedicated pages will cover/i);
});

test('does not retain migration-preview copy in published MDX', async () => {
  const sources = await readMdxSources();
  for (const [file, source] of sources) {
    assert.doesNotMatch(source, /migration preview/i, file);
  }
});

test('includes every Task 2 user guide', async () => {
  for (const source of taskTwoSources) {
    assert.equal(await fileExists(path.resolve(source)), true, `${source}: expected user guide`);
  }
  assert.equal(await fileExists(path.resolve('content/docs/wallets/meta.json')), true, 'wallet navigation');
});

test('includes every Task 3 operator and developer guide', async () => {
  for (const source of taskThreeSources) {
    assert.equal(await fileExists(path.resolve(source)), true, `${source}: expected operator guide`);
  }
});

test('links Task 3 guides to canonical operator and bridge sources', async () => {
  const sources = (await Promise.all(taskThreeSources.map((file) => readFile(path.resolve(file), 'utf8')))).join('\n');
  for (const source of [
    'https://github.com/ConcealNetwork/conceal-core/blob/master/docs/rpc/openapi/json_methods.yaml',
    'https://github.com/ConcealNetwork/conceal-core/releases',
    'https://github.com/ConcealNetwork/conceal-guardian/releases',
    'https://explorer.conceal.network/',
    'https://github.com/ConcealNetwork/wCCX',
  ]) {
    assert.match(sources, new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('explains CN-GPU mining mechanics from a primary source', async () => {
  const mining = await readFile(path.resolve('content/docs/mining.mdx'), 'utf8');
  assert.match(mining, /https:\/\/github\.com\/ConcealNetwork\/conceal-core\/blob\/master\/src\/CryptoNoteCore\/Miner\.cpp/);
  assert.match(mining, /miner[^.\n]{0,120}(?:proof of work|candidate block)/i);
  assert.match(mining, /submit[^.\n]{0,120}(?:candidate|work|block)/i);
  assert.match(mining, /reward[^.\n]{0,120}(?:accepted|block|valid)/i);
  assert.match(mining, /\bsolo mining\b/i);
  assert.match(mining, /\bin a pool\b/i);
});

test('does not publish stale or unsafe operator guidance', async () => {
  const sources = (await Promise.all(taskThreeSources.map((file) => readFile(path.resolve(file), 'utf8')))).join('\n');
  for (const [name, isUnsafe] of Object.entries(operatorSafetyChecks)) {
    assert.equal(isUnsafe(sources), false, name);
  }
});

test('operator safety policy rejects stale or unsafe example mutations', () => {
  for (const [name, mutations] of Object.entries(operatorSafetyMutations)) {
    for (const mutation of mutations) {
      assert.equal(operatorSafetyChecks[name](mutation), true, name);
    }
  }
});

test('labels Next Wallet experimental', async () => {
  const nextWallet = path.resolve('content/docs/wallets/next-wallet.mdx');
  assert.equal(await fileExists(nextWallet), true, 'Next Wallet guide');
  if (!(await fileExists(nextWallet))) return;
  const source = await readFile(nextWallet, 'utf8');
  assert.match(source, /Status: Experimental/);
});

test('does not publish unsafe wallet recovery or platform claims', async () => {
  const sources = (await readMdxSources()).map(([, source]) => source).join('\n');
  for (const prohibitedContent of walletSafetyPatterns) {
    assert.doesNotMatch(sources, prohibitedContent);
  }
});

test('source safety policy rejects a private view key example mutation', () => {
  const privateKeyPattern = walletSafetyPatterns[1];
  assert.match(privateViewKeyMutation, privateKeyPattern);
  assert.throws(() => assert.doesNotMatch(privateViewKeyMutation, privateKeyPattern));
});

test('records legacy documentation attribution and licence', async () => {
  const attribution = await readFile(path.resolve('ATTRIBUTION.md'), 'utf8');
  assert.match(attribution, /https:\/\/conceal\.network\/wiki\//);
  assert.match(attribution, /GNU Free Documentation License 1\.3/);
});
