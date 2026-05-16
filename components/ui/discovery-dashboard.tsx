'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  TrendingUp,
  X,
  Zap,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { ProjectIntelligenceCard, ProjectIntelligence } from './project-intelligence-card';
import { designTokens } from './design-tokens';
import { cn } from '@/lib/utils';

interface DiscoveryDashboardProps {
  projects: ProjectIntelligence[];
  onProjectSelect?: (project: ProjectIntelligence) => void;
  isLoading?: boolean;
}

type FilterCategory = 'all' | 'ai-crypto' | 'defi' | 'infra' | 'gaming' | 'wallet' | 'depin';

const CATEGORIES: { id: FilterCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ai-crypto', label: 'AI × Crypto' },
  { id: 'defi', label: 'DeFi' },
  { id: 'infra', label: 'Infra' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'depin', label: 'DePIN' },
];

export function DiscoveryDashboard({ projects, onProjectSelect, isLoading }: DiscoveryDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [analyzeInput, setAnalyzeInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<any>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    const input = analyzeInput.trim();
    if (!input) return;
    setAnalyzing(true);
    setAnalyzeResult(null);
    setAnalyzeError(null);
    try {
      const url = `/api/analyze?q=${encodeURIComponent(input)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setAnalyzeResult(data);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const buildProjectFromResult = (r: any): ProjectIntelligence => ({
    id: r.contractAddress ?? r.name ?? 'analyzed',
    name: r.name,
    category: r.category ?? 'Unknown',
    chain: r.chain,
    stage: r.stage ?? 'alpha',
    website: r.website ?? undefined,
    founders: [],
    productStatus: 'launched',
    tokenStatus: r.contractAddress ? 'public' : 'planned',
    communitySize: 0,
    githubActivity: 0,
    liquiditySignals: 0,
    rugRiskScore: r.scores.rugRiskScore,
    legitimacyScore: r.scores.legitimacyScore,
    innovationScore: r.scores.innovationScore,
    survivalProbability:
      r.scores.survivalProbability > 65 ? 'high' : r.scores.survivalProbability > 40 ? 'medium' : 'low',
    redFlags: (r.redFlags ?? []).map((f: any) => f.flag),
    positiveSignals: (r.positiveSignals ?? []).map((s: any) => s.signal),
    lastUpdated: new Date().toISOString(),
  });

  const filteredProjects = useMemo(() => {
    let result = projects;
    if (selectedCategory !== 'all') {
      result = result.filter((p) => {
        const cat = p.category.toLowerCase().replace(/\s+/g, '-').replace('×', '');
        return cat.includes(selectedCategory.replace('ai-crypto', 'ai'));
      });
    }
    return [...result].sort(
      (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
  }, [projects, selectedCategory]);

  const avgRugRisk = Math.round(
    filteredProjects.reduce((sum, p) => sum + p.rugRiskScore, 0) / filteredProjects.length || 0
  );
  const highRiskCount = filteredProjects.filter((p) => p.rugRiskScore >= 70).length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <div className="container-app py-8 md:py-12 space-y-8 md:space-y-10">
      {/* Hero + analyze */}
      <section className="card-elevated p-6 md:p-8 space-y-5 shadow-[var(--shadow-glow)]">
        <div className="space-y-2">
          <span className="badge">
            <Zap size={12} />
            Live Risk Analysis
          </span>
          <h1
            className="font-bold tracking-tight text-[var(--color-text-primary)]"
            style={{ fontSize: designTokens.typography.sizes['2xl'] }}
          >
            Paste a contract. Know before you ape.
          </h1>
          <p className="text-body text-sm max-w-xl">
            Enter a contract address or project name for real-time rug risk, legitimacy, and on-chain
            signals.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <input
            type="text"
            placeholder="0x... or project name"
            value={analyzeInput}
            onChange={(e) => setAnalyzeInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            className="input-field flex-1 font-mono text-sm"
          />
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !analyzeInput.trim()}
            className="btn-primary shrink-0"
          >
            {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            {analyzing ? 'Analyzing…' : 'Analyze'}
          </button>
        </div>

        <AnimatePresence>
          {analyzeError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-sm chip-danger px-4 py-3 rounded-lg"
            >
              <AlertTriangle size={14} />
              {analyzeError}
            </motion.div>
          )}
          {analyzeResult && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4 pt-2 border-t border-[var(--color-border)]"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <CheckCircle size={14} className="text-[var(--color-success)] shrink-0" />
                  <span className="font-bold text-[var(--color-text-primary)]">{analyzeResult.name}</span>
                  {analyzeResult.contractAddress && (
                    <span className="text-[10px] font-mono text-[var(--color-text-muted)] hidden md:block">
                      {analyzeResult.contractAddress.slice(0, 10)}…
                      {analyzeResult.contractAddress.slice(-6)}
                    </span>
                  )}
                  <span className="badge badge-muted">{analyzeResult.chain}</span>
                </div>
                <button
                  onClick={() => setAnalyzeResult(null)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer p-1"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    label: 'Rug Risk',
                    value: analyzeResult.scores.rugRiskScore,
                    color:
                      analyzeResult.scores.rugRiskScore > 60
                        ? 'var(--color-danger)'
                        : analyzeResult.scores.rugRiskScore > 30
                          ? 'var(--color-warning)'
                          : 'var(--color-success)',
                  },
                  {
                    label: 'Legitimacy',
                    value: analyzeResult.scores.legitimacyScore,
                    color:
                      analyzeResult.scores.legitimacyScore > 70
                        ? 'var(--color-success)'
                        : 'var(--color-warning)',
                  },
                  {
                    label: 'Innovation',
                    value: analyzeResult.scores.innovationScore,
                    color: 'var(--color-accent-secondary)',
                  },
                  {
                    label: 'Survival',
                    value: analyzeResult.scores.survivalProbability,
                    color:
                      analyzeResult.scores.survivalProbability > 60
                        ? 'var(--color-success)'
                        : 'var(--color-warning)',
                    suffix: '%',
                  },
                ].map(({ label, value, color, suffix }) => (
                  <div key={label} className="card p-4 text-center space-y-1">
                    <div className="text-2xl font-mono font-bold stat-value" style={{ color }}>
                      {value}
                      {suffix ?? ''}
                    </div>
                    <span className="text-label">{label}</span>
                  </div>
                ))}
              </div>
              {analyzeResult.redFlags?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-label text-[var(--color-danger)]">Red Flags</span>
                  <div className="flex flex-wrap gap-2">
                    {analyzeResult.redFlags.slice(0, 4).map((f: any, i: number) => (
                      <span key={i} className="chip-danger">
                        {f.flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {analyzeResult.positiveSignals?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-label text-[var(--color-success)]">Positive Signals</span>
                  <div className="flex flex-wrap gap-2">
                    {analyzeResult.positiveSignals.slice(0, 4).map((s: any, i: number) => (
                      <span key={i} className="chip-success">
                        {s.signal}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => onProjectSelect?.(buildProjectFromResult(analyzeResult))}
                className="btn-primary w-full"
              >
                View Full Report
                <ArrowRight size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Stats header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <span className="badge badge-muted">
            <TrendingUp size={12} />
            Market Intelligence
          </span>
          <h2
            className="font-bold tracking-tight text-[var(--color-text-primary)]"
            style={{ fontSize: designTokens.typography.sizes.xl }}
          >
            Project Discovery
          </h2>
          <p className="text-body text-sm max-w-xl">
            Automated signals for crypto protocols — on-chain metrics, risk scoring, and smart money
            activity.
          </p>
        </div>
        <div className="flex gap-8 md:pl-8 md:border-l border-[var(--color-border)]">
          <div className="space-y-1">
            <span className="text-label">Avg Risk</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl stat-value">{avgRugRisk}</span>
              <span className="text-xs font-mono text-[var(--color-text-muted)]">/100</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-label">High Risk</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-mono font-bold text-[var(--color-danger)]">
                {highRiskCount}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">detected</span>
            </div>
          </div>
        </div>
      </section>

      {/* Category filters */}
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

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-52 animate-pulse opacity-60" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
        >
          {filteredProjects.map((project) => (
            <motion.div key={project.id} variants={itemVariants}>
              <ProjectIntelligenceCard project={project} onClick={() => onProjectSelect?.(project)} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {filteredProjects.length === 0 && !isLoading && (
        <div className="card-elevated py-16 text-center space-y-4 border-dashed">
          <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
            <Search size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">No projects found</h3>
            <p className="text-sm text-[var(--color-text-muted)]">Try another category or run an analysis above.</p>
          </div>
        </div>
      )}
    </div>
  );
}
