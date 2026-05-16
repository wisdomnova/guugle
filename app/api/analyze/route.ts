import { NextResponse } from 'next/server';
import { runFullAnalysis } from '@/lib/analysis';
import {
  validateContractAddress,
  displayNameForContract,
  isEthAddress,
} from '@/lib/contract-validation';
import { cgFetch } from '@/lib/coingecko-client';

export const dynamic = 'force-dynamic';

interface NameResolution {
  name: string;
  coingeckoId?: string;
  contractAddress?: string;
  github?: string;
  chain: string;
}

async function resolveByName(input: string): Promise<NameResolution | null> {
  const slug = input.toLowerCase().trim();

  try {
    const detailRes = await cgFetch(
      `/coins/${encodeURIComponent(slug)}?localization=false&tickers=false&community_data=false&developer_data=true`
    );

    if (detailRes.ok) {
      const data = await detailRes.json();
      if (!data?.id) return null;
      return {
        name: data.name ?? input,
        coingeckoId: data.id,
        contractAddress: data.platforms?.ethereum?.toLowerCase() || undefined,
        chain: data.platforms?.ethereum ? 'Ethereum' : 'Unknown',
        github: data.links?.repos_url?.github?.[0],
      };
    }

    const searchRes = await cgFetch(`/search?query=${encodeURIComponent(input)}`);
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    const match =
      searchData.coins?.find((c: { id: string }) => c.id === slug) ?? searchData.coins?.[0];
    if (!match?.id) return null;

    const coinRes = await cgFetch(
      `/coins/${encodeURIComponent(match.id)}?localization=false&tickers=false&community_data=false&developer_data=true`
    );
    if (!coinRes.ok) {
      return { name: match.name ?? input, coingeckoId: match.id, chain: 'Unknown' };
    }

    const coin = await coinRes.json();
    return {
      name: coin.name ?? match.name ?? input,
      coingeckoId: coin.id,
      contractAddress: coin.platforms?.ethereum?.toLowerCase() || undefined,
      chain: coin.platforms?.ethereum ? 'Ethereum' : 'Unknown',
      github: coin.links?.repos_url?.github?.[0],
    };
  } catch {
    return null;
  }
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

  const isAddress = isEthAddress(input);

  try {
    let projectName = input;
    let contractAddress: string | undefined;
    let coingeckoId: string | undefined;
    let githubRepo: string | undefined;
    let chain = 'Ethereum';

    if (isAddress) {
      const validation = await validateContractAddress(input);

      if (!validation.exists) {
        return NextResponse.json(
          {
            error:
              'No token found at this address. Check the contract on Ethereum mainnet or try a listed symbol (e.g. uniswap, chainlink).',
            code: 'CONTRACT_NOT_FOUND',
          },
          { status: 404 }
        );
      }

      contractAddress = validation.contractAddress;
      coingeckoId = validation.coingeckoId;
      githubRepo = validation.github;
      projectName = displayNameForContract(contractAddress, {
        name: validation.name,
        symbol: validation.symbol,
        coingeckoId: validation.coingeckoId,
        github: validation.github,
      });
    } else {
      const resolved = await resolveByName(input);
      if (!resolved) {
        return NextResponse.json(
          {
            error: 'Token not found on CoinGecko. Try a contract address or official coin id/symbol.',
            code: 'TOKEN_NOT_FOUND',
          },
          { status: 404 }
        );
      }

      projectName = resolved.name;
      contractAddress = resolved.contractAddress;
      coingeckoId = resolved.coingeckoId;
      githubRepo = resolved.github;
      chain = resolved.chain;
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
