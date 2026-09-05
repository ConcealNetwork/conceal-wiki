import assert from 'node:assert/strict';
import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { operatorSafetyChecks, operatorSafetyMutations } from './operator-safety.mjs';
import { EXPECTED_DOCS } from './expected-docs.mjs';

const docsDirectory = path.resolve('content/docs');
const expectedNavigation = [
  'start-here',
  'wallets',
  'backup-and-security',
  'network-and-ccx',
  'earn-and-deposits',
  'messaging',
  'transactions',
  'mining',
  'run-a-node',
  'developer-and-api',
  'wccx-bridge',
  'releases-and-verification',
  'troubleshooting',
  'support',
  'glossary',
  'research',
  'historical',
];
const taskTwoSources = [
  'content/docs/wallets/index.mdx',
  'content/docs/wallets/install.mdx',
  'content/docs/wallets/create-or-restore.mdx',
  'content/docs/wallets/send-and-receive.mdx',
  'content/docs/wallets/update-and-move.mdx',
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

test('presents Conceal documentation without migration-era editorial copy', async () => {
  const home = await readFile(path.resolve('app/(home)/page.tsx'), 'utf8');
  const readme = await readFile(path.resolve('README.md'), 'utf8');
  const sources = [...(await readMdxSources()).map(([, source]) => source), home, readme];
  const prohibitedCopy = [
    /source[- ]backed/i,
    /legacy(?:[ -]wiki| production wiki| documentation| page| roadmap| media)/i,
    /conceal\.network\/wiki/i,
    /\b(?:migration preview|migration snapshot|migration material|migration and cutover|this migration|for this migration)\b/i,
    /authoritative until/i,
    /separately approved cutover/i,
    /searchable, reviewable|maintained, reviewable|version-controlled and reviewable/i,
    /^Status: (?:Current|Experimental|Historical|Unavailable)$/im,
    /^Last verified:/im,
    /^## Primary sources$/im,
  ];

  for (const source of sources) {
    for (const pattern of prohibitedCopy) assert.doesNotMatch(source, pattern);
  }
  assert.equal(await fileExists(path.resolve('ATTRIBUTION.md')), false);
});

test('links every published guide to useful project resources', async () => {
  for (const [file, source] of await readMdxSources()) {
    assert.match(
      source,
      /^## Resources\s*$((?:(?!^## ).)*https:\/\/)/ms,
      `${file}: resource URL`,
    );
  }
});

test('includes research and historical archive pages with explicit retirement boundaries', async () => {
  for (const source of taskFourSources) {
    assert.equal(await fileExists(path.resolve(source)), true, `${source}: expected Task 4 page`);
  }
  assert.equal(await fileExists(path.resolve('content/docs/historical/meta.json')), true, 'historical navigation');

  const research = await readFile(path.resolve('content/docs/research.mdx'), 'utf8');
  assert.match(research, /experimental/i);
  assert.match(research, /unaudited/i);
  assert.match(research, /not a consensus decision/i);

  for (const source of [
    'content/docs/historical/conceal-id.mdx',
    'content/docs/historical/conceal-pay.mdx',
  ]) {
    const archive = await readFile(path.resolve(source), 'utf8');
    assert.match(archive, /(?:unavailable|do not use|do not follow)/i);
    assert.doesNotMatch(archive, /https:\/\/conceal\.cloud\/[^\s)]+/i);
  }
});

test('keeps retired-product notices direct and non-operational', async () => {
  const concealLive = await readFile(path.resolve('content/docs/historical/conceal-live.mdx'), 'utf8');
  assert.match(concealLive, /discontinued/i);
  assert.match(concealLive, /do not use old setup/i);

  const roadmapAndMedia = await readFile(
    path.resolve('content/docs/historical/roadmap-and-media.mdx'),
    'utf8',
  );
  assert.match(roadmapAndMedia, /release history/i);
  assert.match(roadmapAndMedia, /do not confirm that a product shipped/i);
});

test('does not link to the superseded documentation system', async () => {
  for (const [file, source] of await readMdxSources()) {
    assert.doesNotMatch(source, /https:\/\/conceal\.network\/wiki/i, file);
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
  assert.doesNotMatch(
    troubleshooting,
    /(?:^|\n)\s*(?:[-*]\s*)?`?(?:reset\b|rm\s+-rf|(?:delete|remove)\s+(?:the\s+)?(?:blockchain|chain data|data directory))/im,
  );
});

test('describes fixed consensus issuance separately from dated explorer figures', async () => {
  const network = await readFile(path.resolve('content/docs/network-and-ccx.mdx'), 'utf8');

  assert.match(network, /fixed consensus/i);
  assert.match(network, /200,000,000 CCX/);
  assert.match(network, /120-second|120 seconds/i);
  assert.match(network, /6 CCX/);
  assert.match(network, /At \*\*2026-09-05[^\n]+the explorer reported/i);
  assert.match(network, /33,712,033\.757459 CCX/);
  assert.match(network, /2026-09-05/);
  assert.doesNotMatch(network, /^\|[^\n]*(?:current height|issued supply|circulating|deposits)[^\n]*\|/im);
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

test('explains CN-GPU mining mechanics from the Core implementation', async () => {
  const mining = await readFile(path.resolve('content/docs/mining.mdx'), 'utf8');
  assert.match(mining, /https:\/\/github\.com\/ConcealNetwork\/conceal-core\/blob\/master\/src\/CryptoNoteCore\/Miner\.cpp/);
  assert.match(mining, /miner[^.\n]{0,120}(?:proof-of-work|candidate block)/i);
  assert.match(mining, /submit[^.\n]{0,120}(?:candidate|work|block)/i);
  assert.match(mining, /reward[^.\n]{0,120}(?:accepted|block|valid)/i);
  assert.match(mining, /\bsolo mining\b/i);
  assert.match(mining, /\ba pool coordinates\b/i);
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

test('warns that Next Wallet is experimental', async () => {
  const nextWallet = path.resolve('content/docs/wallets/next-wallet.mdx');
  assert.equal(await fileExists(nextWallet), true, 'Next Wallet guide');
  if (!(await fileExists(nextWallet))) return;
  const source = await readFile(nextWallet, 'utf8');
  assert.match(source, /experimental and unaudited/i);
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
