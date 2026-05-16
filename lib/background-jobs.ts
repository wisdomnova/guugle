/**
 * Background Data Sync Jobs
 * Handles periodic fetching and updating of project data
 */

import { createClient } from '@supabase/supabase-js';
import { scoreProject, type ScoringInputs } from './scoring';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials not configured');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface ProjectToScore {
  id: string;
  name: string;
  contract_address?: string;
  coingecko_id?: string;
  chain: string;
  product_status: string;
}

/**
 * Fetch all projects that need scoring updates
 */
async function getProjectsToScore(): Promise<ProjectToScore[]> {
  try {
    const { data, error } = await (supabase.from('projects') as any)
      .select('id, name, contract_address, x_account, github_url, coingecko_id, chain, product_status')
      .order('updated_at', { ascending: true })
      .limit(50); // Batch updates to avoid API limits

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching projects to score:', error);
    return [];
  }
}

/**
 * Update a single project with new scores
 */
async function updateProjectScores(
  projectId: string,
  projectName: string,
  scoringInputs: ScoringInputs
): Promise<boolean> {
  try {
    const scores = await scoreProject(projectName, scoringInputs);

    // Update main project table
    const { error: updateError } = await (supabase.from('projects') as any)
      .update({
        rug_risk_score: scores.rugRiskScore,
        legitimacy_score: scores.legitimacyScore,
        innovation_score: scores.innovationScore,
        survival_probability: scores.survivalProbability,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (updateError) throw updateError;

    // Clear old red flags and add new ones
    await (supabase.from('project_red_flags') as any).delete().eq('project_id', projectId);
    if (scores.redFlags.length > 0) {
      await (supabase.from('project_red_flags') as any).insert(
        scores.redFlags.map((flag) => ({
          project_id: projectId,
          flag: flag.flag,
          severity: flag.severity,
          evidence: flag.evidence,
        }))
      );
    }

    // Clear old positive signals and add new ones
    await (supabase.from('project_positive_signals') as any).delete().eq('project_id', projectId);
    if (scores.positiveSignals.length > 0) {
      await (supabase.from('project_positive_signals') as any).insert(
        scores.positiveSignals.map((signal) => ({
          project_id: projectId,
          signal: signal.signal,
          strength: signal.strength,
          evidence: signal.evidence,
        }))
      );
    }

    // Log the report
    await (supabase.from('intelligence_reports') as any).insert({
      project_id: projectId,
      report_date: new Date().toISOString(),
      rug_risk_score: scores.rugRiskScore,
      legitimacy_score: scores.legitimacyScore,
      innovation_score: scores.innovationScore,
      analyst_notes: 'Automated daily scoring update',
    });

    console.log(`✓ Updated scores for ${projectName}`);
    return true;
  } catch (error) {
    console.error(`Error updating project ${projectId}:`, error);
    return false;
  }
}

/**
 * Main sync job - update all projects
 */
export async function syncAllProjectData(): Promise<{ updated: number; failed: number }> {
  try {
    console.log('Starting background data sync...');

    const projects = await getProjectsToScore();
    let updated = 0;
    let failed = 0;

    for (const project of projects) {
      const scoringInputs: ScoringInputs = {
        contractAddress: project.contract_address || undefined,
        coingeckoId: project.coingecko_id || undefined,
        chain: project.chain,
        projectStage: (project.product_status as any) || 'early',
      };

      const success = await updateProjectScores(project.id, project.name, scoringInputs);
      if (success) {
        updated++;
      } else {
        failed++;
      }

      // Rate limiting: 1 second between updates to respect API limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(`Sync complete: ${updated} updated, ${failed} failed`);
    return { updated, failed };
  } catch (error) {
    console.error('Background sync error:', error);
    return { updated: 0, failed: 0 };
  }
}

/**
 * Scheduled sync (run daily via cron)
 */
export async function scheduledDailySync(): Promise<void> {
  try {
    const result = await syncAllProjectData();
    console.log(`Daily sync completed: ${result.updated} projects updated`);
  } catch (error) {
    console.error('Scheduled sync failed:', error);
  }
}

/**
 * One-time data import from APIs
 */
export async function importNewProject(
  projectName: string,
  chain: string,
  scoringInputs: ScoringInputs
): Promise<{ projectId: string; scores: any } | null> {
  try {
    // Score the project
    const scores = await scoreProject(projectName, scoringInputs);

    // Insert into database
    const { data: projectData, error: projectError } = await (
      supabase.from('projects') as any
    ).insert({
      name: projectName,
      category: 'Unclassified', // User should update
      chain: chain,
      stage: scoringInputs.projectStage || 'early',
      rug_risk_score: scores.rugRiskScore,
      legitimacy_score: scores.legitimacyScore,
      innovation_score: scores.innovationScore,
      survival_probability: scores.survivalProbability,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (projectError) throw projectError;
    const projectId = projectData[0].id;

    // Insert red flags
    if (scores.redFlags.length > 0) {
      await (supabase.from('project_red_flags') as any).insert(
        scores.redFlags.map((flag) => ({
          project_id: projectId,
          flag: flag.flag,
          severity: flag.severity,
          evidence: flag.evidence,
        }))
      );
    }

    // Insert positive signals
    if (scores.positiveSignals.length > 0) {
      await (supabase.from('project_positive_signals') as any).insert(
        scores.positiveSignals.map((signal) => ({
          project_id: projectId,
          signal: signal.signal,
          strength: signal.strength,
          evidence: signal.evidence,
        }))
      );
    }

    console.log(`✓ Imported project: ${projectName}`);
    return { projectId, scores };
  } catch (error) {
    console.error(`Error importing project ${projectName}:`, error);
    return null;
  }
}
