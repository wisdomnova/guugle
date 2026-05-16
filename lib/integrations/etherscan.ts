/**
 * Etherscan Integration
 * Fetches on-chain signals for Ethereum projects
 */

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';
const ETHERSCAN_BASE_URL = 'https://api.etherscan.io/api';

export interface ContractInfo {
  contractAddress: string;
  deployerWallet: string;
  deployDate: Date;
  totalSupply: string;
  burnedTokens: string;
  isVerified: boolean;
  sourceCode: string;
  compiler: string;
}

export interface LiquiditySignals {
  totalLiquidity: number;
  liquidityLocked: boolean;
  lockDuration?: number;
  lockPercentage: number;
}

export interface OnChainMetrics {
  transactionCount: number;
  uniqueHolders: number;
  largeTransactions: number;
  rugPullIndicators: number;
}

/**
 * Get contract deployment info from Etherscan
 */
export async function getContractInfo(address: string): Promise<ContractInfo | null> {
  try {
    if (!ETHERSCAN_API_KEY) {
      console.warn('Etherscan API key not configured');
      return null;
    }

    const response = await fetch(
      `${ETHERSCAN_BASE_URL}?module=contract&action=getsourcecode&address=${address}&apikey=${ETHERSCAN_API_KEY}`
    );

    const data = await response.json();
    if (data.result && data.result[0]) {
      const contract = data.result[0];
      return {
        contractAddress: address,
        deployerWallet: contract.Creator || '',
        deployDate: new Date(parseInt(contract.TimeStamp) * 1000),
        totalSupply: contract.TokenSupply || '0',
        burnedTokens: '0', // Would need to calculate from logs
        isVerified: contract.SourceCode ? true : false,
        sourceCode: contract.SourceCode || '',
        compiler: contract.CompilerVersion || '',
      };
    }
    return null;
  } catch (error) {
    console.error('Etherscan contract info error:', error);
    return null;
  }
}

/**
 * Check for liquidity lock indicators
 */
export async function getLiquiditySignals(contractAddress: string): Promise<LiquiditySignals> {
  try {
    // This would typically query lock contracts (Uniswap V2 Locker, Pinksale, etc.)
    // For now, returning a template
    return {
      totalLiquidity: 0,
      liquidityLocked: false,
      lockPercentage: 0,
    };
  } catch (error) {
    console.error('Liquidity signals error:', error);
    return {
      totalLiquidity: 0,
      liquidityLocked: false,
      lockPercentage: 0,
    };
  }
}

/**
 * Analyze on-chain transaction patterns for rug pull indicators
 */
export async function analyzeOnChainMetrics(contractAddress: string): Promise<OnChainMetrics> {
  try {
    if (!ETHERSCAN_API_KEY) {
      return { transactionCount: 0, uniqueHolders: 0, largeTransactions: 0, rugPullIndicators: 0 };
    }

    // Fetch holder count + contract verification in parallel
    const [holderRes, contractRes] = await Promise.all([
      fetch(`${ETHERSCAN_BASE_URL}?module=token&action=tokenholdercount&contractaddress=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`),
      fetch(`${ETHERSCAN_BASE_URL}?module=contract&action=getabi&address=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`),
    ]);

    const holderData = await holderRes.json();
    const contractData = await contractRes.json();

    // holdercount returns a numeric string on success
    const holderCount = typeof holderData.result === 'string' && /^\d+$/.test(holderData.result)
      ? parseInt(holderData.result, 10)
      : 0;

    const isVerified = contractData.status === '1' && typeof contractData.result === 'string' && contractData.result.length > 10;

    return {
      transactionCount: holderCount > 0 ? holderCount : 0,
      uniqueHolders: holderCount,
      largeTransactions: 0,
      rugPullIndicators: holderCount < 10 ? 1 : 0,
      isVerified,
    } as any;
  } catch (error) {
    console.error('On-chain metrics error:', error);
    return { transactionCount: 0, uniqueHolders: 0, largeTransactions: 0, rugPullIndicators: 0 };
  }
}
