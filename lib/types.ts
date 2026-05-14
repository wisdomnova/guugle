export type RiskScore = number; // 0-100

export type ProjectStage = 'Stealth' | 'Early' | 'Launched' | 'Scaling';

export interface ProjectReport {
  id: string;
  name: string;
  category: string;
  chain: string;
  stage: ProjectStage;
  website: string;
  xAccount: string;
  founders: string[];
  funding: string;
  investors: string[];
  productStatus: string;
  tokenStatus: string;
  communitySize: string;
  githubActivity: string;
  onchainSignals: string[];
  smartMoneyInterest: string;
  redFlags: string[];
  positiveSignals: string[];
  assessment: string;
  rugRiskScore: RiskScore;
  survivalProbability: 'Low' | 'Medium' | 'High';
  confidenceLevel: 'Low' | 'Medium' | 'High';
  metrics: {
    legitimacy: number;
    innovation: number;
    sustainability: number;
    community: number;
    technical: number;
  };
}

export interface SearchFilters {
  category?: string;
  chain?: string;
  minRiskScore?: number;
}
