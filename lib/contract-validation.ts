/**
 * Confirms a contract address maps to a real on-chain token before analysis.
 */

import { resolveCoinByContract } from './integrations/coingecko';
import { getDexTokenData } from './integrations/dexscreener';
import { getContractInfo, hasDeployedBytecode, isKnownContractOnChain } from './integrations/etherscan';
import { formatAddressAlias, isEthAddress } from './token-display';

export { isEthAddress };

export interface TokenIdentity {
  name?: string;
  symbol?: string;
  coingeckoId?: string;
  github?: string;
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

function identityFromSources(
  coingecko: Awaited<ReturnType<typeof resolveCoinByContract>>,
  dex: Awaited<ReturnType<typeof getDexTokenData>>,
  contractInfo: Awaited<ReturnType<typeof getContractInfo>>
): TokenIdentity {
  if (coingecko?.name) {
    return {
      name: coingecko.name,
      symbol: coingecko.symbol,
      coingeckoId: coingecko.id,
      github: coingecko.github,
    };
  }

  if (dex?.name) {
    return { name: dex.name, symbol: dex.symbol };
  }

  if (contractInfo?.contractName) {
    return {
      name: contractInfo.contractName,
      symbol: contractInfo.contractName,
    };
  }

  return {};
}

/** Resolve human-readable token label from CoinGecko → DexScreener → Etherscan. */
export async function resolveTokenIdentity(address: string): Promise<TokenIdentity> {
  const contractAddress = address.trim().toLowerCase();

  const [coingecko, dex, contractInfo] = await Promise.all([
    resolveCoinByContract(contractAddress),
    getDexTokenData(contractAddress),
    getContractInfo(contractAddress),
  ]);

  return identityFromSources(coingecko, dex, contractInfo);
}

export async function validateContractAddress(
  address: string
): Promise<ContractValidationResult> {
  const contractAddress = address.trim().toLowerCase();

  const [coingecko, dex, contractInfo, onChain] = await Promise.all([
    resolveCoinByContract(contractAddress),
    getDexTokenData(contractAddress),
    getContractInfo(contractAddress),
    confirmOnChainContract(contractAddress),
  ]);

  const identity = identityFromSources(coingecko, dex, contractInfo);
  const exists = Boolean(coingecko || dex || onChain);

  return {
    exists,
    contractAddress,
    coingeckoId: identity.coingeckoId,
    name: identity.name,
    symbol: identity.symbol,
    github: identity.github,
    signals: {
      coingecko: Boolean(coingecko),
      dexscreener: Boolean(dex),
      onChain,
    },
  };
}

export function displayNameForContract(
  contractAddress: string,
  identity: TokenIdentity
): string {
  if (identity.name?.trim()) return identity.name.trim();
  if (identity.symbol?.trim()) return identity.symbol.trim();
  return formatAddressAlias(contractAddress);
}

async function confirmOnChainContract(address: string): Promise<boolean> {
  const [bytecode, known] = await Promise.all([
    hasDeployedBytecode(address),
    isKnownContractOnChain(address),
  ]);
  return bytecode || known;
}
