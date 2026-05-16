import { NextResponse } from 'next/server';
import { runFullAnalysis } from '@/lib/analysis';
import { resolveCoinByContract } from '@/lib/integrations/coingecko';
import { cgFetch } from '@/lib/coingecko-client';

export const dynamic = 'force-dynamic';

async function resolveTokenMeta(address: string): Promise<{
  name: string;
  coingeckoId?: string;
  contractAddress: string;
  github?: string;
}> {
  const normalized = address.toLowerCase();
  let name = `${normalized.slice(0, 8)}…${normalized.slice(-4)}`;
  let coingeckoId: string | undefined;
  let github: string | undefined;

  const cg = await resolveCoinByContract(normalized);
  if (cg) {
    coingeckoId = cg.id;
    name = cg.name;
    github = cg.github;
  }

  return { name, coingeckoId, contractAddress: normalized, github };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get('q')?.trim();

  if (!input || input.length < 3) {
    return NextResponse.json(
      { error: 'Provide a contract address or token name (min 3 chars)' },
      { status: 400 }
    );
  }

  const isAddress = /^0x[0-9a-fA-F]{40}$/i.test(input);

  try {
    let projectName = input;
    let contractAddress: string | undefined;
    let coingeckoId: string | undefined;
    let githubRepo: string | undefined;
    let chain = 'Ethereum';

    if (isAddress) {
      const meta = await resolveTokenMeta(input);
      projectName = meta.name;
      contractAddress = meta.contractAddress;
      coingeckoId = meta.coingeckoId;
      githubRepo = meta.github;
    } else {
      try {
        const res = await cgFetch(
          `/coins/${encodeURIComponent(input.toLowerCase())}?localization=false&tickers=false&community_data=false&developer_data=true`
        );
        if (res.ok) {
          const data = await res.json();
          coingeckoId = data.id;
          projectName = data.name ?? input;
          contractAddress = data.platforms?.ethereum?.toLowerCase() || undefined;
          chain = contractAddress ? 'Ethereum' : 'Unknown';
          githubRepo = data.links?.repos_url?.github?.[0];
        } else {
          const searchRes = await cgFetch(`/search?query=${encodeURIComponent(input)}`);
          if (searchRes.ok) {
            const searchData = await searchRes.json();
            const first = searchData.coins?.[0];
            if (first) {
              coingeckoId = first.id;
              projectName = first.name ?? input;
            }
          }
        }
      } catch {
        /* score with name only */
      }
    }

    const result = await runFullAnalysis({
      name: projectName,
      contractAddress,
      coingeckoId,
      chain,
      githubRepo,
    });

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err) {
    console.error('Analyze error:', err);
    return NextResponse.json({ error: 'Failed to analyze project' }, { status: 500 });
  }
}
