/**
 * Etherscan API V2 — on-chain contract signals
 */

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';
const ETHERSCAN_V2_BASE = 'https://api.etherscan.io/v2/api';
const DEFAULT_CHAIN_ID = '1';

export interface ContractInfo {
  contractAddress: string;
  deployerWallet: string;
  deployDate: Date | null;
  totalSupply: string;
  isVerified: boolean;
}

export interface OnChainMetrics {
  transactionCount: number;
  uniqueHolders: number | null;
  largeTransactions: number;
  rugPullIndicators: number;
  isVerified: boolean;
  deployDate: string | null;
  deployerWallet: string | null;
  holderCountAvailable: boolean;
}

function v2Url(params: Record<string, string>, chainId = DEFAULT_CHAIN_ID): string {
  const q = new URLSearchParams({
    chainid: chainId,
    apikey: ETHERSCAN_API_KEY,
    ...params,
  });
  return `${ETHERSCAN_V2_BASE}?${q.toString()}`;
}

async function etherscanGet<T>(params: Record<string, string>): Promise<T | null> {
  if (!ETHERSCAN_API_KEY) {
    console.warn('Etherscan API key not configured');
    return null;
  }
  try {
    const res = await fetch(v2Url(params), { cache: 'no-store' });
    const data = await res.json();
    if (data.status !== '1' && data.message !== 'OK') {
      return null;
    }
    return data.result as T;
  } catch (error) {
    console.error('Etherscan V2 error:', error);
    return null;
  }
}

export async function getContractInfo(address: string): Promise<ContractInfo | null> {
  const result = await etherscanGet<Array<Record<string, string>>>({
    module: 'contract',
    action: 'getsourcecode',
    address: address.toLowerCase(),
  });

  if (!result?.[0]) return null;

  const contract = result[0];
  const ts = parseInt(contract.TimeStamp || '0', 10);

  return {
    contractAddress: address,
    deployerWallet: contract.Creator || '',
    deployDate: ts > 0 ? new Date(ts * 1000) : null,
    totalSupply: contract.TokenSupply || '0',
    isVerified: Boolean(contract.SourceCode && contract.SourceCode.length > 2),
  };
}

export async function analyzeOnChainMetrics(contractAddress: string): Promise<OnChainMetrics> {
  const address = contractAddress.toLowerCase();
  const empty: OnChainMetrics = {
    transactionCount: 0,
    uniqueHolders: null,
    largeTransactions: 0,
    rugPullIndicators: 0,
    isVerified: false,
    deployDate: null,
    deployerWallet: null,
    holderCountAvailable: false,
  };

  if (!ETHERSCAN_API_KEY) return empty;

  try {
    const [contractInfo, holderResult, abiResult] = await Promise.all([
      getContractInfo(address),
      fetch(
        v2Url({
          module: 'token',
          action: 'tokenholdercount',
          contractaddress: address,
        }),
        { cache: 'no-store' }
      ).then((r) => r.json()),
      fetch(
        v2Url({
          module: 'contract',
          action: 'getabi',
          address,
        }),
        { cache: 'no-store' }
      ).then((r) => r.json()),
    ]);

    let uniqueHolders: number | null = null;
    let holderCountAvailable = false;

    if (
      holderResult?.status === '1' &&
      typeof holderResult.result === 'string' &&
      /^\d+$/.test(holderResult.result)
    ) {
      uniqueHolders = parseInt(holderResult.result, 10);
      holderCountAvailable = true;
    }

    const abiVerified =
      abiResult?.status === '1' &&
      typeof abiResult.result === 'string' &&
      abiResult.result.length > 10;

    const isVerified = contractInfo?.isVerified ?? abiVerified;

    return {
      transactionCount: uniqueHolders ?? 0,
      uniqueHolders,
      largeTransactions: 0,
      rugPullIndicators: uniqueHolders !== null && uniqueHolders < 10 ? 1 : 0,
      isVerified,
      deployDate: contractInfo?.deployDate?.toISOString() ?? null,
      deployerWallet: contractInfo?.deployerWallet ?? null,
      holderCountAvailable,
    };
  } catch (error) {
    console.error('On-chain metrics error:', error);
    return empty;
  }
}
