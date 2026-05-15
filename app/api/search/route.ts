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
    const query = searchParams.get('q')?.toLowerCase() || '';

    if (!query || query.length < 2) {
      return NextResponse.json({
        projects: [],
        message: 'Query must be at least 2 characters',
      });
    }

    // Search across multiple fields
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        category,
        chain,
        stage,
        rug_risk_score,
        legitimacy_score,
        updated_at
      `)
      .or(
        `name.ilike.%${query}%,category.ilike.%${query}%,chain.ilike.%${query}%`
      )
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      projects: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
