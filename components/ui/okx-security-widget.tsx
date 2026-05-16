'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, ExternalLink, Loader } from 'lucide-react';
import { useOKXSecurity } from '@/hooks/use-okx';

interface OKXSecurityWidgetProps {
  tokenAddress: string;
  chain: string;
  onSafetyConfirmed?: () => void;
}

export function OKXSecurityWidget({ tokenAddress, chain, onSafetyConfirmed }: OKXSecurityWidgetProps) {
  const { scanning, result, error, scan } = useOKXSecurity();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleScan = async () => {
    const scanResult = await scan(tokenAddress, chain);
    if (scanResult?.safeToSwap && onSafetyConfirmed) {
      onSafetyConfirmed();
    }
  };

  if (!result && !scanning) {
    return (
      <motion.button
        onClick={handleScan}
        disabled={scanning}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="w-full px-4 py-3 rounded-lg border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.08)] flex items-center justify-between cursor-pointer hover:bg-[rgba(52,211,153,0.12)] transition-colors disabled:opacity-50"
      >
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-[var(--color-success)]" />
          <span className="text-sm font-medium text-[var(--color-success)]">
            {scanning ? 'Scanning…' : 'Run OKX Security Check'}
          </span>
        </div>
        {scanning && <Loader size={16} className="animate-spin text-[var(--color-success)]" />}
      </motion.button>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-3 chip-danger rounded-lg">
        <p className="text-xs font-medium">{error}</p>
      </div>
    );
  }

  if (!result) return null;

  const safe = result.safeToSwap;
  const StatusIcon = safe ? CheckCircle : AlertTriangle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`px-4 py-3 border rounded-lg ${
        safe
          ? 'border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.08)]'
          : 'border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.08)]'
      }`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <StatusIcon
            size={18}
            className={safe ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}
          />
          <div className="text-left">
            <p
              className={`text-xs font-bold ${safe ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}
            >
              {safe ? 'Safe to Swap' : 'High Risk Detected'}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Risk Score: {result.tokenRiskScore}/100
              {result.isHoneypot && ' · Honeypot'}
            </p>
          </div>
        </div>
        <span className="text-xs text-[var(--color-text-muted)]">{isExpanded ? '▼' : '▶'}</span>
      </button>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, maxHeight: 0 }}
          animate={{ opacity: 1, maxHeight: 500 }}
          transition={{ duration: 0.2 }}
          className="mt-3 space-y-2 pt-3 border-t border-[var(--color-border)]"
        >
          <div className="space-y-2 text-xs">
            <Row label="Honeypot Risk" value={result.isHoneypot ? 'Yes' : 'No'} />
            <Row label="Phishing Risk" value={result.phishingRisk ? 'Yes' : 'No'} />
            <Row label="Audit Status" value={result.contractAuditStatus} capitalize />
          </div>
          {result.recommendations.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs font-bold text-[var(--color-text-primary)]">Recommendations</p>
              {result.recommendations.map((rec, i) => (
                <p key={i} className="text-xs text-[var(--color-text-secondary)]">
                  · {rec}
                </p>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)]">Powered by OKX Suite</p>
            <a
              href="https://okx.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1"
            >
              Learn more <ExternalLink size={12} />
            </a>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function Row({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--color-text-muted)] font-medium">{label}</span>
      <span className={`text-[var(--color-text-primary)] ${capitalize ? 'capitalize' : ''}`}>{value}</span>
    </div>
  );
}
