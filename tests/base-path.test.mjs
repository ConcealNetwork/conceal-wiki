import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveBasePath, resolveSiteUrl } from '../lib/base-path.mjs';

test('builds for the domain root when no deployment target is set', () => {
  assert.equal(resolveBasePath({}), '');
  assert.equal(resolveSiteUrl({}), 'https://concealnetwork.github.io/');
});

test('keeps the project-path build used by the Pages test deployment', () => {
  const env = { GITHUB_PAGES: 'true' };

  assert.equal(resolveBasePath(env), '/conceal-wiki');
  assert.equal(
    resolveSiteUrl(env),
    'https://concealnetwork.github.io/conceal-wiki/',
  );
});

test('an explicit base path overrides the Pages project path', () => {
  const env = {
    GITHUB_PAGES: 'true',
    SITE_BASE_PATH: '/wiki',
    SITE_ORIGIN: 'https://conceal.network',
  };

  assert.equal(resolveBasePath(env), '/wiki');
  assert.equal(resolveSiteUrl(env), 'https://conceal.network/wiki/');
});

test('normalizes untidy base paths and origins', () => {
  assert.equal(resolveBasePath({ SITE_BASE_PATH: 'wiki' }), '/wiki');
  assert.equal(resolveBasePath({ SITE_BASE_PATH: '/wiki/' }), '/wiki');
  assert.equal(resolveBasePath({ SITE_BASE_PATH: '  ' }), '');
  assert.equal(
    resolveSiteUrl({ SITE_BASE_PATH: 'wiki/', SITE_ORIGIN: 'https://x.dev/' }),
    'https://x.dev/wiki/',
  );
});

test('an empty base path opts out of the Pages project path', () => {
  const env = { GITHUB_PAGES: 'true', SITE_BASE_PATH: '' };

  assert.equal(resolveBasePath(env), '');
});
