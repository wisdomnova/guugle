'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Shield, Target, Activity, Share2, Globe, Code } from 'lucide-react';
import { ProjectIntelligence } from './project-intelligence-card';
import { designTokens } from './design-tokens';

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4 lg:p-12 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0a0a0b]/80 backdrop-blur-2xl"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.98 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-6xl h-full max-h-[85vh] md:max-h-[900px] bg-white rounded-xl md:rounded-2xl shadow-3xl flex flex-col overflow-hidden"
          >
            {/* Minimalist Top Bar */}
            <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b border-gray-100">
              <div className="flex items-center gap-2 md:gap-4 min-w-0">
                <span className="text-label text-gray-400 text-xs md:text-sm">Intelligence Briefing</span>
                <span className="w-1 h-1 rounded-full bg-gray-200" />
                <span className="text-label text-indigo-600 text-xs md:text-sm truncate">ID: {project.id.slice(0, 8)}</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors"><Share2 size={16}/></button>
                <button 
                  onClick={onClose}
                  className="p-2 ml-1 md:ml-2 text-gray-900 hover:bg-gray-50 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Split Layout: Narrative & Data */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              
              {/* Left Column: Core Identity (Editorial) */}
              <div className="w-full lg:w-[45%] p-6 md:p-10 lg:p-20 space-y-8 md:space-y-12 lg:border-r border-gray-100 flex flex-col justify-center">
                <div className="space-y-6 md:space-y-8">
                  <div className="inline-block px-3 py-1 rounded-full bg-gray-900 text-white text-label text-xs md:text-sm">
                    {project.category}
                  </div>
                  <h2 
                    className="font-bold tracking-tighter leading-[0.95] text-gray-950"
                    style={{ fontSize: designTokens.typography.sizes['2xl'] }}
                  >
                    {project.name}
                  </h2>
                  <p className="text-body text-gray-500 max-w-md text-sm md:text-base leading-relaxed">
                    Comprehensive intelligence synthesis for {project.name}. Analyzed across technical, social, and liquidity vectors to determine survival probability and technological impact.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 md:gap-4">
                  <ExternalLinkButton icon={Globe} href={project.website} label="Website" />
                  <ExternalLinkButton icon={Code} href="#" label="Repository" />
                </div>
              </div>

              {/* Right Column: Intelligence Metrics (Archival) */}
              <div className="flex-1 bg-gray-50/50 p-6 md:p-10 lg:p-16 overflow-y-auto space-y-12 md:space-y-16">
                
                {/* Score Grid */}
                <div className="grid grid-cols-2 gap-6 md:gap-8 lg:gap-12">
                  <ReportMetric 
                    label="Legitimacy Index" 
                    value={project.legitimacyScore} 
                    subtext="On-chain & social verification delta" 
                  />
                  <ReportMetric 
                    label="Innovation Delta" 
                    value={project.innovationScore} 
                    subtext="Codebase uniqueness & tech impact" 
                  />
                  <ReportMetric 
                    label="Risk Surface" 
                    value={project.rugRiskScore} 
                    isRisk 
                    subtext="Consolidated attack surface analysis" 
                  />
                  <ReportMetric 
                    label="Momentum" 
                    value={Math.round(project.communitySize / 1000)} 
                    subtext="Normalized network growth (k)" 
                  />
                </div>

                {/* Signals Matrix */}
                <div className="space-y-6 md:space-y-8">
                  <h3 className="text-label text-gray-400 text-xs md:text-sm">Intelligence Signals</h3>
                  <div className="grid grid-cols-1 gap-3 md:gap-4">
                    {project.positiveSignals.map((sig, i) => (
                      <SignalItem key={i} type="positive" text={sig} />
                    ))}
                    {project.redFlags.map((flag, i) => (
                      <SignalItem key={i} type="negative" text={flag} />
                    ))}
                  </div>
                </div>

                {/* Technical Footprint */}
                <div className="pt-6 md:pt-8 border-t border-gray-200 grid grid-cols-3 gap-4 md:gap-8">
                  <MetadataItem label="Chain" value={project.chain} />
                  <MetadataItem label="Stage" value={project.stage} />
                  <MetadataItem label="Token Status" value={project.tokenStatus} />
                </div>
              </div>
            </div>

            {/* Tactical Footer */}
            <div className="px-4 md:px-8 py-4 md:py-6 bg-gray-950 text-white flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
              <div className="flex items-center gap-2 md:gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[0.65rem] tracking-widest uppercase opacity-70">Analysis Verified // Systems Nominal</span>
              </div>
              <button 
                className="px-6 md:px-8 py-2 md:py-3 bg-white text-gray-950 rounded-lg text-label font-bold hover:bg-gray-100 transition-all active:scale-95 text-xs md:text-sm whitespace-nowrap"
              >
                Download Briefing
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ReportMetric({ label, value, subtext, isRisk }: { label: string, value: number, subtext: string, isRisk?: boolean }) {
  const color = isRisk 
    ? (value > 60 ? designTokens.colors.signal.danger : designTokens.colors.signal.success)
    : designTokens.colors.text.primary;

  return (
    <div className="space-y-2">
      <div className="text-label text-gray-400">{label}</div>
      <div className="font-mono text-5xl font-bold tracking-tighter" style={{ color }}>{value}</div>
      <p className="text-[0.65rem] text-gray-500 leading-tight uppercase font-medium">{subtext}</p>
    </div>
  );
}

function SignalItem({ type, text }: { type: 'positive' | 'negative', text: string }) {
  const isPositive = type === 'positive';
  return (
    <div className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-xl">
      <div className={`p-2 rounded-lg ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
        {isPositive ? <Shield size={16}/> : <Target size={16}/>}
      </div>
      <span className="text-sm font-semibold text-gray-900">{text}</span>
    </div>
  );
}

function MetadataItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">{label}</div>
      <div className="text-sm font-bold text-gray-900 uppercase tracking-tight">{value}</div>
    </div>
  );
}

function ExternalLinkButton({ icon: Icon, href, label }: { icon: any, href?: string, label: string }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-5 py-3 border border-gray-100 rounded-lg font-bold text-label text-gray-900 transition-all hover:border-gray-900 hover:bg-gray-50"
    >
      <Icon size={14} />
      {label}
    </a>
  );
}
