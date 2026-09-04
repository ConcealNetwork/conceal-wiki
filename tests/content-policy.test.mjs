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

test('records legacy documentation attribution and licence', async () => {
  const attribution = await readFile(path.resolve('ATTRIBUTION.md'), 'utf8');
  assert.match(attribution, /https:\/\/conceal\.network\/wiki\//);
  assert.match(attribution, /GNU Free Documentation License 1\.3/);
});
