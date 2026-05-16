'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, Activity } from 'lucide-react';
import { designTokens } from './design-tokens';

export interface ProjectIntelligence {
  id: string;
  name: string;
  category: string;
  chain: string;
  stage: string;
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

export function ProjectIntelligenceCard({ project, onClick }: ProjectCardProps) {
  const isHighRisk = project.rugRiskScore >= 70;

  return (
    <motion.article
      onClick={onClick}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col cursor-pointer h-full"
    >
      <div className="card flex flex-col h-full p-5 md:p-6 space-y-5 group-hover:shadow-[var(--shadow-glow)]">
        <div className="flex justify-between items-start gap-3">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className="font-bold tracking-tight leading-none text-[var(--color-text-primary)] truncate"
                style={{ fontSize: designTokens.typography.sizes.lg }}
              >
                {project.name}
              </h3>
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: isHighRisk
                    ? designTokens.colors.signal.danger
                    : designTokens.colors.signal.success,
                  boxShadow: isHighRisk
                    ? '0 0 6px var(--color-danger)'
                    : '0 0 6px var(--color-success)',
                }}
              />
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">
              <span className="truncate">{project.category}</span>
              <span className="w-1 h-1 rounded-full bg-[var(--color-border)] shrink-0" />
              <span className="truncate">{project.chain}</span>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1" title="0 = low rug risk">
              Rug risk
            </div>
            <div
              className="font-mono font-bold leading-none tabular-nums"
              style={{
                fontSize: designTokens.typography.sizes.xl,
                color: isHighRisk ? designTokens.colors.signal.danger : 'var(--color-text-primary)',
              }}
            >
              {project.rugRiskScore}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-3 border-t border-[var(--color-border)]">
          {[
            { icon: Activity, label: 'Innovation', value: `${project.innovationScore}%` },
            { icon: ShieldCheck, label: 'Legitimacy', value: `${project.legitimacyScore}%` },
            { icon: Zap, label: 'GitHub', value: `${project.githubActivity}pts` },
            {
              icon: ArrowRight,
              label: 'Network',
              value: `${(project.communitySize / 1000).toFixed(1)}k`,
              rotate: true,
            },
          ].map(({ icon: Icon, label, value, rotate }) => (
            <div key={label} className="space-y-1">
              <div className="flex items-center gap-1 text-[var(--color-text-muted)]">
                <Icon size={10} className={rotate ? '-rotate-45' : ''} />
                <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
              </div>
              <div className="font-mono font-bold text-[var(--color-text-primary)] text-sm">{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
          <div className="flex -space-x-1.5">
            {project.investors?.slice(0, 3).map((inv, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full border border-[var(--color-bg-card)] bg-[var(--color-accent-soft)] flex items-center justify-center font-mono font-bold text-[var(--color-accent)] uppercase text-[8px]"
              >
                {inv[0]}
              </div>
            ))}
          </div>
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)] group-hover:gap-2 transition-all">
            Report
            <ArrowRight size={10} />
          </span>
        </div>
      </div>
    </motion.article>
  );
}
