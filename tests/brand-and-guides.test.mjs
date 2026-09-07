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
  const [css, layout, brand, home, icon, appLayout] = await Promise.all([
    read('app/global.css'),
    read('lib/layout.shared.tsx'),
    read('components/brand-mark.tsx'),
    read('app/(home)/page.tsx'),
    read('app/icon.svg'),
    read('app/layout.tsx'),
  ]);

  assert.match(css, /--conceal-signal:\s*#ffa600/i);
  assert.match(css, /--conceal-ink:\s*#1a1613/i);
  assert.match(css, /hsl\(36 38% 97%\)/);
  assert.match(css, /hsl\(30 9% 9%\)/);
  assert.match(layout, /BrandMark/);
  assert.match(appLayout, /Geist/);
  assert.match(brand, /conceal-mark\.svg/);
  assert.match(brand, /conceal-mark-on-light\.svg/);
  assert.match(home, /Choose a wallet/);
  assert.match(home, /Run a node/);
  assert.match(home, /Build with Conceal/);
  assert.doesNotMatch(icon, /#2dd4bf/i);
  assert.equal(await exists('public/brand/conceal-mark.svg'), true);
  assert.equal(await exists('public/brand/conceal-mark-on-light.svg'), true);
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
  const backup = await read('content/docs/backup-and-security.mdx');
  assert.match(backup, /wallet-recovery\.svg/);
  assert.match(backup, /mywallet\.wallet/);
  assert.match(backup, /wallet\.json/);
  assert.match(backup, /not interchangeable/i);
  assert.match(node, /node-rpc-boundary\.svg/);
  assert.equal(await exists('public/diagrams/wallet-recovery.svg'), true);
  assert.equal(await exists('public/diagrams/node-rpc-boundary.svg'), true);
});

test('explains how to contribute with an issue or a pull request', async () => {
  const [contributing, readme] = await Promise.all([
    read('CONTRIBUTING.md'),
    read('README.md'),
  ]);

  assert.match(readme, /CONTRIBUTING\.md/);
  assert.match(contributing, /open an issue/i);
  assert.match(contributing, /pull request/i);
  assert.match(contributing, /public\/screenshots/);
  assert.match(contributing, /kebab-case/);
  assert.match(contributing, /next-wallet-account\.png/);
  assert.match(contributing, /npm run verify/);
});

test('publishes sanitized product screenshots and folder how-tos', async () => {
  const [createOrRestore, sendAndReceive, desktop, nextWallet, screenshotsReadme, brand, contributing] =
    await Promise.all([
      read('content/docs/wallets/create-or-restore.mdx'),
      read('content/docs/wallets/send-and-receive.mdx'),
      read('content/docs/wallets/desktop.mdx'),
      read('content/docs/wallets/next-wallet.mdx'),
      read('public/screenshots/README.md'),
      read('public/brand/README.md'),
      read('CONTRIBUTING.md'),
    ]);

  for (const screenshot of [
    'public/screenshots/web-wallet-create-or-import.png',
    'public/screenshots/android-send.png',
    'public/screenshots/android-receive.png',
    'public/screenshots/desktop-wallet-dashboard.png',
    'public/screenshots/next-wallet-landing.png',
    'public/screenshots/next-wallet-account.png',
    'public/screenshots/conceal-mobile-create-pwa.png',
    'public/screenshots/conceal-mobile-add-pwa.png',
  ]) {
    assert.equal(await exists(screenshot), true, screenshot);
  }

  assert.equal(await exists('public/brand/desktop-wallet-dashboard.png'), false);
  assert.doesNotMatch(brand, /desktop-wallet-dashboard\.png/);
  assert.match(createOrRestore, /web-wallet-create-or-import\.png/);
  assert.match(sendAndReceive, /android-send\.png/);
  assert.match(sendAndReceive, /android-receive\.png/);
  assert.match(desktop, /desktop-wallet-dashboard\.png/);
  const android = await read('content/docs/wallets/android.mdx');
  assert.match(android, /android-send\.png/);
  assert.match(android, /android-receive\.png/);
  assert.match(android, /f-droid\.org\/en\/packages\/com\.concealnetwork\.concealmobile/);
  assert.match(android, /Conceal Mobile/);
  assert.doesNotMatch(android, /6\.0\.4-f-droid/);
  assert.match(nextWallet, /next-wallet-landing\.png/);
  assert.match(nextWallet, /next-wallet-account\.png/);
  const iosPwa = await read('content/docs/wallets/ios-pwa.mdx');
  assert.match(iosPwa, /conceal-mobile-create-pwa\.png/);
  assert.match(iosPwa, /conceal-mobile-add-pwa\.png/);
  assert.match(iosPwa, /Add to Home Screen/);
  assert.doesNotMatch(iosPwa, /(?:native|official) iOS wallet/i);
  assert.doesNotMatch(contributing, /Next Wallet still needs a capture/);
  assert.match(screenshotsReadme, /CONTRIBUTING\.md/);
  assert.match(screenshotsReadme, /How to add a file/);
  assert.match(screenshotsReadme, /Width \*\*1280 px\*\*/);
  assert.match(brand, /CONTRIBUTING\.md/);
  assert.match(brand, /How to add a file/);
  assert.match(contributing, /public\/screenshots\/README\.md/);
  assert.doesNotMatch(screenshotsReadme, /SHA-256/);
  assert.doesNotMatch(brand, /SHA-256|sourced 6 September/i);
  assert.doesNotMatch(screenshotsReadme, /seed phrase|private spend key/i);
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
