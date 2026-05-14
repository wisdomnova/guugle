'use client';

import { ProjectReport } from '@/lib/types';
import { Card, Badge, Metric } from './ui/core';
import { 
  IconShieldCheck, 
  IconAlertTriangle, 
  IconBrandGithub, 
  IconWorld, 
  IconArrowUpRight,
  IconFingerprint,
  IconBrain
} from '@tabler/icons-react';

export const IntelligenceCard = ({ project }: { project: ProjectReport }) => {
  const isHighRisk = project.rugRiskScore > 40;

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div className="flex gap-4 items-center">
          <div className="w-12 h-12 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            {project.id === '1' ? <IconBrain size={28} /> : <IconShieldCheck size={28} />}
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary tracking-tight">{project.name}</h3>
            <p className="text-xs text-text-muted font-mono">{project.category} • {project.chain}</p>
          </div>
        </div>
        <Badge variant={isHighRisk ? 'risk-high' : 'risk-low'}>
          Risk Score: {project.rugRiskScore}
        </Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-lg bg-bg-primary/50 border border-border-dim">
        <Metric label="Legitimacy" value={`${project.metrics.legitimacy}%`} />
        <Metric label="Technical" value={`${project.metrics.technical}%`} />
        <Metric label="Survival" value={project.survivalProbability} />
        <Metric label="Confidence" value={project.confidenceLevel} />
      </div>

      <div className="space-y-3">
        <h4 className="text-[10px] font-mono text-text-muted uppercase tracking-widest flex items-center gap-2">
          <IconFingerprint size={12} /> Intelligence Summary
        </h4>
        <p className="text-sm text-text-primary/90 leading-relaxed italic border-l-2 border-accent/30 pl-4 py-1">
          "{project.assessment}"
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-accent uppercase tracking-widest flex items-center gap-2">
            <IconShieldCheck size={12} /> Positive Signals
          </span>
          <ul className="space-y-1">
            {project.positiveSignals.map((s, i) => (
              <li key={i} className="text-xs text-text-primary/80 flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-accent shrink-0" /> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest flex items-center gap-2">
            <IconAlertTriangle size={12} /> Red Flags
          </span>
          <ul className="space-y-1">
            {project.redFlags.map((s, i) => (
              <li key={i} className="text-xs text-text-primary/80 flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 shrink-0" /> {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex gap-3 pt-2 mt-auto border-t border-border-dim">
        <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono transition-colors border border-border-dim">
          <IconWorld size={14} /> Website <IconArrowUpRight size={12} />
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono transition-colors border border-border-dim">
          <IconBrandGithub size={14} /> Repository <IconArrowUpRight size={12} />
        </button>
      </div>
    </Card>
  );
};
