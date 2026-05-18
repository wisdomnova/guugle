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

function isDemoKeyOnProHostError(status: number, body: unknown): boolean {
  if (status !== 400 || !body || typeof body !== 'object') return false;
  const err = body as { error_code?: number; status?: { error_message?: string } };
  if (err.error_code === 10011) return true;
  const msg = err.status?.error_message ?? '';
  return msg.includes('Demo API key') && msg.includes('pro-api.coingecko.com');
}

export async function cgFetch(path: string, init?: RequestInit): Promise<Response> {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const requestInit: RequestInit = {
    ...init,
    headers: { ...cgHeaders(), ...(init?.headers as Record<string, string>) },
    cache: 'no-store',
  };

  const primary = await fetch(`${cgBaseUrl()}${normalized}`, requestInit);

  if (!COINGECKO_API_KEY || primary.status !== 400) return primary;

  try {
    const body = await primary.clone().json();
    if (!isDemoKeyOnProHostError(primary.status, body)) return primary;
  } catch {
    return primary;
  }

  return fetch(`${COINGECKO_FREE_BASE}${normalized}`, {
    ...init,
    headers: { ...(init?.headers as Record<string, string>) },
    cache: 'no-store',
  });
}
