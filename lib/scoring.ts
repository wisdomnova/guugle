/**
 * Risk Scoring Algorithm
 * Calculates institutional-grade risk assessments using real data
 */

import { getContractInfo, analyzeOnChainMetrics } from './integrations/etherscan';
import { getTwitterMetrics } from './integrations/twitter';
import { getGitHubMetrics, analyzeCodeQuality } from './integrations/github';
import { getMarketData, checkExchangeListing } from './integrations/coingecko';

export interface ScoringInputs {
  contractAddress?: string;
  twitterHandle?: string;
  githubRepo?: string;
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
function calculateRugRiskScore(onChainData: any): {
  score: number;
  flags: ScoringResults['redFlags'];
} {
  let riskScore = 0;
  const flags: ScoringResults['redFlags'] = [];

  if (!onChainData) {
    return { score: 50, flags: [{ flag: 'No on-chain data', severity: 'high', evidence: 'Contract not verified' }] };
  }

  // Check holder concentration
  const uniqueHolders = onChainData.uniqueHolders || 0;
  if (uniqueHolders < 50) {
    riskScore += 35;
    flags.push({
      flag: 'Low holder count',
      severity: 'critical',
      evidence: `Only ${uniqueHolders} unique holders detected`,
    });
  } else if (uniqueHolders < 500) {
    riskScore += 15;
    flags.push({
      flag: 'Concentrated holders',
      severity: 'high',
      evidence: `${uniqueHolders} holders suggests concentration risk`,
    });
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

  return { score: Math.min(100, riskScore), flags };
}

/**
 * Calculate legitimacy score from multiple signals
 */
function calculateLegitimacyScore(data: {
  github?: any;
  twitter?: any;
  codeQuality?: any;
  onChain?: any;
}): {
  score: number;
  signals: ScoringResults['positiveSignals'];
} {
  let score = 0;
  const signals: ScoringResults['positiveSignals'] = [];

  // GitHub signals (40% weight)
  if (data.github) {
    const gitScore = Math.min(100, (data.github.starCount || 0) + (data.github.contributorCount || 0) * 2);
    score += gitScore * 0.4;

    if (data.github.lastCommitDate) {
      const daysSinceCommit = (Date.now() - data.github.lastCommitDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCommit < 30) {
        signals.push({
          signal: 'Active development',
          strength: 'strong',
          evidence: `Last commit ${Math.floor(daysSinceCommit)} days ago`,
        });
      }
    }

    if (data.github.commitCount > 100) {
      signals.push({
        signal: 'Substantial codebase',
        strength: 'strong',
        evidence: `${data.github.commitCount} commits in repository`,
      });
    }
  }

  // Code quality signals (25% weight)
  if (data.codeQuality) {
    score += data.codeQuality.qualityScore * 0.25;

    if (data.codeQuality.hasTests) {
      signals.push({
        signal: 'Test coverage present',
        strength: 'medium',
        evidence: 'Repository includes test suite',
      });
    }

    if (data.codeQuality.hasDocumentation) {
      signals.push({
        signal: 'Well documented',
        strength: 'medium',
        evidence: 'Project has comprehensive documentation',
      });
    }
  }

  // Twitter signals (20% weight)
  if (data.twitter) {
    const twitterScore = Math.min(100, (data.twitter.followersCount / 10000) * 100);
    score += twitterScore * 0.2;

    if (data.twitter.isVerified) {
      signals.push({
        signal: 'Verified Twitter account',
        strength: 'strong',
        evidence: 'Official account verified by Twitter',
      });
    }

    if (data.twitter.engagementRate > 0.05) {
      signals.push({
        signal: 'Strong community engagement',
        strength: 'medium',
        evidence: `${(data.twitter.engagementRate * 100).toFixed(2)}% engagement rate`,
      });
    }
  }

  // On-chain signals (15% weight)
  if (data.onChain && data.onChain.uniqueHolders > 1000) {
    signals.push({
      signal: 'Wide holder distribution',
      strength: 'strong',
      evidence: `${data.onChain.uniqueHolders} unique token holders`,
    });
  }

  return { score: Math.min(100, score), signals };
}

/**
 * Calculate innovation score
 */
function calculateInnovationScore(data: {
  github?: any;
  codeQuality?: any;
  projectDescription?: string;
}): number {
  let score = 0;

  // Code quality indicator of innovation
  if (data.codeQuality?.qualityScore) {
    score += data.codeQuality.qualityScore * 0.5;
  }

  // GitHub stars/activity indicator
  if (data.github?.starCount) {
    score += Math.min(50, (data.github.starCount / 1000) * 50);
  }

  // Recent commits indicate active development
  if (data.github?.developmentVelocity) {
    score += Math.min(20, data.github.developmentVelocity * 5);
  }

  return Math.min(100, score);
}

/**
 * Calculate survival probability
 */
function calculateSurvivalProbability(data: {
  legitimacy: number;
  innovation: number;
  rugRisk: number;
  githubActivity: number;
  twitterFollowers: number;
}): number {
  // Weighted combination
  const legitimacyFactor = data.legitimacy * 0.35;
  const innovationFactor = data.innovation * 0.25;
  const rugRiskFactor = (100 - data.rugRisk) * 0.25;
  const activityFactor = Math.min(100, data.githubActivity * 2 + data.twitterFollowers / 5000) * 0.15;

  return Math.round(legitimacyFactor + innovationFactor + rugRiskFactor + activityFactor);
}

/**
 * Main scoring function
 */
export async function scoreProject(
  projectName: string,
  inputs: ScoringInputs
): Promise<ScoringResults> {
  try {
    // Fetch all data in parallel
    const [onChainData, twitterData, githubData, marketData, codeQuality] = await Promise.all([
      inputs.contractAddress ? analyzeOnChainMetrics(inputs.contractAddress) : Promise.resolve(null),
      inputs.twitterHandle ? getTwitterMetrics(inputs.twitterHandle) : Promise.resolve(null),
      inputs.githubRepo ? getGitHubMetrics(...(inputs.githubRepo.split('/') as [string, string])) : Promise.resolve(null),
      inputs.coingeckoId ? getMarketData(inputs.coingeckoId) : Promise.resolve(null),
      inputs.githubRepo ? analyzeCodeQuality(...(inputs.githubRepo.split('/') as [string, string])) : Promise.resolve(null),
    ]);

    // Calculate scores
    const { score: rugRisk, flags: redFlags } = calculateRugRiskScore(onChainData);
    const { score: legitimacy, signals: positiveSignals } = calculateLegitimacyScore({
      github: githubData,
      twitter: twitterData,
      codeQuality: codeQuality,
      onChain: onChainData,
    });
    const innovation = calculateInnovationScore({
      github: githubData,
      codeQuality: codeQuality,
    });
    const survival = calculateSurvivalProbability({
      legitimacy,
      innovation,
      rugRisk,
      githubActivity: githubData?.developmentVelocity || 0,
      twitterFollowers: twitterData?.followersCount || 0,
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
    // Return neutral scores on error
    return {
      rugRiskScore: 50,
      legitimacyScore: 50,
      innovationScore: 50,
      survivalProbability: 50,
      redFlags: [
        {
          flag: 'Scoring error',
          severity: 'medium',
          evidence: 'Unable to fetch all data sources for complete assessment',
        },
      ],
      positiveSignals: [],
    };
  }
}
