/**
 * Full project intelligence gather — per-contract data from multiple sources
 */

import { analyzeOnChainMetrics } from './integrations/etherscan';
import {
  getMarketData,
  getTokenInfo,
  checkExchangeListing,
  resolveCoinByContract,
} from './integrations/coingecko';
import { getDexMetricsByToken, type DexPairMetrics } from './integrations/dexscreener';
import {
  getGitHubMetrics,
  analyzeCodeQuality,
  parseGitHubRepo,
  githubActivityScore,
  type GitHubMetrics,
  type CodeQualitySignals,
} from './integrations/github';
import { scoreFromGathered, type ScoringInputs, type ScoringResults } from './scoring';

export interface OnChainSnapshot {
  uniqueHolders: number | null;
  transactionCount: number;
  isVerified: boolean;
  deployDate: string | null;
  deployerWallet: string | null;
  contractAddress: string | null;
  holderCountAvailable: boolean;
}

export interface MarketSnapshot {
  tokenPrice: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  liquidityUsd: number;
  listedExchanges: number;
  cexNames: string[];
}

export interface DexSnapshot {
  liquidityUsd: number;
  volume24h: number;
  marketCap: number;
  priceUsd: number;
  priceChange24h: number;
  pairAgeDays: number;
  buys24h: number;
  sells24h: number;
  txns24h: number;
  dexId: string;
}

export interface GitHubSnapshot {
  repo: string;
  url: string | null;
  metrics: GitHubMetrics;
  codeQuality: CodeQualitySignals;
  activityScore: number;
}

export interface ProjectIntelligencePayload {
  market: MarketSnapshot | null;
  onChain: OnChainSnapshot | null;
  dex: DexSnapshot | null;
  github: GitHubSnapshot | null;
  token: {
    name: string;
    symbol: string;
    website: string;
    description: string;
    twitter: string;
  } | null;
  sourcesUsed: string[];
  sourcesMissing: string[];
}

export interface FullAnalysisResult {
  name: string;
  contractAddress: string | null;
  coingeckoId: string | null;
  chain: string;
  scores: {
    rugRiskScore: number;
    legitimacyScore: number;
    innovationScore: number;
    survivalProbability: number;
    githubActivity: number;
  };
  redFlags: ScoringResults['redFlags'];
  positiveSignals: ScoringResults['positiveSignals'];
  intelligence: ProjectIntelligencePayload;
  analyzedAt: string;
}

function dexToSnapshot(d: DexPairMetrics): DexSnapshot {
  return {
    liquidityUsd: d.liquidityUsd,
    volume24h: d.volume24h,
    marketCap: d.marketCap,
    priceUsd: d.priceUsd,
    priceChange24h: d.priceChange24h,
    pairAgeDays: d.pairAgeDays,
    buys24h: d.buys24h,
    sells24h: d.sells24h,
    txns24h: d.txns24h,
    dexId: d.dexId,
  };
}

function mergeMarket(
  cg: Awaited<ReturnType<typeof getMarketData>>,
  dex: DexPairMetrics | null,
  exchanges: { exchanges: string[] } | null
): MarketSnapshot | null {
  if (!cg && !dex) return null;

  return {
    tokenPrice: cg?.tokenPrice || dex?.priceUsd || 0,
    marketCap: Math.max(cg?.marketCap ?? 0, dex?.marketCap ?? 0),
    volume24h: Math.max(cg?.volume24h ?? 0, dex?.volume24h ?? 0),
    priceChange24h: cg?.priceChange24h ?? dex?.priceChange24h ?? 0,
    liquidityUsd: dex?.liquidityUsd ?? cg?.liquidityUsd ?? 0,
    listedExchanges: exchanges?.exchanges.length ?? 0,
    cexNames: exchanges?.exchanges ?? [],
  };
}

export async function gatherProjectIntelligence(inputs: {
  name: string;
  contractAddress?: string;
  coingeckoId?: string;
  chain: string;
  githubRepo?: string;
}): Promise<ProjectIntelligencePayload> {
  const sourcesUsed: string[] = [];
  const sourcesMissing: string[] = [];

  let coingeckoId = inputs.coingeckoId;
  let githubRepo = inputs.githubRepo;

  if (inputs.contractAddress && !coingeckoId) {
    const resolved = await resolveCoinByContract(inputs.contractAddress);
    if (resolved) {
      coingeckoId = resolved.id;
      if (!githubRepo && resolved.github) githubRepo = resolved.github;
    }
  }

  const [onChainRaw, dexRaw, marketRaw, tokenInfo, exchanges] = await Promise.all([
    inputs.contractAddress ? analyzeOnChainMetrics(inputs.contractAddress) : Promise.resolve(null),
    inputs.contractAddress ? getDexMetricsByToken(inputs.contractAddress) : Promise.resolve(null),
    coingeckoId ? getMarketData(coingeckoId) : Promise.resolve(null),
    coingeckoId ? getTokenInfo(coingeckoId) : Promise.resolve(null),
    coingeckoId ? checkExchangeListing(coingeckoId) : Promise.resolve(null),
  ]);

  const dex = dexRaw ? dexToSnapshot(dexRaw) : null;
  if (dex) sourcesUsed.push('DexScreener');
  else if (inputs.contractAddress) sourcesMissing.push('DexScreener (no active pairs)');

  const market = mergeMarket(marketRaw, dexRaw, exchanges);
  if (marketRaw || dexRaw) {
    if (marketRaw) sourcesUsed.push('CoinGecko');
    else if (coingeckoId) sourcesMissing.push('CoinGecko market data');
  }

  let onChain: OnChainSnapshot | null = null;
  if (onChainRaw && inputs.contractAddress) {
    sourcesUsed.push('Etherscan');
    onChain = {
      uniqueHolders: onChainRaw.uniqueHolders,
      transactionCount: onChainRaw.transactionCount,
      isVerified: onChainRaw.isVerified,
      deployDate: onChainRaw.deployDate,
      deployerWallet: onChainRaw.deployerWallet,
      contractAddress: inputs.contractAddress,
      holderCountAvailable: onChainRaw.holderCountAvailable,
    };
  } else if (inputs.contractAddress) {
    sourcesMissing.push('Etherscan contract data');
  }

  let github: GitHubSnapshot | null = null;
  const repoSlug = githubRepo || (tokenInfo?.github ? tokenInfo.github : null);

  if (repoSlug) {
    const parsed = parseGitHubRepo(repoSlug);
    if (parsed) {
      const [metrics, codeQuality] = await Promise.all([
        getGitHubMetrics(parsed.owner, parsed.repo),
        analyzeCodeQuality(parsed.owner, parsed.repo),
      ]);
      if (metrics) {
        sourcesUsed.push('GitHub');
        const repoPath = `${parsed.owner}/${parsed.repo}`;
        github = {
          repo: repoPath,
          url: `https://github.com/${repoPath}`,
          metrics,
          codeQuality,
          activityScore: githubActivityScore(metrics, codeQuality),
        };
      } else {
        sourcesMissing.push('GitHub (repo not found or rate limited)');
      }
    }
  } else {
    sourcesMissing.push('GitHub (no public repo linked)');
  }

  const token =
    tokenInfo && tokenInfo.name
      ? {
          name: tokenInfo.name,
          symbol: tokenInfo.symbol,
          website: tokenInfo.website,
          description: tokenInfo.description?.slice(0, 280) ?? '',
          twitter: tokenInfo.twitter,
        }
      : null;

  if (token) sourcesUsed.push('CoinGecko metadata');

  return { market, onChain, dex, github, token, sourcesUsed, sourcesMissing };
}

export async function runFullAnalysis(params: {
  name: string;
  contractAddress?: string;
  coingeckoId?: string;
  chain: string;
  githubRepo?: string;
  projectStage?: ScoringInputs['projectStage'];
}): Promise<FullAnalysisResult> {
  const intelligence = await gatherProjectIntelligence(params);

  const scores = scoreFromGathered(
    params.name,
    {
      contractAddress: params.contractAddress,
      coingeckoId: params.coingeckoId,
      chain: params.chain,
      projectStage: params.projectStage ?? 'early',
      githubRepo: intelligence.github?.repo,
    },
    {
      onChain: intelligence.onChain,
      market: intelligence.market,
      dex: intelligence.dex,
      github: intelligence.github,
    }
  );

  return {
    name: params.name,
    contractAddress: params.contractAddress ?? null,
    coingeckoId: params.coingeckoId ?? null,
    chain: params.chain,
    scores: {
      rugRiskScore: scores.rugRiskScore,
      legitimacyScore: scores.legitimacyScore,
      innovationScore: scores.innovationScore,
      survivalProbability: scores.survivalProbability,
      githubActivity: intelligence.github?.activityScore ?? 0,
    },
    redFlags: scores.redFlags,
    positiveSignals: scores.positiveSignals,
    intelligence,
    analyzedAt: new Date().toISOString(),
  };
}

export function formatUsd(n: number): string {
  if (!n || n <= 0) return '—';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export function formatPct(n: number): string {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}
