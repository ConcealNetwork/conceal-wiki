import assert from 'node:assert/strict';
import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { operatorSafetyChecks, operatorSafetyMutations } from './operator-safety.mjs';

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

test('requires dated operational content and primary sources on every published MDX page', async () => {
  for (const [file, source] of await readMdxSources()) {
    assert.match(source, /Status: (?:Current|Experimental)/, `${file}: operational status`);
    assert.match(source, new RegExp(`Last verified: ${verificationDate}`), `${file}: verification date`);
    assert.match(
      source,
      /^## Primary sources\s*$((?:(?!^## ).)*https:\/\/)/ms,
      `${file}: primary-source URL`,
    );
  }
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
