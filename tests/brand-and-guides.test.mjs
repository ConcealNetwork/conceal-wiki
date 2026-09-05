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

test('publishes only sanitized, source-recorded product screenshots', async () => {
  const [createOrRestore, sendAndReceive, mediaNotes] = await Promise.all([
    read('content/docs/wallets/create-or-restore.mdx'),
    read('content/docs/wallets/send-and-receive.mdx'),
    read('public/screenshots/README.md'),
  ]);

  for (const screenshot of [
    'public/screenshots/web-wallet-create-or-import.png',
    'public/screenshots/android-send.png',
    'public/screenshots/android-receive.png',
  ]) {
    assert.equal(await exists(screenshot), true, screenshot);
  }

  assert.match(createOrRestore, /web-wallet-create-or-import\.png/);
  assert.match(sendAndReceive, /android-send\.png/);
  assert.match(sendAndReceive, /android-receive\.png/);
  assert.match(mediaNotes, /547b789c1facf80002c7928e9e2b33f50388219a/);
  assert.match(mediaNotes, /wallet\.conceal\.network/);
  assert.doesNotMatch(mediaNotes, /seed phrase|private spend key/i);
});

test('provides an executable local-RPC developer quickstart and accurate package channels', async () => {
  const developer = await read('content/docs/developer-and-api.mdx');

  assert.match(developer, /curl[^\n]+127\.0\.0\.1:16000\/getinfo/);
  assert.match(developer, /\| Project \| Current version \| Distribution \|/);
  assert.match(developer, /conceal-api[^\n]+0\.8\.8[^\n]+npm/i);
  assert.match(developer, /conceal-lib-js[^\n]+0\.3\.1[^\n]+GitHub Release/i);
  assert.match(developer, /conceal-wallet-sdk[^\n]+0\.2\.14[^\n]+GitHub Release/i);
  const rpcExamples = developer.match(/https?:\/\/[^\s)`]+:16000\/getinfo/g) ?? [];
  assert.deepEqual(rpcExamples, ['http://127.0.0.1:16000/getinfo']);
});

test('turns node guidance into an operations handbook', async () => {
  const node = await read('content/docs/run-a-node.mdx');

  assert.match(node, /ccx-cli-macOS-v6\.7\.5\.zip/);
  assert.match(node, /ccx-cli-ubuntu-2204-v6\.7\.5\.tar\.gz/);
  assert.match(node, /## First start and synchronization/);
  assert.match(node, /## Routine operations/);
  assert.match(node, /Discord|email/);
  assert.match(node, /Never publish an unauthenticated RPC endpoint/);
});

test('explains the transaction lifecycle and core terminology', async () => {
  const [transactions, glossary, navigation] = await Promise.all([
    read('content/docs/transactions.mdx'),
    read('content/docs/glossary.mdx'),
    read('content/docs/meta.json'),
  ]);

  assert.match(transactions, /transaction-lifecycle\.svg/);
  assert.match(transactions, /sign locally/i);
  assert.match(transactions, /mempool/i);
  assert.match(transactions, /confirmations?/i);
  assert.match(glossary, /## Mnemonic seed/);
  assert.match(glossary, /## View key/);
  assert.match(glossary, /## Integrated address/);
  assert.match(navigation, /"transactions"/);
  assert.match(navigation, /"glossary"/);
  assert.equal(await exists('public/diagrams/transaction-lifecycle.svg'), true);
});

test('offers a symptom-first troubleshooting index', async () => {
  const troubleshooting = await read('content/docs/troubleshooting.mdx');

  assert.match(troubleshooting, /\| Symptom \| Check first \| Continue with \|/);
  assert.match(troubleshooting, /balance looks wrong/i);
  assert.match(troubleshooting, /transaction is pending/i);
  assert.match(troubleshooting, /node keeps stopping/i);
  assert.match(troubleshooting, /Before contacting support/);
});
