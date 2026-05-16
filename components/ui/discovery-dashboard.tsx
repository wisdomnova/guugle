'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Zap,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
  LayoutGrid,
} from 'lucide-react';
import { ProjectIntelligenceCard, ProjectIntelligence } from './project-intelligence-card';
import { AnalysisBreakdown } from './analysis-breakdown';
import type { FullAnalysisResult } from '@/lib/analysis';
import { cn } from '@/lib/utils';

interface DiscoveryDashboardProps {
  projects: ProjectIntelligence[];
  onProjectSelect?: (project: ProjectIntelligence) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

type FilterCategory = 'all' | 'ai-crypto' | 'defi' | 'infra' | 'gaming' | 'wallet' | 'depin';

const CATEGORIES: { id: FilterCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'defi', label: 'DeFi' },
  { id: 'infra', label: 'Infra' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'depin', label: 'DePIN' },
];

export function DiscoveryDashboard({ projects, onProjectSelect, isLoading, onRefresh }: DiscoveryDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [analyzeInput, setAnalyzeInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<FullAnalysisResult | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    const input = analyzeInput.trim();
    if (!input) return;
    setAnalyzing(true);
    setAnalyzeResult(null);
    setAnalyzeError(null);
    try {
      const res = await fetch(`/api/analyze?q=${encodeURIComponent(input)}&t=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setAnalyzeResult(data);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const buildProjectFromResult = (r: FullAnalysisResult): ProjectIntelligence => ({
    id: r.contractAddress ?? r.name,
    name: r.name,
    category: r.intelligence.token?.symbol || 'Analyzed',
    chain: r.chain,
    stage: 'launched',
    contractAddress: r.contractAddress,
    coingeckoId: r.coingeckoId,
    website: r.intelligence.token?.website,
    founders: [],
    productStatus: 'launched',
    tokenStatus: r.contractAddress ? 'public' : 'planned',
    communitySize: r.intelligence.github?.metrics.starCount ?? 0,
    githubActivity: r.scores.githubActivity,
    liquiditySignals: Math.round(r.intelligence.market?.volume24h ?? r.intelligence.dex?.volume24h ?? 0),
    rugRiskScore: r.scores.rugRiskScore,
    legitimacyScore: r.scores.legitimacyScore,
    innovationScore: r.scores.innovationScore,
    survivalScore: r.scores.survivalProbability,
    survivalProbability:
      r.scores.survivalProbability > 65 ? 'high' : r.scores.survivalProbability > 40 ? 'medium' : 'low',
    redFlags: r.redFlags.map((f) => f.flag),
    positiveSignals: r.positiveSignals.map((s) => s.signal),
    lastUpdated: r.analyzedAt,
  });

  const filteredProjects = useMemo(() => {
    let result = projects;
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category.toLowerCase().includes(selectedCategory.replace('-', '')));
    }
    return [...result].sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }, [projects, selectedCategory]);

  const avgRugRisk = Math.round(
    filteredProjects.reduce((sum, p) => sum + p.rugRiskScore, 0) / (filteredProjects.length || 1)
  );
  const highRiskCount = filteredProjects.filter((p) => p.rugRiskScore >= 70).length;

  return (
    <div className="container-app py-8 md:py-10 space-y-10">
      <section className="card-elevated p-6 md:p-8 space-y-5 border-[var(--color-border-glow)]">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <span className="badge">
              <Zap size={12} />
              Contract analyzer
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Paste any contract. Get a unique risk profile.
            </h1>
            <p className="text-body text-sm">
              Live pulls from DexScreener, Etherscan, CoinGecko, and GitHub — scores are computed per address.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="0x… contract address or token name"
            value={analyzeInput}
            onChange={(e) => setAnalyzeInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            className="input-field flex-1 font-mono text-sm"
          />
          <button onClick={handleAnalyze} disabled={analyzing || !analyzeInput.trim()} className="btn-primary shrink-0">
            {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            {analyzing ? 'Scanning…' : 'Analyze'}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {analyzeError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="chip-danger text-sm px-4 py-3 rounded-lg flex items-center gap-2"
            >
              <AlertTriangle size={14} />
              {analyzeError}
            </motion.p>
          )}
          {analyzeResult && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4 pt-4 border-t border-[var(--color-border)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CheckCircle size={14} className="text-[var(--color-success)]" />
                  <span className="font-bold">{analyzeResult.name}</span>
                  {analyzeResult.contractAddress && (
                    <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                      {analyzeResult.contractAddress.slice(0, 10)}…{analyzeResult.contractAddress.slice(-4)}
                    </span>
                  )}
                </div>
                <button onClick={() => setAnalyzeResult(null)} className="text-[var(--color-text-muted)] p-1">
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { k: 'Rug risk', v: analyzeResult.scores.rugRiskScore },
                  { k: 'Legitimacy', v: analyzeResult.scores.legitimacyScore },
                  { k: 'Innovation', v: analyzeResult.scores.innovationScore },
                  { k: 'Survival', v: analyzeResult.scores.survivalProbability, s: '%' },
                ].map(({ k, v, s }) => (
                  <div key={k} className="card p-3 text-center">
                    <p className="text-xl font-mono font-bold text-[var(--color-text-primary)]">
                      {v}
                      {s ?? ''}
                    </p>
                    <p className="text-label mt-1">{k}</p>
                  </div>
                ))}
              </div>
              <AnalysisBreakdown result={analyzeResult} />
              <button onClick={() => onProjectSelect?.(buildProjectFromResult(analyzeResult))} className="btn-primary w-full">
                Open full report
                <ArrowRight size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <LayoutGrid size={18} className="text-[var(--color-accent)]" />
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Tracked protocols</h2>
              <p className="text-xs text-[var(--color-text-muted)]">Live-scored on each load · {filteredProjects.length} shown</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-label">Avg rug risk</p>
                <p className="font-mono font-bold text-lg">{avgRugRisk}</p>
              </div>
              <div>
                <p className="text-label">High risk</p>
                <p className="font-mono font-bold text-lg text-[var(--color-danger)]">{highRiskCount}</p>
              </div>
            </div>
            {onRefresh && (
              <button type="button" onClick={onRefresh} disabled={isLoading} className="btn-ghost text-xs">
                <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                Rescore
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setSelectedCategory(id)}
              className={cn('filter-pill', selectedCategory === id && 'filter-pill-active')}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card h-48 animate-pulse opacity-50" />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredProjects.map((project) => (
              <ProjectIntelligenceCard
                key={`${project.id}-${project.rugRiskScore}-${project.legitimacyScore}`}
                project={project}
                onClick={() => onProjectSelect?.(project)}
              />
            ))}
          </motion.div>
        )}

        {filteredProjects.length === 0 && !isLoading && (
          <div className="card-elevated py-12 text-center text-sm text-[var(--color-text-muted)]">
            No projects in this filter. Run an analysis above or try another category.
          </div>
        )}
      </section>
    </div>
  );
}
