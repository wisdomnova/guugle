import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { quickScoreProject } from '@/lib/quick-score';
import { applyAddressVariance } from '@/lib/address-entropy';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

type DbProject = {
  id: string;
  name: string;
  category: string;
  chain: string;
  stage: string;
  website: string | null;
  x_account: string | null;
  contract_address: string | null;
  coingecko_id: string | null;
  product_status: string;
  token_status: string;
  community_size: number;
  github_activity: number;
  liquidity_signals: number;
  rug_risk_score: number;
  legitimacy_score: number;
  innovation_score: number;
  survival_probability: string;
  funding_amount: number | null;
  updated_at: string;
};

async function enrichWithLiveScores(project: DbProject) {
  const contract = project.contract_address ?? undefined;
  const coingeckoId = project.coingecko_id ?? undefined;

  if (contract || coingeckoId) {
    const live = await quickScoreProject({
      name: project.name,
      contractAddress: contract,
      coingeckoId,
      chain: project.chain,
      fallbackId: project.id,
    });

    return {
      rugRiskScore: live.rugRiskScore,
      legitimacyScore: live.legitimacyScore,
      innovationScore: live.innovationScore,
      survivalScore: live.survivalProbability,
      survivalProbability:
        live.survivalProbability > 65 ? 'high' : live.survivalProbability > 40 ? 'medium' : 'low',
      githubActivity: live.githubActivity,
      communitySize: live.communitySize,
      liquiditySignals: live.liquiditySignals,
      lastUpdated: live.scoredAt,
    };
  }

  const varied = applyAddressVariance(
    {
      rugRiskScore: project.rug_risk_score,
      legitimacyScore: project.legitimacy_score,
      innovationScore: project.innovation_score,
      survivalProbability:
        project.survival_probability === 'high'
          ? 72
          : project.survival_probability === 'low'
            ? 28
            : 50,
      githubActivity: project.github_activity,
      communitySize: project.community_size,
    },
    project.id
  );

  return {
    rugRiskScore: varied.rugRiskScore,
    legitimacyScore: varied.legitimacyScore,
    innovationScore: varied.innovationScore,
    survivalScore: varied.survivalProbability,
    survivalProbability:
      varied.survivalProbability > 65 ? 'high' : varied.survivalProbability > 40 ? 'medium' : 'low',
    githubActivity: varied.githubActivity,
    communitySize: varied.communitySize,
    liquiditySignals: project.liquidity_signals,
    lastUpdated: project.updated_at,
  };
}

export async function GET(request: Request) {
  try {
    if (!supabase || !supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const chain = searchParams.get('chain');
    const stage = searchParams.get('stage');
    const sortBy = searchParams.get('sort') || 'updated_at';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const live = searchParams.get('live') !== '0';

    let query = supabase
      .from('projects')
      .select(
        `
        id,
        name,
        category,
        chain,
        stage,
        website,
        x_account,
        contract_address,
        coingecko_id,
        product_status,
        token_status,
        community_size,
        github_activity,
        liquidity_signals,
        rug_risk_score,
        legitimacy_score,
        innovation_score,
        survival_probability,
        funding_amount,
        updated_at
      `
      )
      .order(sortBy === 'rug_risk' ? 'rug_risk_score' : sortBy, { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== 'all') query = query.eq('category', category);
    if (chain && chain !== 'all') query = query.eq('chain', chain);
    if (stage && stage !== 'all') query = query.eq('stage', stage);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data || []) as DbProject[];

    const enrichedProjects = await Promise.all(
      rows.map(async (project) => {
        const [
          { data: founders },
          { data: redFlags },
          { data: positiveSignals },
          { data: investors },
          scores,
        ] = await Promise.all([
          supabase!
            .from('project_founders')
            .select('founder_name')
            .eq('project_id', project.id),
          supabase!
            .from('project_red_flags')
            .select('flag')
            .eq('project_id', project.id)
            .limit(5),
          supabase!
            .from('project_positive_signals')
            .select('signal')
            .eq('project_id', project.id)
            .limit(5),
          supabase!
            .from('project_investors')
            .select('investor_name')
            .eq('project_id', project.id)
            .limit(3),
          live ? enrichWithLiveScores(project) : Promise.resolve(null),
        ]);

        const liveScores = scores ?? {
          rugRiskScore: project.rug_risk_score,
          legitimacyScore: project.legitimacy_score,
          innovationScore: project.innovation_score,
          survivalScore: 50,
          survivalProbability: project.survival_probability,
          githubActivity: project.github_activity,
          communitySize: project.community_size,
          liquiditySignals: project.liquidity_signals,
          lastUpdated: project.updated_at,
        };

        return {
          id: project.id,
          name: project.name,
          category: project.category,
          chain: project.chain,
          stage: project.stage,
          website: project.website,
          xAccount: project.x_account,
          contractAddress: project.contract_address,
          coingeckoId: project.coingecko_id,
          founders: (founders as { founder_name: string }[] | null)?.map((f) => f.founder_name) || [],
          productStatus: project.product_status,
          tokenStatus: project.token_status,
          communitySize: liveScores.communitySize,
          githubActivity: liveScores.githubActivity,
          liquiditySignals: liveScores.liquiditySignals,
          rugRiskScore: liveScores.rugRiskScore,
          legitimacyScore: liveScores.legitimacyScore,
          innovationScore: liveScores.innovationScore,
          survivalScore: liveScores.survivalScore,
          survivalProbability: liveScores.survivalProbability,
          fundingAmount: project.funding_amount,
          investors: (investors as { investor_name: string }[] | null)?.map((i) => i.investor_name) || [],
          redFlags: (redFlags as { flag: string }[] | null)?.map((f) => f.flag) || [],
          positiveSignals: (positiveSignals as { signal: string }[] | null)?.map((s) => s.signal) || [],
          lastUpdated: liveScores.lastUpdated,
        };
      })
    );

    return NextResponse.json(
      { projects: enrichedProjects, total: count, limit, offset },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('Projects API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!supabase || !supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const body = await request.json();

    const { data, error } = await (supabase.from('projects') as any)
      .insert({
        name: body.name,
        category: body.category,
        chain: body.chain,
        stage: body.stage,
        website: body.website,
        x_account: body.xAccount,
        product_status: body.productStatus,
        token_status: body.tokenStatus,
        community_size: body.communitySize || 0,
        github_activity: body.githubActivity || 0,
        rug_risk_score: Math.max(1, body.rugRiskScore ?? 1),
        legitimacy_score: body.legitimacyScore || 0,
        innovation_score: body.innovationScore || 0,
        survival_probability: body.survivalProbability || 'medium',
        funding_amount: body.fundingAmount,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Projects POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
