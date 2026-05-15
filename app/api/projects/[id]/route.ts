import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabase || !supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { id } = await params;

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectData = project as any;

    const [
      { data: founders },
      { data: redFlags },
      { data: positiveSignals },
      { data: investors },
    ] = await Promise.all([
      supabase.from('project_founders').select('*').eq('project_id', id),
      supabase.from('project_red_flags').select('*').eq('project_id', id),
      supabase.from('project_positive_signals').select('*').eq('project_id', id),
      supabase.from('project_investors').select('*').eq('project_id', id),
    ]);

    return NextResponse.json({
      id: projectData.id,
      name: projectData.name,
      category: projectData.category,
      chain: projectData.chain,
      stage: projectData.stage,
      website: projectData.website,
      xAccount: projectData.x_account,
      description: projectData.description,
      founders: founders || [],
      productStatus: projectData.product_status,
      tokenStatus: projectData.token_status,
      communitySize: projectData.community_size,
      githubActivity: projectData.github_activity,
      liquiditySignals: projectData.liquidity_signals,
      rugRiskScore: projectData.rug_risk_score,
      legitimacyScore: projectData.legitimacy_score,
      innovationScore: projectData.innovation_score,
      survivalProbability: projectData.survival_probability,
      fundingAmount: projectData.funding_amount,
      investors: investors?.map((i: any) => i.investor_name) || [],
      redFlags: redFlags?.map((f: any) => f.flag) || [],
      positiveSignals: positiveSignals?.map((s: any) => s.signal) || [],
      createdAt: projectData.created_at,
      updatedAt: projectData.updated_at,
      lastIntelligenceUpdate: projectData.last_intelligence_update,
    });
  } catch (error) {
    console.error('Project details API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabase || !supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const { data, error } = await (supabase.from('projects') as any)
      .update({
        rug_risk_score: body.rugRiskScore,
        legitimacy_score: body.legitimacyScore,
        innovation_score: body.innovationScore,
        survival_probability: body.survivalProbability,
        community_size: body.communitySize,
        github_activity: body.githubActivity,
        updated_at: new Date().toISOString(),
        last_intelligence_update: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (body.rugRiskScore !== undefined) {
      await (supabase.from('intelligence_reports') as any).insert({
        project_id: id,
        rug_risk_score: body.rugRiskScore,
        legitimacy_score: body.legitimacyScore,
        innovation_score: body.innovationScore,
        analyst_notes: body.notes,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Project update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabase || !supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { id } = await params;

    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Project delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
