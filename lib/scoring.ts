/**
 * Risk scoring — Etherscan + CoinGecko + GitHub
 */

import { analyzeOnChainMetrics } from './integrations/etherscan';
import { getMarketData, checkExchangeListing } from './integrations/coingecko';
import {
  getGitHubMetrics,
  analyzeCodeQuality,
  parseGitHubRepo,
  type GitHubMetrics,
  type CodeQualitySignals,
} from './integrations/github';
import type { OnChainSnapshot, MarketSnapshot, GitHubSnapshot } from './analysis';

export interface ScoringInputs {
  contractAddress?: string;
  coingeckoId?: string;
  chain: string;
  projectStage: 'presale' | 'launch' | 'early' | 'growth' | 'mature';
  githubRepo?: string;
}

export interface ScoringResults {
  rugRiskScore: number;
  legitimacyScore: number;
  innovationScore: number;
  survivalProbability: number;
  redFlags: Array<{
    flag: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    evidence: string;
  }>;
  positiveSignals: Array<{
    signal: string;
    strength: 'weak' | 'medium' | 'strong';
    evidence: string;
  }>;
}

export interface GatheredScoreData {
  onChain: OnChainSnapshot | null;
  market: MarketSnapshot | null;
  github: GitHubSnapshot | null;
}

function calculateRugRiskScore(
  onChainData: OnChainSnapshot | Record<string, unknown> | null,
  marketData: MarketSnapshot | Record<string, unknown> | null
): { score: number; flags: ScoringResults['redFlags'] } {
  let riskScore = 0;
  const flags: ScoringResults['redFlags'] = [];

  if (!onChainData) {
    return {
      score: 50,
      flags: [{ flag: 'No on-chain data', severity: 'high', evidence: 'Contract not verified or unavailable' }],
    };
  }

  const uniqueHolders = Number((onChainData as OnChainSnapshot).uniqueHolders) || 0;
  const marketCap = Number((marketData as MarketSnapshot)?.marketCap) || 0;
  const hasMarketCap = marketCap > 500_000;

  if (uniqueHolders < 50 && !hasMarketCap) {
    riskScore += 35;
    flags.push({
      flag: 'Low holder count',
      severity: 'critical',
      evidence: `Only ${uniqueHolders} unique holders detected`,
    });
  } else if (uniqueHolders > 0 && uniqueHolders < 500 && !hasMarketCap) {
    riskScore += 15;
    flags.push({
      flag: 'Concentrated holders',
      severity: 'high',
      evidence: `${uniqueHolders} holders suggests concentration risk`,
    });
  } else if (uniqueHolders === 0 && !hasMarketCap) {
    riskScore += 20;
    flags.push({ flag: 'No holder data', severity: 'medium', evidence: 'Unable to verify holder distribution' });
  }

  const largeTransactions = Number((onChainData as { largeTransactions?: number }).largeTransactions) || 0;
  const totalTransactions = Number((onChainData as OnChainSnapshot).transactionCount) || 1;
  const largeTransactionRatio = largeTransactions / Math.max(totalTransactions, 1);

  if (largeTransactionRatio > 0.5) {
    riskScore += 25;
    flags.push({
      flag: 'Abnormal transaction pattern',
      severity: 'high',
      evidence: `${(largeTransactionRatio * 100).toFixed(1)}% of transactions are large`,
    });
  }

  const deployDateStr = (onChainData as OnChainSnapshot).deployDate;
  if (deployDateStr) {
    const ageHours = (Date.now() - new Date(deployDateStr).getTime()) / (1000 * 60 * 60);
    if (ageHours < 24) {
      riskScore += 30;
      flags.push({ flag: 'Very new contract', severity: 'critical', evidence: 'Deployed less than 24 hours ago' });
    } else if (ageHours < 7 * 24) {
      riskScore += 15;
      flags.push({
        flag: 'Recent deployment',
        severity: 'high',
        evidence: `Deployed ${Math.floor(ageHours / 24)} days ago`,
      });
    }
  }

  if (!(onChainData as OnChainSnapshot).isVerified) {
    riskScore += 20;
    flags.push({
      flag: 'Unverified contract',
      severity: 'high',
      evidence: 'Contract source code is not publicly verified',
    });
  }

  if (marketCap > 0) {
    if (marketCap > 1e9) riskScore = Math.max(0, riskScore - 30);
    else if (marketCap > 1e8) riskScore = Math.max(0, riskScore - 20);
    else if (marketCap > 1e7) riskScore = Math.max(0, riskScore - 10);
  }

  return { score: Math.min(100, Math.max(0, riskScore)), flags };
}

function calculateLegitimacyScore(
  onChainData: OnChainSnapshot | null,
  marketData: MarketSnapshot | null,
  github: GitHubSnapshot | null
): { score: number; signals: ScoringResults['positiveSignals'] } {
  let score = 50;
  const signals: ScoringResults['positiveSignals'] = [];

  if (onChainData) {
    if (onChainData.uniqueHolders > 1000) {
      score += 25;
      signals.push({
        signal: 'Wide holder distribution',
        strength: 'strong',
        evidence: `${onChainData.uniqueHolders.toLocaleString()} unique token holders`,
      });
    } else if (onChainData.uniqueHolders > 100) {
      score += 10;
    }

    if (onChainData.isVerified) {
      score += 15;
      signals.push({
        signal: 'Verified contract',
        strength: 'strong',
        evidence: 'Source code publicly verified on-chain',
      });
    }
  }

  const listedCount = marketData?.listedExchanges ?? marketData?.cexNames?.length ?? 0;
  if (listedCount > 3) {
    score += 15;
    signals.push({
      signal: 'Multi-exchange listing',
      strength: 'strong',
      evidence: `Listed on ${listedCount} tracked CEX venues`,
    });
  }

  const marketCap = marketData?.marketCap ?? 0;
  if (marketCap > 1e9) {
    score += 35;
    signals.push({
      signal: 'Blue-chip market cap',
      strength: 'strong',
      evidence: `$${(marketCap / 1e9).toFixed(1)}B market cap`,
    });
  } else if (marketCap > 1e8) {
    score += 20;
    signals.push({
      signal: 'Established market cap',
      strength: 'strong',
      evidence: `$${(marketCap / 1e6).toFixed(0)}M market cap`,
    });
  } else if (marketCap > 1e7) {
    score += 10;
    signals.push({
      signal: 'Established market cap',
      strength: 'medium',
      evidence: `$${(marketCap / 1e6).toFixed(1)}M market cap`,
    });
  }

  if (github) {
    const { metrics, codeQuality } = github;
    if (metrics.contributors >= 10) {
      score += 10;
      signals.push({
        signal: 'Active contributor base',
        strength: 'strong',
        evidence: `${metrics.contributors} contributors on GitHub`,
      });
    }
    if (codeQuality.hasDocumentation) {
      score += 5;
      signals.push({
        signal: 'Public documentation',
        strength: 'medium',
        evidence: 'README or docs folder present in repo',
      });
    }
    if (codeQuality.licensedCode) {
      score += 5;
      signals.push({
        signal: 'Open-source license',
        strength: 'medium',
        evidence: 'Repository includes a license file',
      });
    }
  }

  return { score: Math.min(100, score), signals };
}

function calculateInnovationScore(
  marketData: MarketSnapshot | null,
  chain: string,
  github: GitHubSnapshot | null
): number {
  let score = 50;

  if (marketData) {
    const vol = marketData.volume24h;
    if (vol > 1e8) score += 30;
    else if (vol > 1e7) score += 20;
    else if (vol > 1e6) score += 10;

    if (marketData.priceChange24h > 5) score += 5;
  }

  if (github) {
    const { metrics, codeQuality } = github;
    if (metrics.commitCount >= 50) score += 15;
    else if (metrics.commitCount >= 15) score += 8;
    if (metrics.starCount >= 1000) score += 10;
    else if (metrics.starCount >= 100) score += 5;
    if (codeQuality.qualityScore >= 60) score += 10;
    if (metrics.developmentVelocity >= 1) score += 10;
  }

  if (chain.toLowerCase() === 'ethereum' || chain.toLowerCase() === 'solana') {
    score += 5;
  }

  return Math.min(100, score);
}

function calculateSurvivalProbability(data: {
  legitimacy: number;
  innovation: number;
  rugRisk: number;
}): number {
  return Math.round(data.legitimacy * 0.5 + data.innovation * 0.2 + (100 - data.rugRisk) * 0.3);
}

export function scoreFromGathered(
  _projectName: string,
  _inputs: ScoringInputs,
  gathered: GatheredScoreData
): ScoringResults {
  const marketForRisk = gathered.market
    ? { marketCap: gathered.market.marketCap, listedExchanges: gathered.market.listedExchanges }
    : null;

  const { score: rugRisk, flags: redFlags } = calculateRugRiskScore(gathered.onChain, marketForRisk as MarketSnapshot);
  const { score: legitimacy, signals: positiveSignals } = calculateLegitimacyScore(
    gathered.onChain,
    gathered.market,
    gathered.github
  );
  const innovation = calculateInnovationScore(gathered.market, _inputs.chain, gathered.github);
  const survival = calculateSurvivalProbability({ legitimacy, innovation, rugRisk });

  return {
    rugRiskScore: rugRisk,
    legitimacyScore: legitimacy,
    innovationScore: innovation,
    survivalProbability: survival,
    redFlags,
    positiveSignals,
  };
}

/** Fetch live data then score (used by background sync) */
export async function scoreProject(projectName: string, inputs: ScoringInputs): Promise<ScoringResults> {
  try {
    const [onChainRaw, marketRaw, exchanges, githubData] = await Promise.all([
      inputs.contractAddress ? analyzeOnChainMetrics(inputs.contractAddress) : Promise.resolve(null),
      inputs.coingeckoId ? getMarketData(inputs.coingeckoId) : Promise.resolve(null),
      inputs.coingeckoId ? checkExchangeListing(inputs.coingeckoId) : Promise.resolve(null),
      resolveGithubSnapshot(inputs.githubRepo),
    ]);

    const onChain: OnChainSnapshot | null =
      onChainRaw && inputs.contractAddress
        ? {
            uniqueHolders: (onChainRaw as { uniqueHolders?: number }).uniqueHolders ?? 0,
            transactionCount: onChainRaw.transactionCount,
            isVerified: Boolean((onChainRaw as { isVerified?: boolean }).isVerified),
            deployDate: null,
            deployerWallet: null,
            contractAddress: inputs.contractAddress,
          }
        : null;

    const market: MarketSnapshot | null = marketRaw
      ? {
          tokenPrice: marketRaw.tokenPrice,
          marketCap: marketRaw.marketCap,
          volume24h: marketRaw.volume24h,
          priceChange24h: marketRaw.priceChange24h,
          listedExchanges: exchanges?.exchanges.length ?? 0,
          cexNames: exchanges?.exchanges ?? [],
        }
      : null;

    return scoreFromGathered(projectName, inputs, { onChain, market, github: githubData });
  } catch (error) {
    console.error(`Error scoring project ${projectName}:`, error);
    return {
      rugRiskScore: 50,
      legitimacyScore: 50,
      innovationScore: 50,
      survivalProbability: 50,
      redFlags: [{ flag: 'Scoring error', severity: 'medium', evidence: 'Unable to fetch analysis data' }],
      positiveSignals: [],
    };
  }
}

async function resolveGithubSnapshot(githubRepo?: string): Promise<GitHubSnapshot | null> {
  if (!githubRepo) return null;
  const parsed = parseGitHubRepo(githubRepo);
  if (!parsed) return null;

  const [metrics, codeQuality] = await Promise.all([
    getGitHubMetrics(parsed.owner, parsed.repo),
    analyzeCodeQuality(parsed.owner, parsed.repo),
  ]);
  if (!metrics) return null;

  const repoPath = `${parsed.owner}/${parsed.repo}`;
  return {
    repo: repoPath,
    url: `https://github.com/${repoPath}`,
    metrics,
    codeQuality,
    activityScore: 0,
  };
}
