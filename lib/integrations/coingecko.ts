/**
 * CoinGecko — market data (free + pro via COINGECKO_PRO_API_KEY)
 */

import { cgFetch } from '../coingecko-client';

export interface MarketMetrics {
  tokenPrice: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  liquidityUsd: number;
}

export async function getMarketData(tokenId: string): Promise<MarketMetrics | null> {
  try {
    const response = await cgFetch(
      `/simple/price?ids=${encodeURIComponent(tokenId)}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`
    );

    if (!response.ok) return null;

    const data = await response.json();
    const tokenData = data[tokenId];
    if (!tokenData) return null;

    return {
      tokenPrice: tokenData.usd || 0,
      marketCap: tokenData.usd_market_cap || 0,
      volume24h: tokenData.usd_24h_vol || 0,
      priceChange24h: tokenData.usd_24h_change || 0,
      liquidityUsd: 0,
    };
  } catch (error) {
    console.error('CoinGecko market data error:', error);
    return null;
  }
}

/** Resolve CoinGecko coin id + metadata from an Ethereum contract address */
export async function resolveCoinByContract(
  contractAddress: string
): Promise<{ id: string; name: string; symbol: string; github?: string } | null> {
  try {
    const res = await cgFetch(`/coins/ethereum/contract/${contractAddress.toLowerCase()}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.id) return null;
    return {
      id: data.id,
      name: data.name,
      symbol: (data.symbol || '').toUpperCase(),
      github: data.links?.repos_url?.github?.[0],
    };
  } catch {
    return null;
  }
}

export async function getTokenInfo(tokenId: string): Promise<{
  name: string;
  symbol: string;
  description: string;
  website: string;
  twitter: string;
  github: string;
  contractAddress: string;
}> {
  const empty = {
    name: '',
    symbol: '',
    description: '',
    website: '',
    twitter: '',
    github: '',
    contractAddress: '',
  };

  try {
    const response = await cgFetch(
      `/coins/${encodeURIComponent(tokenId)}?localization=false&tickers=false&market_data=false`
    );
    if (!response.ok) return empty;

    const data = await response.json();
    return {
      name: data.name,
      symbol: data.symbol?.toUpperCase() ?? '',
      description: data.description?.en || '',
      website: data.links?.homepage?.[0] || '',
      twitter: data.links?.twitter_screen_handle || '',
      github: data.links?.repos_url?.github?.[0] || '',
      contractAddress: data.platforms?.ethereum || '',
    };
  } catch (error) {
    console.error('CoinGecko token info error:', error);
    return empty;
  }
}

export async function checkExchangeListing(tokenId: string): Promise<{
  isCexListed: boolean;
  exchanges: string[];
}> {
  try {
    const response = await cgFetch(`/coins/${encodeURIComponent(tokenId)}/tickers?per_page=250`);
    if (!response.ok) return { isCexListed: false, exchanges: [] };

    const data = await response.json();
    const tickers = data.tickers || [];
    const cexExchanges = new Set<string>();
    const cexList = ['binance', 'coinbase', 'kraken', 'bybit', 'okx', 'gate.io'];

    tickers.forEach((ticker: { market: { name: string } }) => {
      const market = ticker.market.name.toLowerCase();
      if (cexList.some((cex) => market.includes(cex))) {
        cexExchanges.add(ticker.market.name);
      }
    });

    return { isCexListed: cexExchanges.size > 0, exchanges: Array.from(cexExchanges) };
  } catch (error) {
    console.error('Exchange listing error:', error);
    return { isCexListed: false, exchanges: [] };
  }
}
