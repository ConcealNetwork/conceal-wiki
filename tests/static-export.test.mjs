import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const outputDirectory = path.resolve('out');

async function collectHtml(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectHtml(entryPath)));
    if (entry.isFile() && entry.name.endsWith('.html')) files.push(entryPath);
  }
  return files;
}

test('exports links and assets beneath the GitHub project path', async () => {
  const home = await readFile(path.join(outputDirectory, 'index.html'), 'utf8');
  assert.match(home, /href="\/conceal-wiki\/docs\//);
  assert.match(home, /(?:src|href)="\/conceal-wiki\/_next\//);
});

test('exports the Conceal migration preview', async () => {
  const home = await readFile(path.join(outputDirectory, 'index.html'), 'utf8');
  const docs = await readFile(path.join(outputDirectory, 'docs/index.html'), 'utf8');
  assert.match(home, /Conceal Wiki/);
  assert.match(home, /Migration preview/);
  assert.match(home, /https:\/\/conceal\.network\/wiki\//);
  assert.match(docs, /Conceal documentation is moving/);
});

test('exports project-prefixed public social image URLs', async () => {
  const docs = await readFile(path.join(outputDirectory, 'docs/index.html'), 'utf8');
  const imageUrl = 'https://concealnetwork.github.io/conceal-wiki/og/docs/image.png';
  assert.doesNotMatch(docs, /https?:\/\/localhost(?::\d+)?/);
  assert.match(docs, new RegExp(`property="og:image" content="${imageUrl}"`));
  assert.match(docs, new RegExp(`name="twitter:image" content="${imageUrl}"`));
});

test('exports a project-prefixed favicon whose target exists', async () => {
  const home = await readFile(path.join(outputDirectory, 'index.html'), 'utf8');
  const favicon = home.match(/<link rel="icon" href="([^"]+)"/);
  assert.ok(favicon, 'expected the exported home page to declare a favicon');
  assert.match(favicon[1], /^\/conceal-wiki\//);

  const faviconPath = new URL(favicon[1], 'https://example.test').pathname.replace(
    /^\/conceal-wiki\//,
    '',
  );
  assert.equal((await stat(path.join(outputDirectory, faviconPath))).isFile(), true);
});

test('does not expose a local filesystem path', async () => {
  const files = await collectHtml(outputDirectory);
  const html = (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n');
  assert.doesNotMatch(html, /(?:file:\/\/)?\/Users\/travis\//);
  assert.doesNotMatch(html, /\/tmp\/conceal-wiki-/);
});
