import { NextResponse } from 'next/server';
import { scoreProject } from '@/lib/scoring';

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';
const ETHERSCAN_BASE_URL = 'https://api.etherscan.io/api';
const COINGECKO_PRO_BASE = 'https://pro-api.coingecko.com/api/v3';
const COINGECKO_FREE_BASE = 'https://api.coingecko.com/api/v3';
const COINGECKO_API_KEY = process.env.COINGECKO_PRO_API_KEY || '';

function cgHeaders(): Record<string, string> {
  return COINGECKO_API_KEY
    ? { 'x-cg-pro-api-key': COINGECKO_API_KEY }
    : {};
}
function cgBase() {
  return COINGECKO_API_KEY ? COINGECKO_PRO_BASE : COINGECKO_FREE_BASE;
}

/** Try to resolve token name + coingecko_id from a contract address */
async function resolveTokenMeta(address: string): Promise<{ name: string; coingeckoId?: string; contractAddress: string }> {
  let name = `${address.slice(0, 8)}...${address.slice(-4)}`;
  let coingeckoId: string | undefined;

  // 1. Etherscan tokeninfo
  try {
    const res = await fetch(
      `${ETHERSCAN_BASE_URL}?module=token&action=tokeninfo&contractaddress=${address}&apikey=${ETHERSCAN_API_KEY}`
    );
    const data = await res.json();
    if (Array.isArray(data.result) && data.result[0]?.tokenName) {
      name = data.result[0].tokenName;
    }
  } catch { /* ignore */ }

  // 2. CoinGecko — find by contract on Ethereum
  try {
    const res = await fetch(
      `${cgBase()}/coins/ethereum/contract/${address}`,
      { headers: cgHeaders() }
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.id) {
        coingeckoId = data.id;
        if (data.name) name = data.name;
      }
    }
  } catch { /* ignore */ }

  return { name, coingeckoId, contractAddress: address };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get('q')?.trim();

  if (!input || input.length < 3) {
    return NextResponse.json({ error: 'Provide a contract address or token name (min 3 chars)' }, { status: 400 });
  }

  const isAddress = /^0x[0-9a-fA-F]{10,}$/.test(input);

  try {
    let projectName = input;
    let contractAddress: string | undefined;
    let coingeckoId: string | undefined;
    let chain = 'Ethereum';

    if (isAddress) {
      const meta = await resolveTokenMeta(input);
      projectName = meta.name;
      contractAddress = meta.contractAddress;
      coingeckoId = meta.coingeckoId;
    } else {
      // Try CoinGecko search by name/id
      try {
        const res = await fetch(
          `${cgBase()}/coins/${encodeURIComponent(input.toLowerCase())}?localization=false&tickers=false&community_data=false&developer_data=false`,
          { headers: cgHeaders() }
        );
        if (res.ok) {
          const data = await res.json();
          coingeckoId = data.id;
          projectName = data.name ?? input;
          contractAddress = data.platforms?.ethereum || undefined;
          chain = contractAddress ? 'Ethereum' : 'Unknown';
        } else {
          // Fallback: CoinGecko search endpoint
          const searchRes = await fetch(
            `${cgBase()}/search?query=${encodeURIComponent(input)}`,
            { headers: cgHeaders() }
          );
          if (searchRes.ok) {
            const searchData = await searchRes.json();
            const first = searchData.coins?.[0];
            if (first) {
              coingeckoId = first.id;
              projectName = first.name ?? input;
            }
          }
        }
      } catch { /* score with name only */ }
    }

    const scores = await scoreProject(projectName, {
      contractAddress,
      coingeckoId,
      chain,
      projectStage: 'early',
    });

    return NextResponse.json({
      name: projectName,
      contractAddress: contractAddress ?? null,
      coingeckoId: coingeckoId ?? null,
      chain,
      scores: {
        rugRiskScore: scores.rugRiskScore,
        legitimacyScore: scores.legitimacyScore,
        innovationScore: scores.innovationScore,
        survivalProbability: scores.survivalProbability,
      },
      redFlags: scores.redFlags,
      positiveSignals: scores.positiveSignals,
    });
  } catch (err) {
    console.error('Analyze error:', err);
    return NextResponse.json({ error: 'Failed to analyze project' }, { status: 500 });
  }
}
