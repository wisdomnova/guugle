import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: Request) {
  try {
    if (!supabase || !supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const chain = searchParams.get('chain');
    const stage = searchParams.get('stage');
    const sortBy = searchParams.get('sort') || 'updated_at';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('projects')
      .select(`
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
      `)
      .order(sortBy === 'rug_risk' ? 'rug_risk_score' : sortBy, { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (chain && chain !== 'all') {
      query = query.eq('chain', chain);
    }
    if (stage && stage !== 'all') {
      query = query.eq('stage', stage);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch related data for each project
    const enrichedProjects = await Promise.all(
      (data || []).map(async (project: any) => {
        const [
          { data: founders },
          { data: redFlags },
          { data: positiveSignals },
          { data: investors },
        ] = await Promise.all([
          supabase
            .from('project_founders')
            .select('founder_name')
            .eq('project_id', project.id),
          supabase
            .from('project_red_flags')
            .select('flag')
            .eq('project_id', project.id)
            .limit(5),
          supabase
            .from('project_positive_signals')
            .select('signal')
            .eq('project_id', project.id)
            .limit(5),
          supabase
            .from('project_investors')
            .select('investor_name')
            .eq('project_id', project.id)
            .limit(3),
        ]);

        return {
          id: project.id,
          name: project.name,
          category: project.category,
          chain: project.chain,
          stage: project.stage,
          website: project.website,
          xAccount: project.x_account,
          founders: (founders as any)?.map((f: any) => f.founder_name) || [],
          productStatus: project.product_status,
          tokenStatus: project.token_status,
          communitySize: project.community_size,
          githubActivity: project.github_activity,
          liquiditySignals: project.liquidity_signals,
          rugRiskScore: project.rug_risk_score,
          legitimacyScore: project.legitimacy_score,
          innovationScore: project.innovation_score,
          survivalProbability: project.survival_probability,
          fundingAmount: project.funding_amount,
          investors: (investors as any)?.map((i: any) => i.investor_name) || [],
          redFlags: (redFlags as any)?.map((f: any) => f.flag) || [],
          positiveSignals: (positiveSignals as any)?.map((s: any) => s.signal) || [],
          lastUpdated: project.updated_at,
        };
      })
    );

    return NextResponse.json({
      projects: enrichedProjects,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Projects API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!supabase || !supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();

    const { data, error } = await (supabase
      .from('projects') as any)
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
        rug_risk_score: body.rugRiskScore || 0,
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
