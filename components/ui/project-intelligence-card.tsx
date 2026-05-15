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
  rugRiskScore: number; // 0-100
  legitimacyScore: number; // 0-100
  innovationScore: number; // 0-100
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
      whileHover={{ y: -4 }}
      className="group relative flex flex-col cursor-pointer transition-all duration-500"
    >
      {/* Precision Frame */}
      <div className="relative flex flex-col h-full overflow-hidden bg-white border border-gray-100 rounded-lg p-4 md:p-6 space-y-4 md:space-y-6 transition-colors group-hover:border-gray-200 group-hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.06)]">
        
        {/* Top Tier: Identity & Core Signal */}
        <div className="flex justify-between items-start gap-3 md:gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2">
              <h3 
                className="font-bold tracking-tight leading-none text-gray-950 truncate" 
                style={{ fontSize: designTokens.typography.sizes.lg }}
              >
                {project.name}
              </h3>
              <div 
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" 
                style={{ backgroundColor: isHighRisk ? designTokens.colors.signal.danger : designTokens.colors.signal.success }}
              />
            </div>
            <div className="flex items-center gap-2 md:gap-3 overflow-x-auto">
              <span className="text-label text-gray-400 whitespace-nowrap" style={{ fontSize: '0.6rem' }}>{project.category}</span>
              <span className="w-1 h-1 rounded-full bg-gray-200 flex-shrink-0" />
              <span className="text-label text-gray-400 whitespace-nowrap" style={{ fontSize: '0.6rem' }}>{project.chain}</span>
            </div>
          </div>
          
          <div className="text-right flex-shrink-0">
            <div className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-300 mb-1">Risk</div>
            <div 
              className="font-mono font-bold leading-none tabular-nums" 
              style={{ fontSize: designTokens.typography.sizes.xl, color: isHighRisk ? designTokens.colors.signal.danger : designTokens.colors.text.primary }}
            >
              {project.rugRiskScore}
            </div>
          </div>
        </div>

        {/* Mid Tier: Visual Distribution (The "Tidy" Grid) */}
        <div className="grid grid-cols-2 gap-x-4 md:gap-x-8 gap-y-3 md:gap-y-4 pt-2 border-t border-gray-50">
          <div className="space-y-1">
            <div className="flex items-center gap-1 opacity-40">
              <Activity size={10} />
              <span className="text-label text-xs md:text-sm" style={{ fontSize: '0.55rem' }}>Innovation</span>
            </div>
            <div className="font-mono font-bold text-gray-800 text-sm md:text-base" style={{ fontSize: designTokens.typography.sizes.sm }}>{project.innovationScore}%</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 opacity-40">
              <ShieldCheck size={10} />
              <span className="text-label text-xs md:text-sm" style={{ fontSize: '0.55rem' }}>Legitimacy</span>
            </div>
            <div className="font-mono font-bold text-gray-800 text-sm md:text-base" style={{ fontSize: designTokens.typography.sizes.sm }}>{project.legitimacyScore}%</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 opacity-40">
              <Zap size={10} />
              <span className="text-label text-xs md:text-sm" style={{ fontSize: '0.55rem' }}>GitHub</span>
            </div>
            <div className="font-mono font-bold text-gray-800 text-sm md:text-base" style={{ fontSize: designTokens.typography.sizes.sm }}>{project.githubActivity}pts</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 opacity-40">
              <ArrowRight size={10} className="-rotate-45" />
              <span className="text-label text-xs md:text-sm" style={{ fontSize: '0.55rem' }}>Network</span>
            </div>
            <div className="font-mono font-bold text-gray-800 text-sm md:text-base" style={{ fontSize: designTokens.typography.sizes.sm }}>{(project.communitySize / 1000).toFixed(1)}k</div>
          </div>
        </div>

        {/* Bottom Tier: Contextual Signal */}
        <div className="mt-auto space-y-2 md:space-y-3">
          <div className="h-px bg-gradient-to-r from-gray-100 to-transparent" />
          <div className="flex items-center justify-between">
            <div className="flex -space-x-1">
              {project.investors?.slice(0, 3).map((inv, i) => (
                <div 
                  key={i} 
                  className="w-4 md:w-5 h-4 md:h-5 rounded-full border border-white bg-gray-900 flex items-center justify-center font-mono font-bold text-white uppercase"
                  style={{ fontSize: '0.5rem' }}
                >
                  {inv[0]}
                </div>
              ))}
            </div>
            <motion.div 
              whileHover={{ x: 2 }}
              className="flex items-center gap-1 text-indigo-600 font-bold uppercase tracking-widest whitespace-nowrap"
              style={{ fontSize: '0.6rem' }}
            >
              Intelligence
              <ArrowRight size={10} />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
