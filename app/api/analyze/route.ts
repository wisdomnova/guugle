import { NextResponse } from 'next/server';
import { runFullAnalysis } from '@/lib/analysis';

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';
const ETHERSCAN_BASE_URL = 'https://api.etherscan.io/api';
const COINGECKO_PRO_BASE = 'https://pro-api.coingecko.com/api/v3';
const COINGECKO_FREE_BASE = 'https://api.coingecko.com/api/v3';
const COINGECKO_API_KEY = process.env.COINGECKO_PRO_API_KEY || '';

function cgHeaders(): Record<string, string> {
  return COINGECKO_API_KEY ? { 'x-cg-pro-api-key': COINGECKO_API_KEY } : {};
}
function cgBase() {
  return COINGECKO_API_KEY ? COINGECKO_PRO_BASE : COINGECKO_FREE_BASE;
}

async function resolveTokenMeta(address: string): Promise<{
  name: string;
  coingeckoId?: string;
  contractAddress: string;
  github?: string;
}> {
  let name = `${address.slice(0, 8)}...${address.slice(-4)}`;
  let coingeckoId: string | undefined;
  let github: string | undefined;

  try {
    const res = await fetch(
      `${ETHERSCAN_BASE_URL}?module=token&action=tokeninfo&contractaddress=${address}&apikey=${ETHERSCAN_API_KEY}`
    );
    const data = await res.json();
    if (Array.isArray(data.result) && data.result[0]?.tokenName) {
      name = data.result[0].tokenName;
    }
  } catch {
    /* ignore */
  }

  try {
    const res = await fetch(`${cgBase()}/coins/ethereum/contract/${address}`, { headers: cgHeaders() });
    if (res.ok) {
      const data = await res.json();
      if (data?.id) {
        coingeckoId = data.id;
        if (data.name) name = data.name;
        github = data.links?.repos_url?.github?.[0];
      }
    }
  } catch {
    /* ignore */
  }

  return { name, coingeckoId, contractAddress: address, github };
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

  const isAddress = /^0x[0-9a-fA-F]{10,}$/.test(input);

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
        const res = await fetch(
          `${cgBase()}/coins/${encodeURIComponent(input.toLowerCase())}?localization=false&tickers=false&community_data=false&developer_data=true`,
          { headers: cgHeaders() }
        );
        if (res.ok) {
          const data = await res.json();
          coingeckoId = data.id;
          projectName = data.name ?? input;
          contractAddress = data.platforms?.ethereum || undefined;
          chain = contractAddress ? 'Ethereum' : 'Unknown';
          githubRepo = data.links?.repos_url?.github?.[0];
        } else {
          const searchRes = await fetch(`${cgBase()}/search?query=${encodeURIComponent(input)}`, {
            headers: cgHeaders(),
          });
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

    return NextResponse.json(result);
  } catch (err) {
    console.error('Analyze error:', err);
    return NextResponse.json({ error: 'Failed to analyze project' }, { status: 500 });
  }
}
