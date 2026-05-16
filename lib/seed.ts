/**
 * Database Seeding and Data Import
 * Production-ready data import from real APIs
 */

import { createClient } from '@supabase/supabase-js';
import { scoreProject, type ScoringInputs } from './scoring';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

/**
 * Real projects to track - manually added by admins
 * Format: [name, chain, contract, coingecko_id]
 * Contract addresses are from mainnet tokens for real scoring
 */
const projectsToTrack: Array<{
  name: string;
  chain: string;
  category: string;
  website: string;
  description: string;
  contractAddress?: string;
  coingeckoId?: string;
}> = [
  {
    name: 'Uniswap',
    chain: 'Ethereum',
    category: 'DeFi',
    website: 'https://uniswap.org',
    description: 'Decentralized trading protocol',
    contractAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // UNI
    coingeckoId: 'uniswap',
  },
  {
    name: 'Aave',
    chain: 'Ethereum',
    category: 'DeFi',
    website: 'https://aave.com',
    description: 'Lending protocol',
    contractAddress: '0x7fc66500c84a76ad7e9c93437e434122a1f9adf5', // AAVE
    coingeckoId: 'aave',
  },
  {
    name: 'Curve Finance',
    chain: 'Ethereum',
    category: 'DeFi',
    website: 'https://curve.fi',
    description: 'Stablecoin DEX',
    contractAddress: '0xd533a949740bb3306d119cc777fa900ba034cd52', // CRV
    coingeckoId: 'curve-dao-token',
  },
  {
    name: 'Lido',
    chain: 'Ethereum',
    category: 'Infra',
    website: 'https://lido.fi',
    description: 'Liquid staking protocol',
    contractAddress: '0x5a98fcbea516cf06857215779fd812ca3bef1b32', // LDO
    coingeckoId: 'lido-dao',
  },
  {
    name: 'Chainlink',
    chain: 'Ethereum',
    category: 'Infra',
    website: 'https://chain.link',
    description: 'Decentralized oracle network',
    contractAddress: '0x514910771af9ca656af840dff83e8264ecf986ca', // LINK
    coingeckoId: 'chainlink',
  },
  {
    name: 'MakerDAO',
    chain: 'Ethereum',
    category: 'DeFi',
    website: 'https://makerdao.com',
    description: 'Decentralized stablecoin issuer',
    contractAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', // MKR
    coingeckoId: 'maker',
  },
];

interface ProjectImportData {
  name: string;
  chain: string;
  category: string;
  website: string;
  description: string;
  contractAddress?: string;
  coingeckoId?: string;
}

/**
 * Import a single project into the database
 */
async function importProject(projectData: ProjectImportData) {
  try {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    // Check if project already exists
    const { data: existing } = await (supabase
      .from('projects') as any)
      .select('id')
      .eq('name', projectData.name)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`⊘ Project "${projectData.name}" already exists`);
      return;
    }

    // Score the project using real API data
    console.log(`📊 Scoring ${projectData.name}...`);
    const scoringInputs: ScoringInputs = {
      contractAddress: projectData.contractAddress,
      coingeckoId: projectData.coingeckoId,
      chain: projectData.chain,
      projectStage: 'early', // Can be updated by user
    };

    const scores = await scoreProject(projectData.name, scoringInputs);

    // Insert project
    const { data: insertedProjects, error: projectError } = await (
      supabase.from('projects') as any
    ).insert({
      name: projectData.name,
      category: projectData.category,
      chain: projectData.chain,
      stage: 'early',
      website: projectData.website || null,
      description: projectData.description,
      contract_address: projectData.contractAddress || null,
      coingecko_id: projectData.coingeckoId || null,
      product_status: 'live',
      token_status: 'launched',
      community_size: 0,
      github_activity: 0,
      liquidity_signals: 0,
      rug_risk_score: scores.rugRiskScore,
      legitimacy_score: scores.legitimacyScore,
      innovation_score: scores.innovationScore,
      survival_probability: scores.survivalProbability,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select();

    if (projectError) throw projectError;

    const projectId = insertedProjects[0].id;
    console.log(`✅ Imported "${projectData.name}"`);

    // Insert red flags
    if (scores.redFlags.length > 0) {
      const redFlagsData = scores.redFlags.map((flag) => ({
        project_id: projectId,
        flag: flag.flag,
        severity: flag.severity,
        evidence: flag.evidence,
      }));

      const { error: flagError } = await (supabase
        .from('project_red_flags') as any)
        .insert(redFlagsData);

      if (flagError) throw flagError;
    }

    // Insert positive signals
    if (scores.positiveSignals.length > 0) {
      const signalsData = scores.positiveSignals.map((signal) => ({
        project_id: projectId,
        signal: signal.signal,
        strength: signal.strength,
        evidence: signal.evidence,
      }));

      const { error: signalError } = await (supabase
        .from('project_positive_signals') as any)
        .insert(signalsData);

      if (signalError) throw signalError;
    }

    // Log the initial report
    await (supabase.from('intelligence_reports') as any).insert({
      project_id: projectId,
      report_date: new Date().toISOString(),
      rug_risk_score: scores.rugRiskScore,
      legitimacy_score: scores.legitimacyScore,
      innovation_score: scores.innovationScore,
      analyst_notes: 'Initial import with real data scoring',
    });
  } catch (error) {
    console.error(`❌ Error importing ${projectData.name}:`, error);
  }
}

/**
 * Seed initial projects from the list
 */
export async function seedDatabase() {
  try {
    if (!supabase || !supabaseUrl || !supabaseKey) {
      throw new Error('Database not configured. Missing Supabase environment variables.');
    }

    console.log('🌱 Starting database seeding...');

    if (projectsToTrack.length === 0) {
      console.log('ℹ️  No projects configured for import');
      console.log('To add projects, update the projectsToTrack array in lib/seed.ts');
      console.log('Or use the admin dashboard to add projects via API');
      return;
    }

    for (const project of projectsToTrack) {
      await importProject(project);
      // Rate limiting to respect API limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log('✅ Database seeding completed!');
  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  }
}

/**
 * Clear all data (for development only)
 */
export async function clearAllData() {
  try {
    if (!supabase) throw new Error('Database not configured');

    console.log('🗑️  Clearing all project data...');

    // Delete in cascade order
    await (supabase.from('intelligence_reports') as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await (supabase.from('onchain_signals') as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await (supabase.from('social_metrics') as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await (supabase.from('project_investors') as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await (supabase.from('project_positive_signals') as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await (supabase.from('project_red_flags') as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await (supabase.from('project_founders') as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await (supabase.from('projects') as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('✅ All data cleared');
  } catch (error) {
    console.error('❌ Clear error:', error);
    throw error;
  }
}

export default seedDatabase;
