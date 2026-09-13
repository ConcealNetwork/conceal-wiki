import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { resolveBasePath, resolveSiteUrl } from '../lib/base-path.mjs';
import {
  operatorSafetyChecks,
  operatorSafetyMutations,
} from './operator-safety.mjs';
import { EXPECTED_DOCS } from './expected-docs.mjs';

// Defaults describe the GitHub Pages artifact in `out/`. Setting `EXPORT_DIR`
// alongside the build's own `SITE_BASE_PATH` and `SITE_ORIGIN` runs this same
// contract against another deployment, such as the production `dist/` tree.
const exportEnvironment = { GITHUB_PAGES: 'true', ...process.env };
const basePath = resolveBasePath(exportEnvironment);
const siteUrl = resolveSiteUrl(exportEnvironment);
const outputDirectory = path.resolve(process.env.EXPORT_DIR ?? 'out');
const walletSafetyPatterns = [
  /(?:seed phrase|mnemonic)\s*(?:example|:|\[)/i,
  /private(?:[\s-]+[a-z]+){0,2}[\s-]+key\s*(?:example|:|\[)/i,
  /rm\s+-rf/i,
  /(?:browser|web) wallet[^.\n]{0,160}(?:stores?|uploads?|backs? up)[^.\n]{0,160}conceal (?:server|network)/i,
  /(?:native|official) iOS wallet/i,
];
const privateViewKeyMutation = 'private view key: test-only-sensitive-material';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const publicPrefix = escapeRegExp(basePath);

function missingExport(target) {
  const location = path.relative(process.cwd(), outputDirectory) || '.';

  return assert.fail(
    `${target} is missing from ${location}/. Build the export first: "GITHUB_PAGES=true npm run build" for out/, or "npm run build:prod" for dist/.`,
  );
}

/** Strips the deployment prefix from a published, root-relative URL. */
function stripBasePath(publicPath) {
  return publicPath.replace(new RegExp(`^${publicPrefix}/`), '');
}

async function readExport(relativePath) {
  try {
    return await readFile(path.join(outputDirectory, relativePath), 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return missingExport(relativePath);
  }
}

async function collectFiles(directory, extension) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(
    (error) => {
      if (error.code !== 'ENOENT') throw error;
      return missingExport(path.relative(outputDirectory, directory) || 'HTML');
    },
  );
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory())
      files.push(...(await collectFiles(entryPath, extension)));
    if (entry.isFile() && entry.name.endsWith(extension)) files.push(entryPath);
  }
  return files;
}

async function collectHtml(directory) {
  return collectFiles(directory, '.html');
}

async function collectCss(directory) {
  return collectFiles(directory, '.css');
}

async function collectReachableJavaScript() {
  const htmlFiles = await collectHtml(outputDirectory);
  const html = await Promise.all(
    htmlFiles.map((file) => readFile(file, 'utf8')),
  );
  const urls = new Set(
    html.flatMap((page) =>
      [
        ...page.matchAll(
          new RegExp(`(?:src|href)="(${publicPrefix}/[^"]+\\.js)"`, 'g'),
        ),
      ].map((match) => match[1]),
    ),
  );

  return Promise.all([...urls].map((url) => readExport(stripBasePath(url))));
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
  return path.join(outputDirectory, stripBasePath(publicPath), 'index.html');
}

test('exports links and assets beneath the deployment base path', async () => {
  const home = await readExport('index.html');
  assert.match(home, new RegExp(`href="${publicPrefix}/docs/`));
  assert.match(home, new RegExp(`(?:src|href)="${publicPrefix}/_next/`));
});

test('anchors the desktop sidebar to the viewport edge on wide screens', async () => {
  const cssFiles = await collectCss(outputDirectory);
  const css = (
    await Promise.all(cssFiles.map((file) => readFile(file, 'utf8')))
  ).join('\n');

  assert.match(
    css,
    /@media\s*\(min-width:\s*48rem\)[^{]*\{[\s\S]*?#nd-sidebar\s*\{[^}]*width:\s*var\(--fd-sidebar-width\)/,
  );
});

test('exports the official documentation landing pages', async () => {
  const home = await readExport('index.html');
  const docs = await readExport('docs/index.html');
  const startHere = await readExport('docs/start-here/index.html');
  const walletChoice = await readExport(
    'docs/start-here/choose-a-wallet/index.html',
  );
  const network = await readExport('docs/network-and-ccx/index.html');

  assert.match(home, /Use Conceal with confidence/);
  assert.match(home, /What do you need to do/);
  assert.match(docs, /Learn how to use Conceal Network/);
  for (const page of [home, docs, startHere, walletChoice, network]) {
    assert.doesNotMatch(
      page,
      /source-backed|migration|legacy (?:production )?wiki|Last verified:|Status: Current/i,
    );
  }
});

test('exports every source in the canonical expected-source manifest', async () => {
  for (const { route } of EXPECTED_DOCS) {
    const pagePath = path.join(outputDirectory, route, 'index.html');
    const exists = await stat(pagePath).then(
      () => true,
      () => false,
    );
    assert.equal(exists, true, `${route}: expected exported route`);
    if (!exists) continue;
  }
});

test('exports every user guide without editorial status stamps', async () => {
  const routes = [
    'docs/wallets',
    'docs/wallets/install',
    'docs/wallets/create-or-restore',
    'docs/wallets/send-and-receive',
    'docs/wallets/update-and-move',
    'docs/wallets/desktop',
    'docs/wallets/core-cli',
    'docs/wallets/web',
    'docs/wallets/android',
    'docs/wallets/ios-pwa',
    'docs/wallets/paper-wallet',
    'docs/backup-and-security',
    'docs/earn-and-deposits',
    'docs/messaging',
    'docs/support',
    'docs/wallets/next-wallet',
  ];

  for (const route of routes) {
    const pagePath = path.join(outputDirectory, route, 'index.html');
    const exists = await stat(pagePath).then(
      () => true,
      () => false,
    );
    assert.equal(exists, true, `${route}: expected exported route`);
    if (!exists) continue;
    const page = await readFile(pagePath, 'utf8');
    assert.doesNotMatch(page, /Last verified:|Status:/i);
  }
});

test('exports every operator and developer guide without editorial status stamps', async () => {
  const routes = [
    'docs/mining',
    'docs/run-a-node',
    'docs/developer-and-api',
    'docs/releases-and-verification',
    'docs/wccx-bridge',
  ];

  for (const route of routes) {
    const pagePath = path.join(outputDirectory, route, 'index.html');
    const exists = await stat(pagePath).then(
      () => true,
      () => false,
    );
    assert.equal(exists, true, `${route}: expected exported route`);
    if (!exists) continue;
    const page = await readFile(pagePath, 'utf8');
    assert.doesNotMatch(page, /Last verified:|Status:/i);
  }
});

test('exports research and retired-product notices with direct warnings', async () => {
  const routes = [
    'docs/research',
    'docs/historical',
    'docs/historical/conceal-live',
    'docs/historical/roadmap-and-media',
    'docs/historical/conceal-id',
    'docs/historical/conceal-pay',
  ];

  for (const route of routes) {
    const page = await readExport(path.join(route, 'index.html'));
    assert.doesNotMatch(page, /Last verified:|Status:/i);
  }
  assert.match(await readExport('docs/research/index.html'), /experimental/i);
  assert.match(
    await readExport('docs/historical/conceal-id/index.html'),
    /unavailable/i,
  );
  assert.match(
    await readExport('docs/historical/conceal-pay/index.html'),
    /unavailable/i,
  );
});

test('exports project-prefixed public social image URLs', async () => {
  const docs = await readExport('docs/index.html');
  const imageUrl = `${siteUrl}og/docs/image.png`;
  assert.doesNotMatch(docs, /https?:\/\/localhost(?::\d+)?/);
  assert.equal(metaContent(docs, 'property', 'og:image'), imageUrl);
  assert.equal(metaContent(docs, 'name', 'twitter:image'), imageUrl);
});

for (const file of ['llms.txt', 'llms-full.txt']) {
  test(`${file} advertises project-prefixed documentation URLs that exist`, async () => {
    const llmText = await readExport(file);
    const paths = [
      ...llmText.matchAll(
        new RegExp(`(?:\\]\\(|\\()(${publicPrefix}/[^)]+)\\)`, 'g'),
      ),
    ].map((match) => match[1]);

    assert.ok(
      paths.length > 0,
      `${file} should advertise a project-prefixed URL`,
    );
    assert.doesNotMatch(llmText, /(?:\]\(|\()\/docs(?:[)/]|\))/);
    for (const publicPath of paths) {
      assert.ok(
        publicPath.endsWith('/'),
        `${file}: ${publicPath} should be a canonical Pages URL`,
      );
      assert.equal(
        (await stat(publicTargetPath(publicPath))).isFile(),
        true,
        `${file}: ${publicPath}`,
      );
    }
  });
}

test('exports one home main landmark', async () => {
  const home = await readExport('index.html');
  assert.equal(home.match(/<main(?:\s|>)/g)?.length, 1);
});

test('exports one docs main landmark with the table of contents', async () => {
  const docs = await readExport('docs/index.html');
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

test('exports a prefixed favicon whose target exists', async () => {
  const home = await readExport('index.html');
  const favicon = home.match(/<link rel="icon" href="([^"]+)"/);
  assert.ok(favicon, 'expected the exported home page to declare a favicon');
  assert.match(favicon[1], new RegExp(`^${publicPrefix}/`));

  const faviconPath = stripBasePath(
    new URL(favicon[1], 'https://example.test').pathname,
  );
  assert.equal(
    (await stat(path.join(outputDirectory, faviconPath))).isFile(),
    true,
  );
});

test('does not expose a local filesystem path', async () => {
  const files = await collectHtml(outputDirectory);
  const html = (
    await Promise.all(files.map((file) => readFile(file, 'utf8')))
  ).join('\n');
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

test('does not export stale or unsafe operator guidance', async () => {
  const exportFiles = await collectHtml(outputDirectory);
  const exportedArtifacts = [
    ...(await Promise.all(exportFiles.map((file) => readFile(file, 'utf8')))),
    ...(await collectReachableJavaScript()),
  ];
  for (const [index, artifact] of exportedArtifacts.entries()) {
    for (const [name, isUnsafe] of Object.entries(operatorSafetyChecks)) {
      assert.equal(isUnsafe(artifact), false, `artifact ${index}: ${name}`);
    }
  }
});

test('export safety policy rejects unsafe operator mutations', () => {
  for (const [name, mutations] of Object.entries(operatorSafetyMutations)) {
    for (const mutation of mutations) {
      assert.equal(operatorSafetyChecks[name](mutation), true, name);
    }
  }
});

test('export safety policy rejects a private view key example mutation', () => {
  const privateKeyPattern = walletSafetyPatterns[1];
  assert.match(privateViewKeyMutation, privateKeyPattern);
  assert.throws(() =>
    assert.doesNotMatch(privateViewKeyMutation, privateKeyPattern),
  );
});
