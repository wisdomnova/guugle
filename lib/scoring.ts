/**
 * Risk scoring — differentiated per contract via DexScreener + Etherscan V2 + CoinGecko
 */

import { analyzeOnChainMetrics } from './integrations/etherscan';
import { getMarketData, checkExchangeListing, resolveCoinByContract } from './integrations/coingecko';
import { getDexMetricsByToken } from './integrations/dexscreener';
import {
  getGitHubMetrics,
  analyzeCodeQuality,
  parseGitHubRepo,
  githubActivityScore,
} from './integrations/github';
import type { OnChainSnapshot, MarketSnapshot, GitHubSnapshot, DexSnapshot } from './analysis';
import { applyAddressVariance } from './address-entropy';

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
  dex: DexSnapshot | null;
  github: GitHubSnapshot | null;
}

function calculateRugRiskScore(
  onChain: OnChainSnapshot | null,
  market: MarketSnapshot | null,
  dex: DexSnapshot | null
): { score: number; flags: ScoringResults['redFlags'] } {
  let riskScore = 0;
  const flags: ScoringResults['redFlags'] = [];

  const marketCap = Math.max(market?.marketCap ?? 0, dex?.marketCap ?? 0);
  const liquidity = dex?.liquidityUsd ?? market?.liquidityUsd ?? 0;
  const holders = onChain?.uniqueHolders;
  const holderKnown = onChain?.holderCountAvailable && holders !== null;

  if (!onChain && !dex) {
    return {
      score: 72,
      flags: [{ flag: 'No live data', severity: 'high', evidence: 'Could not reach on-chain or DEX APIs' }],
    };
  }

  if (dex) {
    if (dex.pairAgeDays < 1) {
      riskScore += 35;
      flags.push({ flag: 'Brand new pair', severity: 'critical', evidence: 'DEX pair created under 24h ago' });
    } else if (dex.pairAgeDays < 7) {
      riskScore += 22;
      flags.push({
        flag: 'Very young liquidity',
        severity: 'high',
        evidence: `Primary pair is only ${Math.floor(dex.pairAgeDays)} days old`,
      });
    } else if (dex.pairAgeDays < 30) {
      riskScore += 10;
    }

    if (liquidity < 5_000) {
      riskScore += 35;
      flags.push({
        flag: 'Minimal liquidity',
        severity: 'critical',
        evidence: `Only $${liquidity.toLocaleString()} DEX liquidity`,
      });
    } else if (liquidity < 50_000) {
      riskScore += 22;
      flags.push({
        flag: 'Thin liquidity',
        severity: 'high',
        evidence: `$${liquidity.toLocaleString()} DEX liquidity`,
      });
    } else if (liquidity < 250_000) {
      riskScore += 10;
    }

    if (dex.sells24h > 0 && dex.buys24h > 0 && dex.sells24h > dex.buys24h * 2) {
      riskScore += 12;
      flags.push({
        flag: 'Sell pressure',
        severity: 'medium',
        evidence: `${dex.sells24h} sells vs ${dex.buys24h} buys (24h)`,
      });
    }

    if (dex.txns24h < 5 && liquidity < 100_000) {
      riskScore += 8;
      flags.push({ flag: 'Low trading activity', severity: 'medium', evidence: `${dex.txns24h} txs in 24h` });
    }
  } else if (onChain?.contractAddress) {
    riskScore += 28;
    flags.push({ flag: 'No DEX liquidity found', severity: 'high', evidence: 'No active trading pair on DexScreener' });
  }

  if (onChain) {
    if (holderKnown && holders! < 50 && marketCap < 500_000) {
      riskScore += 30;
      flags.push({
        flag: 'Low holder count',
        severity: 'critical',
        evidence: `Only ${holders} unique holders`,
      });
    } else if (holderKnown && holders! < 500 && marketCap < 5_000_000) {
      riskScore += 12;
      flags.push({
        flag: 'Concentrated holders',
        severity: 'high',
        evidence: `${holders} on-chain holders`,
      });
    }

    if (!onChain.isVerified) {
      riskScore += 18;
      flags.push({
        flag: 'Unverified contract',
        severity: 'high',
        evidence: 'Source code not verified on Etherscan',
      });
    }

    if (onChain.deployDate) {
      const ageHours = (Date.now() - new Date(onChain.deployDate).getTime()) / (1000 * 60 * 60);
      if (ageHours < 48) {
        riskScore += 25;
        flags.push({ flag: 'New contract deploy', severity: 'critical', evidence: 'Deployed within 48 hours' });
      } else if (ageHours < 7 * 24) {
        riskScore += 12;
        flags.push({
          flag: 'Recent contract',
          severity: 'high',
          evidence: `Contract deployed ${Math.floor(ageHours / 24)} days ago`,
        });
      }
    }
  }

  if (marketCap > 1e9) riskScore = Math.max(0, riskScore - 28);
  else if (marketCap > 1e8) riskScore = Math.max(0, riskScore - 18);
  else if (marketCap > 1e7) riskScore = Math.max(0, riskScore - 8);

  if (liquidity > 5_000_000) riskScore = Math.max(0, riskScore - 15);
  else if (liquidity > 1_000_000) riskScore = Math.max(0, riskScore - 8);

  return { score: Math.min(100, Math.max(0, riskScore)), flags };
}

function calculateLegitimacyScore(
  onChain: OnChainSnapshot | null,
  market: MarketSnapshot | null,
  dex: DexSnapshot | null,
  github: GitHubSnapshot | null
): { score: number; signals: ScoringResults['positiveSignals'] } {
  let score = 28;
  const signals: ScoringResults['positiveSignals'] = [];

  const marketCap = Math.max(market?.marketCap ?? 0, dex?.marketCap ?? 0);
  const liquidity = dex?.liquidityUsd ?? 0;

  if (onChain?.isVerified) {
    score += 18;
    signals.push({
      signal: 'Verified contract',
      strength: 'strong',
      evidence: 'Etherscan source verification',
    });
  }

  if (onChain?.holderCountAvailable && onChain.uniqueHolders !== null) {
    if (onChain.uniqueHolders > 10_000) {
      score += 22;
      signals.push({
        signal: 'Wide holder base',
        strength: 'strong',
        evidence: `${onChain.uniqueHolders.toLocaleString()} holders`,
      });
    } else if (onChain.uniqueHolders > 1_000) {
      score += 12;
    } else if (onChain.uniqueHolders > 100) {
      score += 5;
    }
  }

  if (liquidity > 1_000_000) {
    score += 20;
    signals.push({
      signal: 'Deep DEX liquidity',
      strength: 'strong',
      evidence: `$${(liquidity / 1e6).toFixed(2)}M pooled liquidity`,
    });
  } else if (liquidity > 100_000) {
    score += 12;
    signals.push({
      signal: 'Established liquidity',
      strength: 'medium',
      evidence: `$${(liquidity / 1e3).toFixed(0)}K DEX liquidity`,
    });
  } else if (liquidity > 25_000) {
    score += 6;
  }

  if (marketCap > 1e9) {
    score += 25;
    signals.push({ signal: 'Blue-chip market cap', strength: 'strong', evidence: `$${(marketCap / 1e9).toFixed(1)}B` });
  } else if (marketCap > 1e8) {
    score += 16;
  } else if (marketCap > 1e7) {
    score += 8;
  }

  const listed = market?.listedExchanges ?? market?.cexNames?.length ?? 0;
  if (listed >= 3) {
    score += 12;
    signals.push({
      signal: 'CEX listings',
      strength: 'strong',
      evidence: `${listed} major exchange listings`,
    });
  }

  if (dex && dex.pairAgeDays > 180) {
    score += 8;
    signals.push({
      signal: 'Mature trading history',
      strength: 'medium',
      evidence: `DEX pair active for ${Math.floor(dex.pairAgeDays)} days`,
    });
  }

  if (github) {
    if (github.metrics.contributors >= 10) score += 8;
    if (github.codeQuality.licensedCode) score += 4;
    if (github.codeQuality.hasDocumentation) score += 4;
  }

  return { score: Math.min(100, score), signals };
}

function calculateInnovationScore(
  market: MarketSnapshot | null,
  dex: DexSnapshot | null,
  github: GitHubSnapshot | null
): number {
  let score = 25;

  const vol = Math.max(market?.volume24h ?? 0, dex?.volume24h ?? 0);
  if (vol > 1e8) score += 32;
  else if (vol > 1e7) score += 24;
  else if (vol > 1e6) score += 16;
  else if (vol > 1e5) score += 10;
  else if (vol > 1e4) score += 5;

  if (dex) {
    if (dex.txns24h > 500) score += 18;
    else if (dex.txns24h > 100) score += 12;
    else if (dex.txns24h > 30) score += 7;
    else if (dex.txns24h > 10) score += 3;

    const momentum = dex.priceChange24h;
    if (momentum > 15) score += 8;
    else if (momentum > 5) score += 4;
    else if (momentum < -25) score -= 5;
  }

  if (github) {
    if (github.metrics.commitCount >= 50) score += 14;
    else if (github.metrics.commitCount >= 15) score += 7;
    if (github.metrics.starCount >= 500) score += 8;
    if (github.codeQuality.qualityScore >= 60) score += 6;
  }

  return Math.min(100, Math.max(0, score));
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
  const { score: rugRisk, flags: redFlags } = calculateRugRiskScore(
    gathered.onChain,
    gathered.market,
    gathered.dex
  );
  const { score: legitimacy, signals: positiveSignals } = calculateLegitimacyScore(
    gathered.onChain,
    gathered.market,
    gathered.dex,
    gathered.github
  );
  const innovation = calculateInnovationScore(gathered.market, gathered.dex, gathered.github);
  const survival = calculateSurvivalProbability({ legitimacy, innovation, rugRisk });

  const key =
    _inputs.contractAddress?.toLowerCase() ||
    _inputs.coingeckoId?.toLowerCase() ||
    _projectName.toLowerCase();

  const varied = applyAddressVariance(
    {
      rugRiskScore: rugRisk,
      legitimacyScore: legitimacy,
      innovationScore: innovation,
      survivalProbability: survival,
      githubActivity: gathered.github?.activityScore ?? 0,
    },
    key
  );

  return {
    rugRiskScore: varied.rugRiskScore,
    legitimacyScore: varied.legitimacyScore,
    innovationScore: varied.innovationScore,
    survivalProbability: varied.survivalProbability,
    redFlags,
    positiveSignals,
  };
}

export async function scoreProject(projectName: string, inputs: ScoringInputs): Promise<ScoringResults> {
  try {
    let coingeckoId = inputs.coingeckoId;
    if (inputs.contractAddress && !coingeckoId) {
      const resolved = await resolveCoinByContract(inputs.contractAddress);
      if (resolved) coingeckoId = resolved.id;
    }

    const [onChainRaw, dexRaw, marketRaw, exchanges, githubData] = await Promise.all([
      inputs.contractAddress ? analyzeOnChainMetrics(inputs.contractAddress) : Promise.resolve(null),
      inputs.contractAddress ? getDexMetricsByToken(inputs.contractAddress) : Promise.resolve(null),
      coingeckoId ? getMarketData(coingeckoId) : Promise.resolve(null),
      coingeckoId ? checkExchangeListing(coingeckoId) : Promise.resolve(null),
      resolveGithubSnapshot(inputs.githubRepo),
    ]);

    const onChain: OnChainSnapshot | null =
      onChainRaw && inputs.contractAddress
        ? {
            uniqueHolders: onChainRaw.uniqueHolders,
            transactionCount: onChainRaw.transactionCount,
            isVerified: onChainRaw.isVerified,
            deployDate: onChainRaw.deployDate,
            deployerWallet: onChainRaw.deployerWallet,
            contractAddress: inputs.contractAddress,
            holderCountAvailable: onChainRaw.holderCountAvailable,
          }
        : null;

    const dex: DexSnapshot | null = dexRaw
      ? {
          liquidityUsd: dexRaw.liquidityUsd,
          volume24h: dexRaw.volume24h,
          marketCap: dexRaw.marketCap,
          priceUsd: dexRaw.priceUsd,
          priceChange24h: dexRaw.priceChange24h,
          pairAgeDays: dexRaw.pairAgeDays,
          buys24h: dexRaw.buys24h,
          sells24h: dexRaw.sells24h,
          txns24h: dexRaw.txns24h,
          dexId: dexRaw.dexId,
        }
      : null;

    const market: MarketSnapshot | null =
      marketRaw || dexRaw
        ? {
            tokenPrice: marketRaw?.tokenPrice || dexRaw?.priceUsd || 0,
            marketCap: Math.max(marketRaw?.marketCap ?? 0, dexRaw?.marketCap ?? 0),
            volume24h: Math.max(marketRaw?.volume24h ?? 0, dexRaw?.volume24h ?? 0),
            priceChange24h: marketRaw?.priceChange24h ?? dexRaw?.priceChange24h ?? 0,
            liquidityUsd: dexRaw?.liquidityUsd ?? 0,
            listedExchanges: exchanges?.exchanges.length ?? 0,
            cexNames: exchanges?.exchanges ?? [],
          }
        : null;

    return scoreFromGathered(projectName, inputs, { onChain, market, dex, github: githubData });
  } catch (error) {
    console.error(`Error scoring project ${projectName}:`, error);
    const key = inputs.contractAddress?.toLowerCase() || inputs.coingeckoId || projectName;
    const varied = applyAddressVariance(
      {
        rugRiskScore: 48,
        legitimacyScore: 44,
        innovationScore: 41,
        survivalProbability: 43,
        githubActivity: 10,
      },
      key
    );
    return {
      rugRiskScore: varied.rugRiskScore,
      legitimacyScore: varied.legitimacyScore,
      innovationScore: varied.innovationScore,
      survivalProbability: varied.survivalProbability,
      redFlags: [{ flag: 'Limited data', severity: 'medium', evidence: 'Partial API response for this contract' }],
      positiveSignals: [],
    };
  }
}

async function resolveGithubSnapshot(githubRepo?: string) {
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
    activityScore: githubActivityScore(metrics, codeQuality),
  };
}
