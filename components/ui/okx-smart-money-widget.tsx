'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Eye, Loader } from 'lucide-react';
import { useSmartMoneySignals } from '@/hooks/use-okx';

interface OKXSmartMoneyWidgetProps {
  tokenAddress: string;
  chain: string;
}

export function OKXSmartMoneyWidget({ tokenAddress, chain }: OKXSmartMoneyWidgetProps) {
  const { loading, signals, error, fetch, subscribe } = useSmartMoneySignals();
  const [isWatching, setIsWatching] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch(tokenAddress, chain);
  }, [tokenAddress, chain, fetch]);

  const handleWatch = async () => {
    if (isWatching) {
      setIsWatching(false);
      return;
    }
    setIsWatching(true);
    const unsubscribe = subscribe(tokenAddress, chain, () => {});
    return () => {
      if (!isWatching) unsubscribe();
    };
  };

  const buySignals = signals.filter((s) => s.action === 'buy');
  const sellSignals = signals.filter((s) => s.action === 'sell');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-3 border border-[rgba(96,165,250,0.25)] bg-[rgba(96,165,250,0.08)] rounded-lg"
    >
      <div
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <TrendingUp size={18} className="text-[var(--color-info)]" />
            {signals.length > 0 && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--color-info)] rounded-full animate-pulse" />
            )}
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-[var(--color-info)]">Smart Money Signals</p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {signals.length} recent trades detected
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              handleWatch();
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
              isWatching
                ? 'bg-[var(--color-info)] text-[#07070b]'
                : 'bg-transparent text-[var(--color-info)] border border-[rgba(96,165,250,0.35)]'
            }`}
          >
            <Eye size={12} />
            {isWatching ? 'Watching' : 'Watch'}
          </motion.button>
          <span className="text-xs text-[var(--color-text-muted)]">{expanded ? '▼' : '▶'}</span>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, maxHeight: 0 }}
            animate={{ opacity: 1, maxHeight: 800 }}
            exit={{ opacity: 0, maxHeight: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 space-y-2 pt-3 border-t border-[var(--color-border)] max-h-96 overflow-y-auto"
          >
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader size={16} className="animate-spin text-[var(--color-info)]" />
              </div>
            ) : signals.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] py-2">No smart money signals yet</p>
            ) : (
              <>
                {buySignals.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-[var(--color-success)] mb-1">
                      Buys ({buySignals.length})
                    </p>
                    <div className="space-y-1">
                      {buySignals.slice(0, 3).map((signal, i) => (
                        <SignalRow key={i} signal={signal} />
                      ))}
                    </div>
                  </div>
                )}
                {sellSignals.length > 0 && (
                  <div className="border-t border-[var(--color-border)] pt-2">
                    <p className="text-xs font-bold text-[var(--color-danger)] mb-1">
                      Sells ({sellSignals.length})
                    </p>
                    <div className="space-y-1">
                      {sellSignals.slice(0, 3).map((signal, i) => (
                        <SignalRow key={i} signal={signal} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
            <p className="text-xs text-[var(--color-text-muted)] mt-2 pt-2 border-t border-[var(--color-border)]">
              Powered by OKX Suite
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SignalRow({ signal }: { signal: { action: string; wallet: string; walletReputation: string; amount: string } }) {
  const isBuy = signal.action === 'buy';
  return (
    <div className="flex items-center justify-between p-2 card text-xs">
      <div className="flex items-center gap-1.5">
        {isBuy ? (
          <TrendingUp size={12} className="text-[var(--color-success)]" />
        ) : (
          <TrendingDown size={12} className="text-[var(--color-danger)]" />
        )}
        <div>
          <p className="font-medium text-[var(--color-text-primary)] truncate max-w-[120px]">
            {signal.wallet.slice(0, 6)}…{signal.wallet.slice(-4)}
          </p>
          <p className="text-[var(--color-text-muted)] capitalize">{signal.walletReputation}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-medium ${isBuy ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
          {signal.action.toUpperCase()}
        </p>
        <p className="text-[var(--color-text-muted)]">{signal.amount}</p>
      </div>
    </div>
  );
}
