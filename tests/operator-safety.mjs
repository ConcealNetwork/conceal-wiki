const poolOrMinerHeader = /\b(?:pool|miner)\b/i;
const feeOrHashrateHeader = /\b(?:fee|hashrate)\b/i;
const poolDataValue = /(?:\b\d+(?:\.\d+)?\s*%|\b\d+(?:\.\d+)?\s*[kmgth]?h\/s\b)/i;
const rpcEndpoint = /\b(?:daemon|wallet)\s+RPC(?:\s+endpoint)?\b|(?:https?:\/\/)?(?:localhost|127\.0\.0\.1)(?::\d+)?\b/i;
const rpcExposureAction = /\b(?:expose|publish|open|forward|share|make)\b[^\n]{0,120}\b(?:public(?:ly)?|internet|external(?:ly)?|remote(?:ly)?|everyone|anyone)\b|\b(?:public(?:ly)?|internet|external(?:ly)?|remote(?:ly)?|everyone|anyone)\b[^\n]{0,120}\b(?:access|accessible|exposure|available)\b/i;

export function containsStaticPoolTable(content) {
  const tablePattern = /^\|([^\n]+)\|\s*\n\|(?:\s*:?-+:?\s*\|)+\s*\n((?:\|[^\n]+\|\s*\n?)+)/gm;
  return [...content.matchAll(tablePattern)].some(([, header, rows]) =>
    poolOrMinerHeader.test(header) && feeOrHashrateHeader.test(header) && poolDataValue.test(rows),
  );
}

export function containsUnsafeRpcExposureAdvice(content) {
  const prose = content.replace(/<[^>]*>/g, ' ').replace(/\\[nrt]/g, ' ');
  return prose
    .split(/[.!?]\s+/)
    .some((sentence) => rpcEndpoint.test(sentence) && rpcExposureAction.test(sentence));
}

export const operatorSafetyChecks = {
  staticPoolTable: containsStaticPoolTable,
  exchangeRecommendation: (content) => /(?:\b(?:we\s+)?recommend(?:ed)?\s+(?:(?:using\s+)?(?:an?|the)\s+)?|\bbest\s+)(?:exchange|market|pool)\b/i.test(content),
  unsafeRpcExposure: containsUnsafeRpcExposureAdvice,
  bridgeSolvencyClaim: (content) => /(?:bridge|wccx)[^.\n]{0,160}(?:solvent|fully backed|reserves? (?:are|will remain)|guarantee)/i.test(content),
};

export const operatorSafetyMutations = {
  staticPoolTable: [
    `| Pool | Fee |
| --- | --- |
| Example pool | 1.5% |`,
    `| Miner | Hashrate |
| --- | --- |
| Example miner | 1.2 GH/s |`,
  ],
  exchangeRecommendation: ['We recommend using an exchange.'],
  unsafeRpcExposure: [
    'Expose the daemon RPC endpoint at 127.0.0.1:16000 to the public internet.',
    'The daemon RPC endpoint at localhost:16000 should be publicly accessible.',
  ],
  bridgeSolvencyClaim: ['wCCX bridge reserves are fully backed'],
};
