/**
 * Risk Scoring Algorithm - SIMPLIFIED FOR SPEED
 * On-chain only: Etherscan + CoinGecko
 */

import { analyzeOnChainMetrics } from './integrations/etherscan';
import { getMarketData } from './integrations/coingecko';

export interface ScoringInputs {
  contractAddress?: string;
  coingeckoId?: string;
  chain: string;
  projectStage: 'presale' | 'launch' | 'early' | 'growth' | 'mature';
}

export interface ScoringResults {
  rugRiskScore: number; // 0-100, higher = more risk
  legitimacyScore: number; // 0-100, higher = more legitimate
  innovationScore: number; // 0-100, higher = more innovative
  survivalProbability: number; // 0-100, higher = more likely to survive
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

/**
 * Calculate rug pull risk based on on-chain signals
 */
function calculateRugRiskScore(onChainData: any, marketData: any): {
  score: number;
  flags: ScoringResults['redFlags'];
} {
  let riskScore = 0;
  const flags: ScoringResults['redFlags'] = [];

  if (!onChainData) {
    return { score: 50, flags: [{ flag: 'No on-chain data', severity: 'high', evidence: 'Contract not verified' }] };
  }

  // Holder concentration — only flag if market data also absent (prevents false positives on major tokens)
  const uniqueHolders = onChainData.uniqueHolders || 0;
  const hasMarketCap = marketData?.marketCap && marketData.marketCap > 500000;
  if (uniqueHolders < 50 && !hasMarketCap) {
    riskScore += 35;
    flags.push({ flag: 'Low holder count', severity: 'critical', evidence: `Only ${uniqueHolders} unique holders detected` });
  } else if (uniqueHolders > 0 && uniqueHolders < 500 && !hasMarketCap) {
    riskScore += 15;
    flags.push({ flag: 'Concentrated holders', severity: 'high', evidence: `${uniqueHolders} holders suggests concentration risk` });
  } else if (uniqueHolders === 0 && !hasMarketCap) {
    riskScore += 20;
    flags.push({ flag: 'No holder data', severity: 'medium', evidence: 'Unable to verify holder distribution' });
  }

  // Check transaction patterns
  const largeTransactions = onChainData.largeTransactions || 0;
  const totalTransactions = onChainData.transactionCount || 1;
  const largeTransactionRatio = largeTransactions / Math.max(totalTransactions, 1);

  if (largeTransactionRatio > 0.5) {
    riskScore += 25;
    flags.push({
      flag: 'Abnormal transaction pattern',
      severity: 'high',
      evidence: `${(largeTransactionRatio * 100).toFixed(1)}% of transactions are large`,
    });
  }

  // Check contract age (if deployed recently)
  const deployDate = onChainData.deployDate ? new Date(onChainData.deployDate) : null;
  if (deployDate) {
    const ageHours = (Date.now() - deployDate.getTime()) / (1000 * 60 * 60);
    if (ageHours < 24) {
      riskScore += 30;
      flags.push({
        flag: 'Very new contract',
        severity: 'critical',
        evidence: `Deployed less than 24 hours ago`,
      });
    } else if (ageHours < 7 * 24) {
      riskScore += 15;
      flags.push({
        flag: 'Recent deployment',
        severity: 'high',
        evidence: `Deployed ${Math.floor(ageHours / 24)} days ago`,
      });
    }
  }

  // Check verification
  if (!onChainData.isVerified) {
    riskScore += 20;
    flags.push({
      flag: 'Unverified contract',
      severity: 'high',
      evidence: 'Contract source code is not publicly verified',
    });
  }

  // Market cap is a strong rug-protection signal
  if (marketData?.marketCap) {
    if (marketData.marketCap > 1e9) riskScore = Math.max(0, riskScore - 30); // >$1B: very low risk
    else if (marketData.marketCap > 1e8) riskScore = Math.max(0, riskScore - 20); // >$100M
    else if (marketData.marketCap > 1e7) riskScore = Math.max(0, riskScore - 10); // >$10M
  }

  return { score: Math.min(100, Math.max(0, riskScore)), flags };
}

/**
 * Calculate legitimacy score from ON-CHAIN SIGNALS ONLY
 */
function calculateLegitimacyScore(onChainData: any, marketData: any): {
  score: number;
  signals: ScoringResults['positiveSignals'];
} {
  let score = 50; // Base score
  const signals: ScoringResults['positiveSignals'] = [];

  if (!onChainData) return { score, signals };

  // Holder distribution (positive signal)
  if (onChainData.uniqueHolders > 1000) {
    score += 25;
    signals.push({
      signal: 'Wide holder distribution',
      strength: 'strong',
      evidence: `${onChainData.uniqueHolders} unique token holders`,
    });
  } else if (onChainData.uniqueHolders > 100) {
    score += 10;
  }

  // Contract verification
  if (onChainData.isVerified) {
    score += 15;
    signals.push({
      signal: 'Verified contract',
      strength: 'strong',
      evidence: 'Source code publicly verified on-chain',
    });
  }

  // Exchange listing
  if (marketData?.listedExchanges && marketData.listedExchanges > 3) {
    score += 15;
    signals.push({
      signal: 'Multi-exchange listing',
      strength: 'strong',
      evidence: `Available on ${marketData.listedExchanges} major exchanges`,
    });
  }

  // Market cap tiers drive legitimacy meaningfully
  if (marketData?.marketCap) {
    if (marketData.marketCap > 1e9) {
      score += 35;
      signals.push({ signal: 'Blue-chip market cap', strength: 'strong', evidence: `$${(marketData.marketCap / 1e9).toFixed(1)}B market cap` });
    } else if (marketData.marketCap > 1e8) {
      score += 20;
      signals.push({ signal: 'Established market cap', strength: 'strong', evidence: `$${(marketData.marketCap / 1e6).toFixed(0)}M market cap` });
    } else if (marketData.marketCap > 1e7) {
      score += 10;
      signals.push({ signal: 'Established market cap', strength: 'medium', evidence: `$${(marketData.marketCap / 1e6).toFixed(1)}M market cap` });
    }
  }

  return { score: Math.min(100, score), signals };
}

/**
 * Calculate innovation score (market-based proxy for adoption)
 */
function calculateInnovationScore(marketData: any, chain: string): number {
  let score = 50; // Base score

  if (!marketData) return score;

  // Active trading indicates adoption
  if (marketData?.volume24h) {
    if (marketData.volume24h > 1e8) score += 30;
    else if (marketData.volume24h > 1e7) score += 20;
    else if (marketData.volume24h > 1e6) score += 10;
  }

  // Holding value indicates sustainability
  if (marketData?.allTimeHigh && marketData.currentPrice) {
    const uptake = (marketData.currentPrice / marketData.allTimeHigh) * 100;
    if (uptake > 50) {
      score += 15;
    }
  }

  // Established chain bonus
  if (chain.toLowerCase() === 'ethereum' || chain.toLowerCase() === 'solana') {
    score += 5;
  }

  return Math.min(100, score);
}

/**
 * Calculate survival probability (simplified)
 */
function calculateSurvivalProbability(data: {
  legitimacy: number;
  innovation: number;
  rugRisk: number;
}): number {
  const legitimacyFactor = data.legitimacy * 0.5;
  const innovationFactor = data.innovation * 0.2;
  const rugRiskFactor = (100 - data.rugRisk) * 0.3;

  return Math.round(legitimacyFactor + innovationFactor + rugRiskFactor);
}

/**
 * Main scoring - ON-CHAIN ONLY (fast)
 */
export async function scoreProject(
  projectName: string,
  inputs: ScoringInputs
): Promise<ScoringResults> {
  try {
    // Fetch only: on-chain + market data (no social APIs)
    const [onChainData, marketData] = await Promise.all([
      inputs.contractAddress ? analyzeOnChainMetrics(inputs.contractAddress) : Promise.resolve(null),
      inputs.coingeckoId ? getMarketData(inputs.coingeckoId) : Promise.resolve(null),
    ]);

    // Calculate scores
    const { score: rugRisk, flags: redFlags } = calculateRugRiskScore(onChainData, marketData);
    const { score: legitimacy, signals: positiveSignals } = calculateLegitimacyScore(onChainData, marketData);
    const innovation = calculateInnovationScore(marketData, inputs.chain);
    const survival = calculateSurvivalProbability({
      legitimacy,
      innovation,
      rugRisk,
    });

    return {
      rugRiskScore: rugRisk,
      legitimacyScore: legitimacy,
      innovationScore: innovation,
      survivalProbability: survival,
      redFlags,
      positiveSignals,
    };
  } catch (error) {
    console.error(`Error scoring project ${projectName}:`, error);
    return {
      rugRiskScore: 50,
      legitimacyScore: 50,
      innovationScore: 50,
      survivalProbability: 50,
      redFlags: [
        {
          flag: 'Scoring error',
          severity: 'medium',
          evidence: 'Unable to fetch on-chain data',
        },
      ],
      positiveSignals: [],
    };
  }
}
