import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
}

test('direct dependencies use current compatible floating ranges and TypeScript transition aliases', async () => {
  const manifest = await readJson('../package.json');

  assert.deepEqual(manifest.dependencies, {
    cn: '^0.2.5',
    'fumadocs-core': '^16.15.7',
    'fumadocs-mdx': '^15.4.0',
    'fumadocs-ui': 'npm:@fumadocs/base-ui@^16.15.7',
    'lucide-react': '^1.41.0',
    next: '^16.3.4',
    react: '^19.2.8',
    'react-dom': '^19.2.8',
  });

  assert.deepEqual(manifest.devDependencies, {
    '@biomejs/biome': '2.5.12',
    '@tailwindcss/postcss': '^4.3.3',
    '@types/mdx': '^2.0.14',
    '@types/node': '^26.4.1',
    '@types/react': '^19.2.18',
    '@types/react-dom': '^19.2.7',
    '@typescript/native': 'npm:typescript@^7.0.2',
    postcss: '^8.5.28',
    serve: '^14.2.6',
    tailwindcss: '^4.3.3',
    typescript: 'npm:@typescript/typescript6@^6.0.2',
  });

  assert.equal(
    manifest.scripts['build:prod'],
    'SITE_BASE_PATH=/wiki SITE_ORIGIN=https://conceal.network next build && rm -rf dist && mv out dist',
  );
  assert.equal(manifest.scripts.lint, 'biome lint .');
  assert.equal(manifest.scripts['lint:fix'], 'biome lint --write .');
  assert.equal(manifest.scripts.format, 'biome format .');
  assert.equal(manifest.scripts['format:fix'], 'biome format --write .');
});

test('Biome config matches the repo-kit typescript module at 2.5.12 with single quotes', async () => {
  const biome = await readJson('../biome.json');

  assert.deepEqual(biome, {
    $schema: 'https://biomejs.dev/schemas/2.5.12/schema.json',
    vcs: {
      enabled: true,
      clientKind: 'git',
      useIgnoreFile: true,
    },
    files: {
      ignoreUnknown: false,
    },
    formatter: {
      enabled: true,
      indentStyle: 'space',
      indentWidth: 2,
    },
    linter: {
      enabled: true,
      rules: {
        preset: 'recommended',
        a11y: {
          useButtonType: 'off',
          noAutofocus: 'off',
          noRedundantRoles: 'off',
          noStaticElementInteractions: 'off',
          useKeyWithClickEvents: 'off',
          noSvgWithoutTitle: 'off',
        },
        complexity: {
          noImportantStyles: 'off',
          noUselessFragments: 'off',
        },
        correctness: {
          useExhaustiveDependencies: 'off',
        },
        style: {
          noNonNullAssertion: 'off',
        },
        suspicious: {
          noArrayIndexKey: 'off',
          useIterableCallbackReturn: 'off',
        },
      },
    },
    javascript: {
      formatter: {
        quoteStyle: 'single',
        jsxQuoteStyle: 'single',
      },
    },
    assist: {
      enabled: true,
      actions: {
        source: {
          organizeImports: 'on',
        },
      },
    },
  });
});

test('verify runs the complete dependency policy suite after the Pages build', async () => {
  const manifest = await readJson('../package.json');

  assert.equal(manifest.scripts.test, 'node --test tests/*.test.mjs');
  assert.equal(
    manifest.scripts['test:prod'],
    'EXPORT_DIR=dist SITE_BASE_PATH=/wiki SITE_ORIGIN=https://conceal.network node --test tests/static-export.test.mjs',
  );
  assert.equal(
    manifest.scripts.verify,
    'npm run lint && npm run types:check && GITHUB_PAGES=true npm run build && npm run test',
  );
});

test('Dependabot has no npm ignore exceptions', async () => {
  const dependabot = await readFile(
    new URL('../.github/dependabot.yml', import.meta.url),
    'utf8',
  );
  const npmUpdate = dependabot.match(
    /- package-ecosystem: npm([\s\S]*?)(?=\n {2}- package-ecosystem:|$)/,
  )?.[1];

  assert.ok(npmUpdate, 'expected an npm Dependabot update configuration');
  assert.equal(/^\s*ignore:/m.test(npmUpdate), false);
});

test('Pages workflow permits only the approved full action pins', async () => {
  const workflow = await readFile(
    new URL('../.github/workflows/pages.yml', import.meta.url),
    'utf8',
  );
  const actionReferences = [
    ...workflow.matchAll(
      /^\s*(?:-\s+)?uses:\s*([^\s#]+)(?:\s+#\s*([^\r\n]+))?$/gm,
    ),
  ].map(([, reference, tag]) => `${reference} # ${tag}`);

  assert.deepEqual(actionReferences, [
    'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1',
    'actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0',
    'actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d # v6.0.0',
    'actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9 # v5.0.0',
    'actions/deploy-pages@368f82528645a54fb793d4d04e342629a3f51346 # v5.0.1',
  ]);
});

test('TypeScript transition exposes the native CLI and TypeScript 6 API offline', async () => {
  const executable = process.platform === 'win32' ? 'tsc.cmd' : 'tsc';
  const tscPath = new URL(
    `../node_modules/.bin/${executable}`,
    import.meta.url,
  );
  const { stdout } = await execFileAsync(fileURLToPath(tscPath), ['--version']);
  const typescript = await import('typescript');

  assert.equal(stdout.trim(), 'Version 7.0.2');
  assert.equal(typescript.version, '6.0.2');
});
