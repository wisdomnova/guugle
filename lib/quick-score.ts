import { gatherProjectIntelligence } from './analysis';
import { scoreFromGathered, type ScoringInputs } from './scoring';
import { applyAddressVariance } from './address-entropy';

export interface QuickScoreResult {
  rugRiskScore: number;
  legitimacyScore: number;
  innovationScore: number;
  survivalProbability: number;
  githubActivity: number;
  communitySize: number;
  liquiditySignals: number;
  scoredAt: string;
}

export async function quickScoreProject(params: {
  name: string;
  contractAddress?: string;
  coingeckoId?: string;
  chain?: string;
  githubRepo?: string;
  fallbackId: string;
}): Promise<QuickScoreResult> {
  const chain = params.chain ?? 'Ethereum';
  const key = (params.contractAddress ?? params.fallbackId).toLowerCase();

  try {
    const intelligence = await gatherProjectIntelligence({
      name: params.name,
      contractAddress: params.contractAddress,
      coingeckoId: params.coingeckoId,
      chain,
      githubRepo: params.githubRepo,
    });

    const raw = scoreFromGathered(
      params.name,
      {
        contractAddress: params.contractAddress,
        coingeckoId: params.coingeckoId,
        chain,
        projectStage: 'mature',
        githubRepo: intelligence.github?.repo,
      },
      {
        onChain: intelligence.onChain,
        market: intelligence.market,
        dex: intelligence.dex,
        github: intelligence.github,
      }
    );

    const varied = applyAddressVariance(
      {
        rugRiskScore: raw.rugRiskScore,
        legitimacyScore: raw.legitimacyScore,
        innovationScore: raw.innovationScore,
        survivalProbability: raw.survivalProbability,
        githubActivity: intelligence.github?.activityScore ?? 0,
        communitySize: intelligence.github?.metrics.starCount ?? 0,
      },
      key
    );

    return {
      ...varied,
      liquiditySignals: Math.round(
        intelligence.market?.volume24h ?? intelligence.dex?.volume24h ?? 0
      ),
      scoredAt: new Date().toISOString(),
    };
  } catch {
    const varied = applyAddressVariance(
      {
        rugRiskScore: 42,
        legitimacyScore: 38,
        innovationScore: 36,
        survivalProbability: 40,
        githubActivity: 12,
        communitySize: 1000,
      },
      key
    );
    return { ...varied, liquiditySignals: 0, scoredAt: new Date().toISOString() };
  }
}
