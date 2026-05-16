import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { isEthAddress, validateContractAddress } from '@/lib/contract-validation';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: Request) {
  try {
    if (!supabase || !supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';

    if (!query || query.length < 2) {
      return NextResponse.json({
        projects: [],
        message: 'Query must be at least 2 characters',
      });
    }

    if (isEthAddress(query)) {
      const validation = await validateContractAddress(query);

      if (!validation.exists) {
        return NextResponse.json({
          projects: [],
          count: 0,
          message: 'No token found at this contract address',
          code: 'CONTRACT_NOT_FOUND',
        });
      }

      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          category,
          chain,
          stage,
          contract_address,
          rug_risk_score,
          legitimacy_score,
          updated_at
        `)
        .ilike('contract_address', validation.contractAddress)
        .limit(20);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        projects: data || [],
        count: data?.length || 0,
        resolved: {
          name: validation.name,
          symbol: validation.symbol,
          coingeckoId: validation.coingeckoId,
          contractAddress: validation.contractAddress,
        },
        hint:
          (data?.length ?? 0) === 0
            ? 'Token recognized on-chain but not in tracked list — use Analyze for a full report'
            : undefined,
      });
    }

    const q = query.toLowerCase();

    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        category,
        chain,
        stage,
        contract_address,
        rug_risk_score,
        legitimacy_score,
        updated_at
      `)
      .or(`name.ilike.%${q}%,category.ilike.%${q}%,chain.ilike.%${q}%,contract_address.ilike.%${q}%`)
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
