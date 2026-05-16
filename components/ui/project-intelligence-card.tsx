'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, Activity, Droplets } from 'lucide-react';
import { designTokens } from './design-tokens';

export interface ProjectIntelligence {
  id: string;
  name: string;
  category: string;
  chain: string;
  stage: string;
  contractAddress?: string | null;
  coingeckoId?: string | null;
  website?: string;
  xAccount?: string;
  founders?: string[];
  productStatus: 'ideation' | 'alpha' | 'beta' | 'launched' | 'mature';
  tokenStatus: 'no-token' | 'planned' | 'private' | 'public';
  communitySize: number;
  githubActivity: number;
  liquiditySignals: number;
  rugRiskScore: number;
  legitimacyScore: number;
  innovationScore: number;
  survivalProbability: 'low' | 'medium' | 'high';
  survivalScore?: number;
  redFlags: string[];
  positiveSignals: string[];
  fundingAmount?: number;
  investors?: string[];
  lastUpdated: string;
}

interface ProjectCardProps {
  project: ProjectIntelligence;
  onClick?: () => void;
}

function riskTone(score: number) {
  if (score >= 70) return designTokens.colors.signal.danger;
  if (score >= 35) return designTokens.colors.signal.warning;
  return designTokens.colors.signal.success;
}

function formatVol(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return n > 0 ? `$${n}` : '—';
}

export function ProjectIntelligenceCard({ project, onClick }: ProjectCardProps) {
  const riskColor = riskTone(project.rugRiskScore);
  const survivalPct = project.survivalScore ?? (project.survivalProbability === 'high' ? 78 : project.survivalProbability === 'low' ? 32 : 55);

  return (
    <motion.article
      onClick={onClick}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col cursor-pointer h-full"
    >
      <div className="card flex flex-col h-full p-5 space-y-4 group-hover:shadow-[var(--shadow-glow)]">
        <div className="flex justify-between items-start gap-3">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3
                className="font-bold tracking-tight text-[var(--color-text-primary)] truncate"
                style={{ fontSize: designTokens.typography.sizes.lg }}
              >
                {project.name}
              </h3>
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: riskColor, boxShadow: `0 0 6px ${riskColor}` }}
              />
            </div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">
              {project.category} · {project.chain}
            </p>
            {project.contractAddress && (
              <p className="text-[10px] font-mono text-[var(--color-accent)] truncate">
                {project.contractAddress.slice(0, 8)}…{project.contractAddress.slice(-4)}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
              Rug risk
            </p>
            <p
              className="font-mono font-bold tabular-nums leading-none mt-0.5"
              style={{ fontSize: designTokens.typography.sizes.xl, color: riskColor }}
            >
              {project.rugRiskScore}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--color-border)]">
          {[
            { icon: ShieldCheck, label: 'Legitimacy', value: `${project.legitimacyScore}` },
            { icon: Activity, label: 'Innovation', value: `${project.innovationScore}` },
            { icon: Zap, label: 'Dev score', value: `${project.githubActivity}` },
            { icon: Droplets, label: '24h vol', value: formatVol(project.liquiditySignals) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="space-y-0.5">
              <div className="flex items-center gap-1 text-[var(--color-text-muted)]">
                <Icon size={10} />
                <span className="text-[9px] uppercase tracking-wider font-semibold">{label}</span>
              </div>
              <p className="font-mono font-bold text-sm text-[var(--color-text-primary)]">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
          <span className="text-[10px] text-[var(--color-text-muted)]">
            Survival <span className="font-mono text-[var(--color-text-primary)]">{survivalPct}%</span>
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)] group-hover:gap-2 transition-all">
            Report
            <ArrowRight size={10} />
          </span>
        </div>
      </div>
    </motion.article>
  );
}
