/**
 * CoinGecko Integration
 * Fetches market and price data (free tier, no API key needed)
 */

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

export interface MarketMetrics {
  tokenPrice: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  liquidityUsd: number;
  circulating: string;
  maxSupply: string;
}

/**
 * Get market data for a token
 */
export async function getMarketData(tokenId: string): Promise<MarketMetrics | null> {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=${tokenId}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`
    );

    if (!response.ok) {
      console.error('CoinGecko price lookup failed:', response.statusText);
      return null;
    }

    const data = await response.json();
    const tokenData = data[tokenId];

    if (!tokenData) {
      return null;
    }

    return {
      tokenPrice: tokenData.usd || 0,
      marketCap: tokenData.usd_market_cap || 0,
      volume24h: tokenData.usd_24h_vol || 0,
      priceChange24h: tokenData.usd_24h_change || 0,
      liquidityUsd: 0, // Would need DEX data
      circulating: '0',
      maxSupply: '0',
    };
  } catch (error) {
    console.error('CoinGecko market data error:', error);
    return null;
  }
}

/**
 * Get detailed token info
 */
export async function getTokenInfo(tokenId: string): Promise<{
  name: string;
  symbol: string;
  description: string;
  website: string;
  twitter: string;
  github: string;
  contractAddress: string;
  decimals: number;
}> {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/${tokenId}?localization=false&tickers=false&market_data=false`
    );

    if (!response.ok) {
      return {
        name: '',
        symbol: '',
        description: '',
        website: '',
        twitter: '',
        github: '',
        contractAddress: '',
        decimals: 18,
      };
    }

    const data = await response.json();

    return {
      name: data.name,
      symbol: data.symbol.toUpperCase(),
      description: data.description?.en || '',
      website: data.links?.homepage?.[0] || '',
      twitter: data.links?.twitter_screen_handle || '',
      github: data.links?.repos_url?.github?.[0] || '',
      contractAddress: data.contract_address?.ethereum || '',
      decimals: 18, // Default, would need to fetch from chain
    };
  } catch (error) {
    console.error('CoinGecko token info error:', error);
    return {
      name: '',
      symbol: '',
      description: '',
      website: '',
      twitter: '',
      github: '',
      contractAddress: '',
      decimals: 18,
    };
  }
}

/**
 * Get DEX liquidity data
 */
export async function getDexLiquidity(tokenId: string): Promise<{
  totalLiquidity: number;
  liquidityPools: number;
  bestExchange: string;
}> {
  try {
    // CoinGecko free tier doesn't have DEX data
    // Would need to use:
    // - Uniswap V3 Subgraph
    // - DeFiLlama API
    // - 1inch API
    return {
      totalLiquidity: 0,
      liquidityPools: 0,
      bestExchange: '',
    };
  } catch (error) {
    console.error('DEX liquidity error:', error);
    return {
      totalLiquidity: 0,
      liquidityPools: 0,
      bestExchange: '',
    };
  }
}

/**
 * Check if token is on major exchanges
 */
export async function checkExchangeListing(tokenId: string): Promise<{
  isCexListed: boolean;
  exchanges: string[];
}> {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/${tokenId}/tickers?per_page=250`
    );

    if (!response.ok) {
      return {
        isCexListed: false,
        exchanges: [],
      };
    }

    const data = await response.json();
    const tickers = data.tickers || [];

    const cexExchanges = new Set<string>();
    const cexList = ['binance', 'coinbase', 'kraken', 'bybit', 'okx', 'gate.io'];

    tickers.forEach((ticker: any) => {
      const market = ticker.market.name.toLowerCase();
      if (cexList.some(cex => market.includes(cex))) {
        cexExchanges.add(ticker.market.name);
      }
    });

    return {
      isCexListed: cexExchanges.size > 0,
      exchanges: Array.from(cexExchanges),
    };
  } catch (error) {
    console.error('Exchange listing error:', error);
    return {
      isCexListed: false,
      exchanges: [],
    };
  }
}
