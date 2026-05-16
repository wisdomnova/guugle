/**
 * Confirms a contract address maps to a real on-chain token before analysis.
 */

import { resolveCoinByContract } from './integrations/coingecko';
import { getDexMetricsByToken } from './integrations/dexscreener';
import { hasDeployedBytecode, isKnownContractOnChain } from './integrations/etherscan';

const ETH_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export function isEthAddress(input: string): boolean {
  return ETH_ADDRESS_RE.test(input.trim());
}

export interface ContractValidationResult {
  exists: boolean;
  contractAddress: string;
  coingeckoId?: string;
  name?: string;
  symbol?: string;
  github?: string;
  signals: {
    coingecko: boolean;
    dexscreener: boolean;
    onChain: boolean;
  };
}

export async function validateContractAddress(
  address: string
): Promise<ContractValidationResult> {
  const contractAddress = address.trim().toLowerCase();

  const [coingecko, dex, onChain] = await Promise.all([
    resolveCoinByContract(contractAddress),
    getDexMetricsByToken(contractAddress),
    confirmOnChainContract(contractAddress),
  ]);

  const exists = Boolean(coingecko || dex || onChain);

  return {
    exists,
    contractAddress,
    coingeckoId: coingecko?.id,
    name: coingecko?.name,
    symbol: coingecko?.symbol,
    github: coingecko?.github,
    signals: {
      coingecko: Boolean(coingecko),
      dexscreener: Boolean(dex),
      onChain,
    },
  };
}

async function confirmOnChainContract(address: string): Promise<boolean> {
  const [bytecode, known] = await Promise.all([
    hasDeployedBytecode(address),
    isKnownContractOnChain(address),
  ]);
  return bytecode || known;
}
