import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const read = (file) => readFile(path.resolve(file), 'utf8');

async function exists(file) {
  try {
    await access(path.resolve(file));
    return true;
  } catch {
    return false;
  }
}

test('presents the official Conceal visual identity', async () => {
  const [css, layout, brand, home, icon] = await Promise.all([
    read('app/global.css'),
    read('lib/layout.shared.tsx'),
    read('components/brand-mark.tsx'),
    read('app/(home)/page.tsx'),
    read('app/icon.svg'),
  ]);

  assert.match(css, /--conceal-signal:\s*#ffa500/i);
  assert.match(css, /--conceal-ink:\s*#0a0a0a/i);
  assert.match(layout, /BrandMark/);
  assert.match(brand, /conceal-mark\.svg/);
  assert.match(home, /Choose a wallet/);
  assert.match(home, /Run a node/);
  assert.match(home, /Build with Conceal/);
  assert.doesNotMatch(icon, /#2dd4bf/i);
  assert.equal(await exists('public/brand/conceal-mark.svg'), true);
});

test('publishes the four essential wallet journeys', async () => {
  const journeys = [
    ['content/docs/wallets/install.mdx', /Windows|macOS|Linux/, /official.*release/i],
    ['content/docs/wallets/create-or-restore.mdx', /create.*wallet/i, /restore.*wallet/i],
    ['content/docs/wallets/send-and-receive.mdx', /receive CCX/i, /send CCX/i],
    ['content/docs/wallets/update-and-move.mdx', /update/i, /new device|move/i],
  ];

  for (const [file, first, second] of journeys) {
    assert.equal(await exists(file), true, file);
    const source = await read(file);
    assert.match(source, first, file);
    assert.match(source, second, file);
    assert.match(source, /^## Resources$/m, file);
  }
});

test('adds comparison tables and task diagrams to the documentation', async () => {
  const [wallets, releases, network, node] = await Promise.all([
    read('content/docs/wallets/index.mdx'),
    read('content/docs/releases-and-verification.mdx'),
    read('content/docs/network-and-ccx.mdx'),
    read('content/docs/run-a-node.mdx'),
  ]);

  assert.match(wallets, /\| Wallet \| Best for \| Platform/);
  assert.match(releases, /\| Component \| Documented version \|/);
  assert.match(network, /\| Parameter \| Value \|/);
  assert.match(node, /\| Interface \| Default port \|/);
  assert.match(await read('content/docs/backup-and-security.mdx'), /wallet-recovery\.svg/);
  assert.match(node, /node-rpc-boundary\.svg/);
  assert.equal(await exists('public/diagrams/wallet-recovery.svg'), true);
  assert.equal(await exists('public/diagrams/node-rpc-boundary.svg'), true);
});
