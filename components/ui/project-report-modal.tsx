'use client';

import type { ComponentType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Shield, Target, Share2, Globe, Code } from 'lucide-react';
import { ProjectIntelligence } from './project-intelligence-card';
import { designTokens } from './design-tokens';
import { OKXSecurityWidget } from './okx-security-widget';
import { OKXSmartMoneyWidget } from './okx-smart-money-widget';

interface ProjectReportModalProps {
  project: ProjectIntelligence | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectReportModal({ project, isOpen, onClose }: ProjectReportModalProps) {
  if (!project) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 lg:p-10 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="relative w-full max-w-5xl max-h-[92vh] card-elevated flex flex-col overflow-hidden border-[var(--color-border-glow)] shadow-[var(--shadow-lg)]"
          >
            <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-bg-elevated)] z-10">
              <div className="flex items-center gap-2 min-w-0 text-xs font-mono uppercase tracking-wider">
                <span className="text-[var(--color-text-muted)]">Intelligence Briefing</span>
                <span className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
                <span className="text-[var(--color-accent)] truncate">ID: {project.id.slice(0, 8)}</span>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer">
                  <Share2 size={16} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-[var(--color-text-primary)] hover:bg-[var(--color-bg-accent)] rounded-lg transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto">
              <div className="w-full lg:w-[42%] p-6 md:p-10 space-y-8 lg:border-r border-[var(--color-border)]">
                <div className="space-y-6">
                  <span className="badge">{project.category}</span>
                  <h2
                    className="font-bold tracking-tight text-[var(--color-text-primary)]"
                    style={{ fontSize: designTokens.typography.sizes['2xl'] }}
                  >
                    {project.name}
                  </h2>
                  <p className="text-body text-sm leading-relaxed">
                    Comprehensive intelligence synthesis across technical, social, and liquidity
                    vectors for survival probability and risk surface.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ExternalLinkButton icon={Globe} href={project.website} label="Website" />
                  <ExternalLinkButton icon={Code} href="#" label="Repository" />
                </div>
              </div>

              <div className="flex-1 p-6 md:p-10 space-y-10 bg-[var(--color-bg-primary)]">
                <div className="grid grid-cols-2 gap-6 md:gap-10">
                  <ReportMetric
                    label="Legitimacy Index"
                    value={project.legitimacyScore}
                    subtext="On-chain & social verification"
                  />
                  <ReportMetric
                    label="Innovation Delta"
                    value={project.innovationScore}
                    subtext="Codebase uniqueness & impact"
                  />
                  <ReportMetric
                    label="Risk Surface"
                    value={project.rugRiskScore}
                    isRisk
                    subtext="Consolidated attack surface"
                  />
                  <ReportMetric
                    label="Momentum"
                    value={Math.round(project.communitySize / 1000)}
                    subtext="Network growth (k)"
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-label">Intelligence Signals</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {project.positiveSignals.map((sig, i) => (
                      <SignalItem key={`p-${i}`} type="positive" text={sig} />
                    ))}
                    {project.redFlags.map((flag, i) => (
                      <SignalItem key={`n-${i}`} type="negative" text={flag} />
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-label">On-Chain Intelligence</h3>
                  <div className="space-y-3">
                    <OKXSecurityWidget tokenAddress={project.id} chain={project.chain} />
                    <OKXSmartMoneyWidget tokenAddress={project.id} chain={project.chain} />
                  </div>
                </div>

                <div className="pt-6 border-t border-[var(--color-border)] grid grid-cols-3 gap-4">
                  <MetadataItem label="Chain" value={project.chain} />
                  <MetadataItem label="Stage" value={project.stage} />
                  <MetadataItem label="Token" value={project.tokenStatus} />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 px-4 md:px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)] flex justify-end">
              <button className="btn-primary text-xs md:text-sm">Download Briefing</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ReportMetric({
  label,
  value,
  subtext,
  isRisk,
}: {
  label: string;
  value: number;
  subtext: string;
  isRisk?: boolean;
}) {
  const color = isRisk
    ? value > 60
      ? designTokens.colors.signal.danger
      : designTokens.colors.signal.success
    : 'var(--color-text-primary)';

  return (
    <div className="space-y-1">
      <span className="text-label">{label}</span>
      <div className="font-mono text-3xl md:text-4xl font-bold tracking-tighter stat-value" style={{ color }}>
        {value}
      </div>
      <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-medium leading-tight">{subtext}</p>
    </div>
  );
}

function SignalItem({ type, text }: { type: 'positive' | 'negative'; text: string }) {
  const isPositive = type === 'positive';
  return (
    <div className="flex items-start gap-3 p-4 card">
      <div
        className={`p-2 rounded-lg flex-shrink-0 ${
          isPositive ? 'bg-[rgba(52,211,153,0.12)] text-[var(--color-success)]' : 'bg-[rgba(248,113,113,0.12)] text-[var(--color-danger)]'
        }`}
      >
        {isPositive ? <Shield size={14} /> : <Target size={14} />}
      </div>
      <span className="text-sm font-medium text-[var(--color-text-primary)]">{text}</span>
    </div>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <span className="text-label">{label}</span>
      <div className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-tight">{value}</div>
    </div>
  );
}

function ExternalLinkButton({
  icon: Icon,
  href,
  label,
}: {
  icon: ComponentType<{ size?: number }>;
  href?: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-ghost text-xs"
    >
      <Icon size={12} />
      {label}
    </a>
  );
}
