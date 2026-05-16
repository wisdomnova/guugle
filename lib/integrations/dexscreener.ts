/**
 * DexScreener — per-contract DEX liquidity & activity (no API key)
 */

export interface DexPairMetrics {
  liquidityUsd: number;
  volume24h: number;
  marketCap: number;
  priceUsd: number;
  priceChange24h: number;
  pairAgeDays: number;
  buys24h: number;
  sells24h: number;
  txns24h: number;
  dexId: string;
  pairAddress: string;
}

export interface DexTokenData {
  metrics: DexPairMetrics;
  name: string;
  symbol: string;
}

type DexTokenRef = { address?: string; name?: string; symbol?: string };

function tokenFromPair(pair: { baseToken?: DexTokenRef; quoteToken?: DexTokenRef }, address: string) {
  const addr = address.toLowerCase();
  const base = pair.baseToken;
  const quote = pair.quoteToken;

  if (base?.address?.toLowerCase() === addr) {
    return { name: base.name?.trim() || '', symbol: (base.symbol?.trim() || '').toUpperCase() };
  }
  if (quote?.address?.toLowerCase() === addr) {
    return { name: quote.name?.trim() || '', symbol: (quote.symbol?.trim() || '').toUpperCase() };
  }

  return {
    name: base?.name?.trim() || quote?.name?.trim() || '',
    symbol: (base?.symbol || quote?.symbol || '').trim().toUpperCase(),
  };
}

function metricsFromPair(best: Record<string, unknown>): DexPairMetrics {
  const txns = best.txns as { h24?: { buys?: number; sells?: number } } | undefined;
  const buys = txns?.h24?.buys ?? 0;
  const sells = txns?.h24?.sells ?? 0;
  const created = best.pairCreatedAt ? Number(best.pairCreatedAt) : 0;
  const pairAgeDays =
    created > 0 ? Math.max(0, (Date.now() - created) / (1000 * 60 * 60 * 24)) : 0;
  const liquidity = best.liquidity as { usd?: string } | undefined;
  const volume = best.volume as { h24?: string } | undefined;
  const priceChange = best.priceChange as { h24?: string } | undefined;

  return {
    liquidityUsd: parseFloat(liquidity?.usd ?? '0') || 0,
    volume24h: parseFloat(volume?.h24 ?? '0') || 0,
    marketCap: parseFloat(String(best.marketCap ?? best.fdv ?? '0')) || 0,
    priceUsd: parseFloat(String(best.priceUsd ?? '0')) || 0,
    priceChange24h: parseFloat(priceChange?.h24 ?? '0') || 0,
    pairAgeDays,
    buys24h: buys,
    sells24h: sells,
    txns24h: buys + sells,
    dexId: String(best.dexId ?? ''),
    pairAddress: String(best.pairAddress ?? ''),
  };
}

export async function getDexTokenData(contractAddress: string): Promise<DexTokenData | null> {
  try {
    const address = contractAddress.toLowerCase();
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`, {
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const data = await res.json();
    const pairs = data?.pairs;
    if (!Array.isArray(pairs) || pairs.length === 0) return null;

    const best = [...pairs].sort(
      (a, b) =>
        parseFloat(b.liquidity?.usd ?? '0') - parseFloat(a.liquidity?.usd ?? '0')
    )[0];

    const identity = tokenFromPair(best, address);
    if (!identity.name && !identity.symbol) return null;

    return {
      metrics: metricsFromPair(best),
      name: identity.name || identity.symbol,
      symbol: identity.symbol,
    };
  } catch (error) {
    console.error('DexScreener error:', error);
    return null;
  }
}

export async function getDexMetricsByToken(
  contractAddress: string
): Promise<DexPairMetrics | null> {
  const data = await getDexTokenData(contractAddress);
  return data?.metrics ?? null;
}
