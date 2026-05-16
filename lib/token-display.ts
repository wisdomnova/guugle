const ETH_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export function isEthAddress(input: string): boolean {
  return ETH_ADDRESS_RE.test(input.trim());
}

export function formatAddressAlias(address: string): string {
  const a = address.toLowerCase();
  return `${a.slice(0, 8)}…${a.slice(-4)}`;
}

export function looksLikeAddressLabel(label: string, contractAddress?: string | null): boolean {
  const t = label.trim();
  if (isEthAddress(t)) return true;
  if (contractAddress && t.toLowerCase() === contractAddress.toLowerCase()) return true;
  return /^0x[a-f0-9]{4,}…[a-f0-9]{4}$/i.test(t);
}

export function resolveDisplayName(
  fallback: string,
  opts: {
    name?: string | null;
    symbol?: string | null;
    contractAddress?: string | null;
  }
): string {
  const name = opts.name?.trim();
  if (name) return name;

  const symbol = opts.symbol?.trim();
  if (symbol && looksLikeAddressLabel(fallback, opts.contractAddress)) {
    return symbol;
  }

  return fallback;
}
