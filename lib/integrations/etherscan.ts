/**
 * Etherscan API V2 — on-chain contract signals
 */

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';
const ETHERSCAN_V2_BASE = 'https://api.etherscan.io/v2/api';
const DEFAULT_CHAIN_ID = '1';

export interface ContractInfo {
  contractAddress: string;
  contractName: string;
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

function parseSourceCodeRow(address: string, row: Record<string, string>): ContractInfo | null {
  const ts = parseInt(row.TimeStamp || '0', 10);
  const hasSource = Boolean(row.SourceCode && row.SourceCode.length > 2);
  const hasName = Boolean(row.ContractName?.trim());
  const hasCreator = Boolean(row.Creator?.trim());
  const hasSupply = Boolean(row.TokenSupply && row.TokenSupply !== '0');

  if (!hasSource && !hasName && !hasCreator && ts <= 0 && !hasSupply) {
    return null;
  }

  return {
    contractAddress: address,
    contractName: row.ContractName?.trim() || '',
    deployerWallet: row.Creator || '',
    deployDate: ts > 0 ? new Date(ts * 1000) : null,
    totalSupply: row.TokenSupply || '0',
    isVerified: hasSource,
  };
}

export async function getContractInfo(address: string): Promise<ContractInfo | null> {
  const result = await etherscanGet<Array<Record<string, string>>>({
    module: 'contract',
    action: 'getsourcecode',
    address: address.toLowerCase(),
  });

  if (!result?.[0]) return null;
  return parseSourceCodeRow(address.toLowerCase(), result[0]);
}

/** True when eth_getCode returns deployed bytecode (not an EOA / empty slot). */
export async function hasDeployedBytecode(address: string): Promise<boolean> {
  if (!ETHERSCAN_API_KEY) return false;

  try {
    const res = await fetch(
      v2Url({
        module: 'proxy',
        action: 'eth_getCode',
        address: address.toLowerCase(),
        tag: 'latest',
      }),
      { cache: 'no-store' }
    );
    const data = await res.json();
    const code = typeof data?.result === 'string' ? data.result.trim() : '';
    return code.length > 2 && code !== '0x';
  } catch {
    return false;
  }
}

/** Token contract or verified deploy visible via Etherscan metadata. */
export async function isKnownContractOnChain(address: string): Promise<boolean> {
  if (!ETHERSCAN_API_KEY) return false;

  try {
    const [info, holderRes] = await Promise.all([
      getContractInfo(address),
      fetch(
        v2Url({
          module: 'token',
          action: 'tokenholdercount',
          contractaddress: address.toLowerCase(),
        }),
        { cache: 'no-store' }
      ).then((r) => r.json()),
    ]);

    if (info) return true;

    return (
      holderRes?.status === '1' &&
      typeof holderRes.result === 'string' &&
      /^\d+$/.test(holderRes.result)
    );
  } catch {
    return false;
  }
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
