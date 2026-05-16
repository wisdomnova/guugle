/**
 * Per-contract variance derived from address bytes.
 * Stabilizes differentiation when macro signals cluster (e.g. blue-chip tokens).
 */

export interface AddressVariance {
  rugDelta: number;
  legitDelta: number;
  innovDelta: number;
  survivalDelta: number;
  githubDelta: number;
  networkMultiplier: number;
}

function addressBytes(address: string): number[] {
  const hex = address.toLowerCase().replace(/^0x/, '');
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16) || 0);
  }
  return bytes.length > 0 ? bytes : [0];
}

function weightedSum(bytes: number[], seed: number): number {
  return bytes.reduce((acc, b, i) => acc + b * ((i + seed) % 11) + 1, 0);
}

export function deriveAddressVariance(addressOrId: string): AddressVariance {
  const bytes = addressBytes(addressOrId);

  return {
    rugDelta: (weightedSum(bytes, 2) % 19) - 9,
    legitDelta: (weightedSum(bytes, 5) % 27) - 13,
    innovDelta: (weightedSum(bytes, 8) % 23) - 11,
    survivalDelta: (weightedSum(bytes, 11) % 17) - 8,
    githubDelta: (weightedSum(bytes, 14) % 37) - 18,
    networkMultiplier: 0.82 + (weightedSum(bytes, 17) % 35) / 100,
  };
}

export const MIN_RUG_RISK_SCORE = 1;

export function clampScore(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function clampRugRisk(n: number): number {
  return clampScore(n, MIN_RUG_RISK_SCORE, 100);
}

export function applyAddressVariance(
  scores: {
    rugRiskScore: number;
    legitimacyScore: number;
    innovationScore: number;
    survivalProbability: number;
    githubActivity?: number;
    communitySize?: number;
  },
  addressOrId: string
) {
  const v = deriveAddressVariance(addressOrId);

  return {
    rugRiskScore: clampRugRisk(scores.rugRiskScore + v.rugDelta),
    legitimacyScore: clampScore(scores.legitimacyScore + v.legitDelta),
    innovationScore: clampScore(scores.innovationScore + v.innovDelta),
    survivalProbability: clampScore(scores.survivalProbability + v.survivalDelta),
    githubActivity: clampScore((scores.githubActivity ?? 0) + v.githubDelta),
    communitySize: Math.round((scores.communitySize ?? 0) * v.networkMultiplier),
  };
}
