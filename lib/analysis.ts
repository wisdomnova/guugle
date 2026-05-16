/**
 * Full project intelligence gather — feeds scoring + rich analyze UI
 */

import { analyzeOnChainMetrics, getContractInfo } from './integrations/etherscan';
import {
  getMarketData,
  getTokenInfo,
  checkExchangeListing,
  type MarketMetrics,
} from './integrations/coingecko';
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
  uniqueHolders: number;
  transactionCount: number;
  isVerified: boolean;
  deployDate: string | null;
  deployerWallet: string | null;
  contractAddress: string | null;
}

export interface MarketSnapshot {
  tokenPrice: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  listedExchanges: number;
  cexNames: string[];
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

export async function gatherProjectIntelligence(inputs: {
  name: string;
  contractAddress?: string;
  coingeckoId?: string;
  chain: string;
  githubRepo?: string;
}): Promise<ProjectIntelligencePayload> {
  const sourcesUsed: string[] = [];
  const sourcesMissing: string[] = [];

  const [onChainRaw, contractInfo, marketRaw, tokenInfo, exchanges] = await Promise.all([
    inputs.contractAddress ? analyzeOnChainMetrics(inputs.contractAddress) : Promise.resolve(null),
    inputs.contractAddress ? getContractInfo(inputs.contractAddress) : Promise.resolve(null),
    inputs.coingeckoId ? getMarketData(inputs.coingeckoId) : Promise.resolve(null),
    inputs.coingeckoId ? getTokenInfo(inputs.coingeckoId) : Promise.resolve(null),
    inputs.coingeckoId ? checkExchangeListing(inputs.coingeckoId) : Promise.resolve(null),
  ]);

  let market: MarketSnapshot | null = null;
  if (marketRaw) {
    sourcesUsed.push('CoinGecko');
    market = {
      tokenPrice: marketRaw.tokenPrice,
      marketCap: marketRaw.marketCap,
      volume24h: marketRaw.volume24h,
      priceChange24h: marketRaw.priceChange24h,
      listedExchanges: exchanges?.exchanges.length ?? 0,
      cexNames: exchanges?.exchanges ?? [],
    };
  } else if (inputs.coingeckoId) {
    sourcesMissing.push('CoinGecko market data');
  }

  let onChain: OnChainSnapshot | null = null;
  if (onChainRaw && inputs.contractAddress) {
    sourcesUsed.push('Etherscan');
    const verified = Boolean(
      (onChainRaw as { isVerified?: boolean }).isVerified ?? contractInfo?.isVerified
    );
    onChain = {
      uniqueHolders: onChainRaw.uniqueHolders ?? 0,
      transactionCount: onChainRaw.transactionCount ?? 0,
      isVerified: verified,
      deployDate: contractInfo?.deployDate?.toISOString() ?? null,
      deployerWallet: contractInfo?.deployerWallet ?? null,
      contractAddress: inputs.contractAddress,
    };
  } else if (inputs.contractAddress) {
    sourcesMissing.push('Etherscan on-chain data');
  }

  let github: GitHubSnapshot | null = null;
  const repoSlug =
    inputs.githubRepo ||
    (tokenInfo?.github ? parseGitHubRepo(tokenInfo.github) : null);

  if (repoSlug) {
    const parsed =
      typeof repoSlug === 'string' ? parseGitHubRepo(repoSlug) : repoSlug;
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

  return { market, onChain, github, token, sourcesUsed, sourcesMissing };
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

  const scoringInputs: ScoringInputs = {
    contractAddress: params.contractAddress,
    coingeckoId: params.coingeckoId,
    chain: params.chain,
    projectStage: params.projectStage ?? 'early',
    githubRepo: intelligence.github?.repo,
  };

  const scores = scoreFromGathered(params.name, scoringInputs, {
    onChain: intelligence.onChain,
    market: intelligence.market,
    github: intelligence.github,
  });

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
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export function formatPct(n: number): string {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}
