import { ProjectReport } from './types';

export async function discoverProjects(query: string = ''): Promise<ProjectReport[]> {
  // Mocking the discovery logic for the UI demonstration
  // In a real scenario, this would interface with X API, GitHub, etc.
  return [
    {
      id: '1',
      name: 'Aurelius AI',
      category: 'Agentic AI Protocols',
      chain: 'Solana',
      stage: 'Early',
      website: 'https://aurelius.ai',
      xAccount: '@aurelius_ai',
      founders: ['Sarah Chen', 'Marc LeFebvre'],
      funding: '$2.5M Seed',
      investors: ['Variant (Rumored)', 'Robot Ventures'],
      productStatus: 'Beta SDK',
      tokenStatus: 'Unlaunched',
      communitySize: 'Low (1.2k X followers)',
      githubActivity: 'High (Daily commits, 45 stars)',
      onchainSignals: ['Liquidity locked for 2 years', 'Low wallet clustering'],
      smartMoneyInterest: 'High (Followed by 15 major builders)',
      redFlags: ['Lean team for ambitious roadmap'],
      positiveSignals: [
        'Novel ZK-proof for agent actions',
        'Transparent GitHub repo',
        'Direct builder engagement'
      ],
      assessment: 'Aurelius is building a high-utility ZK-inference layer for agentic workflows on Solana. The architectural depth suggests real R&D rather than a marketing fork.',
      rugRiskScore: 12,
      survivalProbability: 'High',
      confidenceLevel: 'Medium',
      metrics: {
        legitimacy: 92,
        innovation: 88,
        sustainability: 75,
        community: 40,
        technical: 95
      }
    },
    {
      id: '2',
      name: 'Kryptos Guard',
      category: 'Security Infra',
      chain: 'Base',
      stage: 'Stealth',
      website: 'https://kryptos.xyz',
      xAccount: '@kryptos_guard',
      founders: ['Anonymous (Verified Doxxed to VCs)'],
      funding: 'Undisclosed',
      investors: ['Coinbase Ventures'],
      productStatus: 'Private Alpha',
      tokenStatus: 'No plans',
      communitySize: 'N/A',
      githubActivity: 'Private',
      onchainSignals: ['Significant multisig activity', 'Base Ecosystem grant recipient'],
      smartMoneyInterest: 'Medium',
      redFlags: ['Closed source during alpha phases', 'Anonymous founders'],
      positiveSignals: [
        'Official Base ecosystem mention',
        'Solving real RWA bridging security issues'
      ],
      assessment: 'Deeply technical security layer for Base. Backend-heavy with institutional focus. Low retail exposure yet high ecosystem importance.',
      rugRiskScore: 8,
      survivalProbability: 'High',
      confidenceLevel: 'High',
      metrics: {
        legitimacy: 95,
        innovation: 70,
        sustainability: 90,
        community: 15,
        technical: 88
      }
    }
  ];
}
