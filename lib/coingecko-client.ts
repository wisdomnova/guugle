/**
 * Shared CoinGecko HTTP client (free + pro)
 */

const COINGECKO_PRO_BASE = 'https://pro-api.coingecko.com/api/v3';
const COINGECKO_FREE_BASE = 'https://api.coingecko.com/api/v3';
const COINGECKO_API_KEY = process.env.COINGECKO_PRO_API_KEY || '';

export function cgBaseUrl(): string {
  return COINGECKO_API_KEY ? COINGECKO_PRO_BASE : COINGECKO_FREE_BASE;
}

export function cgHeaders(): Record<string, string> {
  return COINGECKO_API_KEY ? { 'x-cg-pro-api-key': COINGECKO_API_KEY } : {};
}

export async function cgFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${cgBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  return fetch(url, {
    ...init,
    headers: { ...cgHeaders(), ...(init?.headers as Record<string, string>) },
    cache: 'no-store',
  });
}
