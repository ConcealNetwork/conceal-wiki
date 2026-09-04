import assert from 'node:assert/strict';
import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

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

test('labels Next Wallet experimental', async () => {
  const nextWallet = path.resolve('content/docs/wallets/next-wallet.mdx');
  assert.equal(await fileExists(nextWallet), true, 'Next Wallet guide');
  if (!(await fileExists(nextWallet))) return;
  const source = await readFile(nextWallet, 'utf8');
  assert.match(source, /Status: Experimental/);
});

test('does not publish unsafe wallet recovery or platform claims', async () => {
  const sources = (await readMdxSources()).map(([, source]) => source).join('\n');
  for (const prohibitedContent of [
    /(?:seed phrase|mnemonic)\s*(?:example|:|\[)/i,
    /private (?:spend )?key\s*(?:example|:|\[)/i,
    /rm\s+-rf/i,
    /(?:browser|web) wallet[^.\n]{0,160}(?:stores?|uploads?|backs? up)[^.\n]{0,160}conceal (?:server|network)/i,
    /(?:native|official) iOS wallet/i,
  ]) {
    assert.doesNotMatch(sources, prohibitedContent);
  }
});

test('records legacy documentation attribution and licence', async () => {
  const attribution = await readFile(path.resolve('ATTRIBUTION.md'), 'utf8');
  assert.match(attribution, /https:\/\/conceal\.network\/wiki\//);
  assert.match(attribution, /GNU Free Documentation License 1\.3/);
});
