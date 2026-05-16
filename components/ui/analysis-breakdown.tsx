'use client';

import type { ComponentType, ReactNode } from 'react';
import { Activity, Code2, ExternalLink, Shield, TrendingDown, TrendingUp } from 'lucide-react';
import type { FullAnalysisResult } from '@/lib/analysis';
import { formatPct, formatUsd } from '@/lib/analysis';

interface AnalysisBreakdownProps {
  result: FullAnalysisResult;
}

export function AnalysisBreakdown({ result }: AnalysisBreakdownProps) {
  const { intelligence: intel } = result;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {intel.sourcesUsed.map((s) => (
          <span key={s} className="chip-success text-[10px]">
            {s} ✓
          </span>
        ))}
        {intel.sourcesMissing.map((s) => (
          <span key={s} className="badge badge-muted text-[10px]">
            {s}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {intel.market && (
          <IntelCard title="Market" icon={TrendingUp} accent="var(--color-accent)">
            <MetricRow label="Price" value={formatUsd(intel.market.tokenPrice)} />
            <MetricRow label="Market cap" value={formatUsd(intel.market.marketCap)} />
            <MetricRow label="24h volume" value={formatUsd(intel.market.volume24h)} />
            <MetricRow label="DEX liquidity" value={formatUsd(intel.market.liquidityUsd)} />
            <MetricRow
              label="24h change"
              value={formatPct(intel.market.priceChange24h)}
              highlight={
                intel.market.priceChange24h >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
              }
            />
            {intel.market.cexNames.length > 0 && (
              <div className="pt-2 border-t border-[var(--color-border)]">
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                  CEX listings
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {intel.market.cexNames.slice(0, 5).join(' · ')}
                  {intel.market.cexNames.length > 5 ? ` +${intel.market.cexNames.length - 5}` : ''}
                </p>
              </div>
            )}
          </IntelCard>
        )}

        {intel.dex && (
          <IntelCard title="DEX activity" icon={Activity} accent="var(--color-warning)">
            <MetricRow label="Liquidity" value={formatUsd(intel.dex.liquidityUsd)} />
            <MetricRow label="Pair age" value={`${Math.floor(intel.dex.pairAgeDays)} days`} />
            <MetricRow label="24h txs" value={String(intel.dex.txns24h)} />
            <MetricRow label="Buys / sells" value={`${intel.dex.buys24h} / ${intel.dex.sells24h}`} />
            <MetricRow label="DEX" value={intel.dex.dexId || '—'} />
          </IntelCard>
        )}

        {intel.onChain && (
          <IntelCard title="On-chain" icon={Shield} accent="var(--color-accent-secondary)">
            <MetricRow
              label="Holders"
              value={
                intel.onChain.uniqueHolders !== null
                  ? intel.onChain.uniqueHolders.toLocaleString()
                  : intel.onChain.holderCountAvailable
                    ? '0'
                    : 'N/A (Pro API)'
              }
            />
            <MetricRow
              label="Contract verified"
              value={intel.onChain.isVerified ? 'Yes' : 'No'}
              highlight={intel.onChain.isVerified ? 'var(--color-success)' : 'var(--color-danger)'}
            />
            {intel.onChain.deployDate && (
              <MetricRow
                label="Deployed"
                value={new Date(intel.onChain.deployDate).toLocaleDateString()}
              />
            )}
            {intel.onChain.deployerWallet && (
              <MetricRow
                label="Deployer"
                value={`${intel.onChain.deployerWallet.slice(0, 8)}…${intel.onChain.deployerWallet.slice(-4)}`}
                mono
              />
            )}
          </IntelCard>
        )}

        {intel.github ? (
          <IntelCard title="GitHub" icon={Code2} accent="var(--color-info)">
            <div className="flex items-center justify-between mb-2">
              <a
                href={intel.github.url ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-[var(--color-accent)] hover:underline flex items-center gap-1"
              >
                {intel.github.repo}
                <ExternalLink size={10} />
              </a>
              <span className="text-xs font-bold text-[var(--color-text-primary)]">
                {result.scores.githubActivity} pts
              </span>
            </div>
            <MetricRow label="Stars" value={intel.github.metrics.starCount.toLocaleString()} />
            <MetricRow label="Forks" value={intel.github.metrics.forkCount.toLocaleString()} />
            <MetricRow label="Commits (30d)" value={String(intel.github.metrics.commitCount)} />
            <MetricRow label="Contributors" value={String(intel.github.metrics.contributors)} />
            <MetricRow
              label="Dev velocity"
              value={`${intel.github.metrics.developmentVelocity.toFixed(1)} / day`}
            />
            <div className="flex flex-wrap gap-1.5 pt-2">
              {intel.github.codeQuality.hasTests && <Tag>Tests</Tag>}
              {intel.github.codeQuality.hasDocumentation && <Tag>Docs</Tag>}
              {intel.github.codeQuality.licensedCode && <Tag>License</Tag>}
              <Tag>Quality {intel.github.codeQuality.qualityScore}/100</Tag>
            </div>
          </IntelCard>
        ) : (
          <IntelCard title="GitHub" icon={Code2} accent="var(--color-text-muted)">
            <p className="text-xs text-[var(--color-text-muted)]">
              No linked public repo found. Set GITHUB_TOKEN for higher API limits.
            </p>
          </IntelCard>
        )}
      </div>

      {(result.redFlags.length > 0 || result.positiveSignals.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.redFlags.length > 0 && (
            <SignalList title="Red flags" items={result.redFlags} type="danger" />
          )}
          {result.positiveSignals.length > 0 && (
            <SignalList title="Positive signals" items={result.positiveSignals} type="success" />
          )}
        </div>
      )}

      <p className="text-[10px] font-mono text-[var(--color-text-muted)]">
        Analyzed {new Date(result.analyzedAt).toLocaleString()}
      </p>
    </div>
  );
}

function IntelCard({
  title,
  icon: Icon,
  accent,
  children,
}: {
  title: string;
  icon: ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  accent: string;
  children: ReactNode;
}) {
  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} style={{ color: accent }} />
        <span className="text-label" style={{ color: accent }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function MetricRow({
  label,
  value,
  highlight,
  mono,
}: {
  label: string;
  value: string;
  highlight?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-2 text-xs">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span
        className={`font-semibold text-[var(--color-text-primary)] ${mono ? 'font-mono' : ''}`}
        style={highlight ? { color: highlight } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-bg-accent)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
      {children}
    </span>
  );
}

function SignalList({
  title,
  items,
  type,
}: {
  title: string;
  items: Array<{
    flag?: string;
    signal?: string;
    severity?: string;
    strength?: string;
    evidence: string;
  }>;
  type: 'danger' | 'success';
}) {
  const Icon = type === 'danger' ? TrendingDown : Activity;
  return (
    <div className="card p-4 space-y-2 max-h-64 overflow-y-auto">
      <div className="flex items-center gap-2">
        <Icon
          size={12}
          className={type === 'danger' ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}
        />
        <span
          className={`text-label ${type === 'danger' ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}
        >
          {title}
        </span>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-xs border-l-2 border-[var(--color-border)] pl-2">
            <span className="font-semibold text-[var(--color-text-primary)]">
              {item.flag ?? item.signal}
            </span>
            {(item.severity || item.strength) && (
              <span className="ml-1 text-[var(--color-text-muted)] uppercase text-[10px]">
                · {item.severity ?? item.strength}
              </span>
            )}
            <p className="text-[var(--color-text-muted)] mt-0.5 leading-snug">{item.evidence}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
