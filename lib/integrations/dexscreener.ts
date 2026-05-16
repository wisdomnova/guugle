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

export async function getDexMetricsByToken(
  contractAddress: string
): Promise<DexPairMetrics | null> {
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

    const buys = best.txns?.h24?.buys ?? 0;
    const sells = best.txns?.h24?.sells ?? 0;
    const created = best.pairCreatedAt ? Number(best.pairCreatedAt) : 0;
    const pairAgeDays =
      created > 0 ? Math.max(0, (Date.now() - created) / (1000 * 60 * 60 * 24)) : 0;

    return {
      liquidityUsd: parseFloat(best.liquidity?.usd ?? '0') || 0,
      volume24h: parseFloat(best.volume?.h24 ?? '0') || 0,
      marketCap: parseFloat(best.marketCap ?? best.fdv ?? '0') || 0,
      priceUsd: parseFloat(best.priceUsd ?? '0') || 0,
      priceChange24h: parseFloat(best.priceChange?.h24 ?? '0') || 0,
      pairAgeDays,
      buys24h: buys,
      sells24h: sells,
      txns24h: buys + sells,
      dexId: best.dexId ?? '',
      pairAddress: best.pairAddress ?? '',
    };
  } catch (error) {
    console.error('DexScreener error:', error);
    return null;
  }
}
