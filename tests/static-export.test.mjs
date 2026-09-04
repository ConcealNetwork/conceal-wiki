import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const outputDirectory = path.resolve('out');
const walletSafetyPatterns = [
  /(?:seed phrase|mnemonic)\s*(?:example|:|\[)/i,
  /private(?:[\s-]+[a-z]+){0,2}[\s-]+key\s*(?:example|:|\[)/i,
  /rm\s+-rf/i,
  /(?:browser|web) wallet[^.\n]{0,160}(?:stores?|uploads?|backs? up)[^.\n]{0,160}conceal (?:server|network)/i,
  /(?:native|official) iOS wallet/i,
];
const privateViewKeyMutation = 'private view key: test-only-sensitive-material';

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

test('exports the verified documentation landing pages', async () => {
  const home = await readFile(path.join(outputDirectory, 'index.html'), 'utf8');
  const docs = await readFile(path.join(outputDirectory, 'docs/index.html'), 'utf8');
  const startHere = await readFile(path.join(outputDirectory, 'docs/start-here/index.html'), 'utf8');
  const walletChoice = await readFile(
    path.join(outputDirectory, 'docs/start-here/choose-a-wallet/index.html'),
    'utf8',
  );
  const network = await readFile(path.join(outputDirectory, 'docs/network-and-ccx/index.html'), 'utf8');

  assert.match(home, /Conceal Wiki/);
  assert.doesNotMatch(home, /Migration preview/i);
  assert.doesNotMatch(docs, /migration preview/i);
  for (const page of [docs, startHere, walletChoice, network]) {
    assert.match(page, /Status: Current/);
    assert.match(page, /Last verified: 2026-09-05/);
  }
});

test('exports every Task 2 user guide with its visible status contract', async () => {
  const currentRoutes = [
    'docs/wallets',
    'docs/wallets/desktop',
    'docs/wallets/core-cli',
    'docs/wallets/web',
    'docs/wallets/android',
    'docs/wallets/paper-wallet',
    'docs/backup-and-security',
    'docs/earn-and-deposits',
    'docs/messaging',
    'docs/support',
  ];
  const experimentalRoutes = ['docs/wallets/next-wallet'];

  for (const route of currentRoutes) {
    const pagePath = path.join(outputDirectory, route, 'index.html');
    const exists = await stat(pagePath).then(() => true, () => false);
    assert.equal(exists, true, `${route}: expected exported route`);
    if (!exists) continue;
    const page = await readFile(pagePath, 'utf8');
    assert.match(page, /Status: Current/);
    assert.match(page, /Last verified: 2026-09-05/);
  }
  for (const route of experimentalRoutes) {
    const pagePath = path.join(outputDirectory, route, 'index.html');
    const exists = await stat(pagePath).then(() => true, () => false);
    assert.equal(exists, true, `${route}: expected exported route`);
    if (!exists) continue;
    const page = await readFile(pagePath, 'utf8');
    assert.match(page, /Status: Experimental/);
    assert.match(page, /Last verified: 2026-09-05/);
  }
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

test('exports one docs main landmark with the table of contents', async () => {
  const docs = await readFile(path.join(outputDirectory, 'docs/index.html'), 'utf8');
  assert.equal(docs.match(/<main(?:\s|>)/g)?.length, 1);
  assert.equal(docs.match(/href="#start-here"/g)?.length, 2);
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

test('does not export unsafe wallet recovery or platform claims', async () => {
  const exportFiles = await collectHtml(outputDirectory);
  const exportedText = [
    ...(await Promise.all(exportFiles.map((file) => readFile(file, 'utf8')))),
    ...(await collectReachableJavaScript()),
  ].join('\n');
  for (const prohibitedContent of walletSafetyPatterns) {
    assert.doesNotMatch(exportedText, prohibitedContent);
  }
});

test('export safety policy rejects a private view key example mutation', () => {
  const privateKeyPattern = walletSafetyPatterns[1];
  assert.match(privateViewKeyMutation, privateKeyPattern);
  assert.throws(() => assert.doesNotMatch(privateViewKeyMutation, privateKeyPattern));
});
