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
 * Format: [name, chain, contract, twitter, github, coingecko_id]
 */
const projectsToTrack: Array<{
  name: string;
  chain: string;
  category: string;
  website: string;
  description: string;
  contractAddress?: string;
  twitterHandle?: string;
  githubRepo?: string;
  coingeckoId?: string;
}> = [
  // Add projects here manually or via admin dashboard
  // Example format:
  // {
  //   name: 'Example Protocol',
  //   chain: 'Ethereum',
  //   category: 'DeFi',
  //   website: 'https://example.com',
  //   description: 'Protocol description',
  //   contractAddress: '0x...',
  //   twitterHandle: '@example',
  //   githubRepo: 'example/protocol',
  //   coingeckoId: 'example-token',
  // }
];

interface ProjectImportData {
  name: string;
  chain: string;
  category: string;
  website: string;
  description: string;
  contractAddress?: string;
  twitterHandle?: string;
  githubRepo?: string;
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
      twitterHandle: projectData.twitterHandle,
      githubRepo: projectData.githubRepo,
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
      x_account: projectData.twitterHandle || null,
      description: projectData.description,
      rug_risk_score: scores.rugRiskScore,
      legitimacy_score: scores.legitimacyScore,
      innovation_score: scores.innovationScore,
      survival_probability: scores.survivalProbability,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

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

// Run if called directly
if (require.main === module) {
  const command = process.argv[2];

  if (command === '--clear') {
    clearAllData().then(() => {
      console.log('Ready to seed new data');
      process.exit(0);
    });
  } else {
    seedDatabase().then(() => {
      process.exit(0);
    });
  }
}

export default seedDatabase;
