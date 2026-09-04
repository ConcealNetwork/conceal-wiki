import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
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

test('orders the task-oriented root navigation', async () => {
  const meta = JSON.parse(await readFile(path.join(docsDirectory, 'meta.json'), 'utf8'));
  assert.deepEqual(meta.pages, expectedNavigation);
});

test('publishes dated, current landing content with primary sources', async () => {
  const expectedPages = [
    'index.mdx',
    'start-here/index.mdx',
    'start-here/choose-a-wallet.mdx',
    'network-and-ccx.mdx',
  ];
  const sources = new Map(await readMdxSources());

  for (const page of expectedPages) {
    const source = sources.get(path.join(docsDirectory, page));
    assert.ok(source, `expected ${page} to be published`);
    assert.match(source, /Status: Current/);
    assert.match(source, new RegExp(`Last verified: ${verificationDate}`));
    assert.match(source, /## Primary sources/);
    assert.match(source, /https:\/\//);
  }
});

test('does not retain migration-preview copy in published MDX', async () => {
  const sources = await readMdxSources();
  for (const [file, source] of sources) {
    assert.doesNotMatch(source, /migration preview/i, file);
  }
});

test('records legacy documentation attribution and licence', async () => {
  const attribution = await readFile(path.resolve('ATTRIBUTION.md'), 'utf8');
  assert.match(attribution, /https:\/\/conceal\.network\/wiki\//);
  assert.match(attribution, /GNU Free Documentation License 1\.3/);
});
