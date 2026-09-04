import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const outputDirectory = path.resolve('out');

async function collectFiles(directory, extension) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(entryPath, extension)));
    if (entry.isFile() && entry.name.endsWith(extension)) files.push(entryPath);
  }
  return files;
}

async function collectHtml(directory) {
  return collectFiles(directory, '.html');
}

async function collectReachableJavaScript() {
  const htmlFiles = await collectHtml(outputDirectory);
  const html = await Promise.all(htmlFiles.map((file) => readFile(file, 'utf8')));
  const urls = new Set(html.flatMap((page) =>
    [...page.matchAll(/(?:src|href)="(\/conceal-wiki\/[^\"]+\.js)"/g)].map((match) => match[1]),
  ));

  return Promise.all(
    [...urls].map((url) => readFile(path.join(outputDirectory, url.replace(/^\/conceal-wiki\//, '')), 'utf8')),
  );
}

function metaContent(html, attribute, value) {
  const tag = [...html.matchAll(/<meta\s+[^>]*>/g)].find((match) =>
    match[0].includes(`${attribute}="${value}"`),
  );
  assert.ok(tag, `expected meta ${attribute}=${value}`);

  const content = tag[0].match(/content="([^"]*)"/);
  assert.ok(content, `expected meta ${attribute}=${value} to have content`);
  return content[1];
}

function publicTargetPath(publicPath) {
  const relativePath = publicPath.replace(/^\/conceal-wiki\//, '');
  return path.join(outputDirectory, relativePath, 'index.html');
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
  assert.equal(metaContent(docs, 'property', 'og:image'), imageUrl);
  assert.equal(metaContent(docs, 'name', 'twitter:image'), imageUrl);
});

for (const file of ['llms.txt', 'llms-full.txt']) {
  test(`${file} advertises project-prefixed documentation URLs that exist`, async () => {
    const llmText = await readFile(path.join(outputDirectory, file), 'utf8');
    const paths = [...llmText.matchAll(/(?:\]\(|\()(\/conceal-wiki\/[^)]+)\)/g)].map((match) => match[1]);

    assert.ok(paths.length > 0, `${file} should advertise a project-prefixed URL`);
    assert.doesNotMatch(llmText, /(?:\]\(|\()\/docs(?:[)/]|\))/);
    for (const publicPath of paths) {
      assert.ok(publicPath.endsWith('/'), `${file}: ${publicPath} should be a canonical Pages URL`);
      assert.equal((await stat(publicTargetPath(publicPath))).isFile(), true, `${file}: ${publicPath}`);
    }
  });
}

test('exports one home main landmark', async () => {
  const home = await readFile(path.join(outputDirectory, 'index.html'), 'utf8');
  assert.equal(home.match(/<main(?:\s|>)/g)?.length, 1);
});

test('does not export prohibited AI integrations', async () => {
  const exportFiles = await collectHtml(outputDirectory);
  const exportedText = [
    ...(await Promise.all(exportFiles.map((file) => readFile(file, 'utf8')))),
    ...(await collectReachableJavaScript()),
  ].join('\n');
  for (const prohibitedIntegration of [
    /scira\.ai/i,
    /chatgpt\.com/i,
    /claude\.ai/i,
    /cursor\.com/i,
    /Open in Scira AI/i,
    /Open in ChatGPT/i,
    /Open in Claude/i,
    /Open in Cursor/i,
  ]) {
    assert.doesNotMatch(exportedText, prohibitedIntegration);
  }
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
