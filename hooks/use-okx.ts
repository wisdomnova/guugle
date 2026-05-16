import { useState, useCallback } from 'react';
import {
  runSecurityPreFlight,
  getSmartMoneySignals,
  analyzeMemeToken,
  discoverYieldOpportunities,
  readWalletHoldings,
  subscribeToSmartMoneyBuys,
  type OKXSecurityScanResult,
  type SmartMoneySignal,
  type MemeTokenAnalysis,
  type DeFiYieldOpportunity,
  type WalletHoldings,
} from '@/lib/integrations/okx';

export function useOKXSecurity() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<OKXSecurityScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(
    async (tokenAddress: string, chain: string) => {
      setScanning(true);
      setError(null);
      try {
        const scanResult = await runSecurityPreFlight(tokenAddress, chain);
        setResult(scanResult);
        return scanResult;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Security scan failed';
        setError(message);
        throw err;
      } finally {
        setScanning(false);
      }
    },
    []
  );

  return { scanning, result, error, scan };
}

export function useSmartMoneySignals() {
  const [loading, setLoading] = useState(false);
  const [signals, setSignals] = useState<SmartMoneySignal[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(
    async (tokenAddress: string, chain: string, limit?: number) => {
      setLoading(true);
      setError(null);
      try {
        const fetchedSignals = await getSmartMoneySignals(tokenAddress, chain, limit);
        setSignals(fetchedSignals);
        return fetchedSignals;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch signals';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const subscribe = useCallback(
    (tokenAddress: string, chain: string, onSignal: (signal: SmartMoneySignal) => void) => {
      return subscribeToSmartMoneyBuys(tokenAddress, chain, (signal) => {
        setSignals((prev) => [signal, ...prev].slice(0, 10)); // Keep last 10
        onSignal(signal);
      });
    },
    []
  );

  return { loading, signals, error, fetch, subscribe };
}

export function useMemeTokenAnalysis() {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<MemeTokenAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(
    async (tokenAddress: string, chain: string) => {
      setAnalyzing(true);
      setError(null);
      try {
        const result = await analyzeMemeToken(tokenAddress, chain);
        setAnalysis(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Analysis failed';
        setError(message);
        throw err;
      } finally {
        setAnalyzing(false);
      }
    },
    []
  );

  return { analyzing, analysis, error, analyze };
}

export function useYieldOpportunities() {
  const [loading, setLoading] = useState(false);
  const [opportunities, setOpportunities] = useState<DeFiYieldOpportunity[]>([]);
  const [error, setError] = useState<string | null>(null);

  const discover = useCallback(
    async (asset: string, chain: string, minAPY?: number) => {
      setLoading(true);
      setError(null);
      try {
        const found = await discoverYieldOpportunities(asset, chain, minAPY);
        setOpportunities(found);
        return found;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Discovery failed';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { loading, opportunities, error, discover };
}

export function useWalletHoldings() {
  const [loading, setLoading] = useState(false);
  const [holdings, setHoldings] = useState<WalletHoldings | null>(null);
  const [error, setError] = useState<string | null>(null);

  const read = useCallback(
    async (walletAddress: string, chain?: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await readWalletHoldings(walletAddress, chain);
        setHoldings(data);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to read holdings';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { loading, holdings, error, read };
}
