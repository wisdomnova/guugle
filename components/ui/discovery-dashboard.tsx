'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, TrendingUp, X } from 'lucide-react';
import { ProjectIntelligenceCard, ProjectIntelligence } from './project-intelligence-card';
import { designTokens } from './design-tokens';

interface DiscoveryDashboardProps {
  projects: ProjectIntelligence[];
  onProjectSelect?: (project: ProjectIntelligence) => void;
  isLoading?: boolean;
}

type SortBy = 'latest' | 'rug-risk' | 'legitimacy' | 'innovation' | 'community';
type FilterCategory = 'all' | 'ai-crypto' | 'defi' | 'infra' | 'gaming' | 'wallet' | 'depIN';

export function DiscoveryDashboard({ projects, onProjectSelect, isLoading }: DiscoveryDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [sortBy, setSortBy] = useState<SortBy>('latest');
  const [showFilters, setShowFilters] = useState(false);

  const filteredProjects = useMemo(() => {
    let result = projects;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.founders?.some((f) => f.toLowerCase().includes(query))
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category.toLowerCase() === selectedCategory);
    }

    const sorted = [...result];
    switch (sortBy) {
      case 'rug-risk':
        sorted.sort((a, b) => b.rugRiskScore - a.rugRiskScore);
        break;
      case 'legitimacy':
        sorted.sort((a, b) => b.legitimacyScore - a.legitimacyScore);
        break;
      case 'innovation':
        sorted.sort((a, b) => b.innovationScore - a.innovationScore);
        break;
      case 'community':
        sorted.sort((a, b) => b.communitySize - a.communitySize);
        break;
      case 'latest':
      default:
        sorted.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    }

    return sorted;
  }, [projects, searchQuery, selectedCategory, sortBy]);

  const avgRugRisk = Math.round(filteredProjects.reduce((sum, p) => sum + p.rugRiskScore, 0) / filteredProjects.length || 0);
  const highRiskCount = filteredProjects.filter((p) => p.rugRiskScore >= 70).length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <div className="container-app py-8 md:py-12 space-y-8 md:space-y-12">
      {/* Header & Stats - Typography focused */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
        <div className="space-y-3 md:space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-indigo-600" style={{ background: designTokens.colors.bg.accent }}>
            <TrendingUp size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Market Intelligence</span>
          </div>
          <h1 
            className="font-bold tracking-tight text-gray-900"
            style={{ fontSize: designTokens.typography.sizes['2xl'] }}
          >
            Project Discovery
          </h1>
          <p 
            className="max-w-2xl text-gray-500 leading-relaxed text-sm md:text-base"
            style={{ fontSize: designTokens.typography.sizes.base }}
          >
            Automated intelligence signals for the next generation of crypto protocols. 
            Real-time scoring based on GitHub activity, social sentiment, and on-chain metrics.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 md:gap-12 md:border-l pl-0 md:pl-8" style={{ borderColor: designTokens.colors.border.subtle }}>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Avg Risk</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-mono font-bold text-gray-900">{avgRugRisk}</span>
              <span className="text-xs font-mono text-gray-400">/100</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">High Risk</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-mono font-bold text-red-500">{highRiskCount}</span>
              <span className="text-xs text-gray-400">Detected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar - Minimal & Functional */}
      <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:justify-between md:items-center py-4 md:py-6 border-y" style={{ borderColor: designTokens.colors.border.subtle }}>
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2 md:py-3 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-gray-400"
            style={{ background: designTokens.colors.bg.elevated }}
          />
        </div>

        <div className="flex items-center gap-2 md:gap-3 overflow-x-auto">
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: designTokens.colors.bg.elevated }}>
            {(['latest', 'legitimacy', 'innovation'] as SortBy[]).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-3 md:px-4 py-1 md:py-1.5 rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  sortBy === s 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8"
      >
        {filteredProjects.map((project) => (
          <motion.div key={project.id} variants={itemVariants}>
            <ProjectIntelligenceCard
              project={project}
              onClick={() => onProjectSelect?.(project)}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Empty State */}
      {filteredProjects.length === 0 && !isLoading && (
        <div className="py-16 md:py-24 text-center space-y-4 rounded-2xl border-2 border-dashed" style={{ background: designTokens.colors.bg.elevated, borderColor: designTokens.colors.border.subtle }}>
          <div className="mx-auto w-10 md:w-12 h-10 md:h-12 rounded-full flex items-center justify-center text-gray-400" style={{ background: designTokens.colors.bg.primary }}>
            <Search size={20} />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-bold text-gray-900">No Intelligence Found</h3>
            <p className="text-sm text-gray-500">Try adjusting your search query.</p>
          </div>
          <button 
            onClick={() => setSearchQuery('')}
            className="text-indigo-600 font-bold text-xs uppercase tracking-widest hover:underline"
          >
            Clear Search
          </button>
        </div>
      )}
    </div>
  );
}
