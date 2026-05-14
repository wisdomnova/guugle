'use client';

import { useState, useEffect } from 'react';
import { ProjectReport } from '@/lib/types';
import { discoverProjects } from '@/lib/engine';
import { IntelligenceCard } from '@/components/project-card';
import { 
  IconSearch, 
  IconShieldLock, 
  IconTrophy, 
  IconActivity,
  IconTimeline
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/core';

export default function Home() {
  const [projects, setProjects] = useState<ProjectReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    discoverProjects().then((data) => {
      setProjects(data);
      setLoading(false);
    });
  }, []);

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary px-6 lg:px-12 py-10 selection:bg-accent selection:text-bg-primary">
      {/* Navigation Header */}
      <nav className="flex justify-between items-center mb-20 animate-in fade-in slide-in-from-top duration-700">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 bg-accent rounded flex items-center justify-center text-bg-primary font-bold transition-transform group-hover:rotate-12">
            G
          </div>
          <span className="font-mono font-bold tracking-tighter text-xl text-white">GUUGLE INTEL</span>
        </div>
        <div className="hidden md:flex gap-8 text-[10px] font-mono text-text-muted uppercase tracking-[0.2em]">
          <a href="#" className="hover:text-accent transition-colors">Signals</a>
          <a href="#" className="hover:text-accent transition-colors">Risk Engine</a>
          <a href="#" className="hover:text-accent transition-colors">Archive</a>
          <a href="#" className="hover:text-accent transition-colors">About</a>
        </div>
        <button className="px-4 py-2 border border-accent/20 rounded-md text-[10px] font-mono text-accent hover:bg-accent/10 transition-colors uppercase tracking-widest">
          Verify Project
        </button>
      </nav>

      {/* Hero Section */}
      <section className="mb-24 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Badge variant="accent" className="mb-6">Early Stage Alpha Engine v1.0</Badge>
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 leading-[1.1] text-white">
            Detecting the <span className="text-accent underline decoration-accent/20 decoration-8 underline-offset-8">Invisible</span> Before It Trends.
          </h1>
          <p className="text-lg text-text-muted max-w-2xl leading-relaxed mb-10">
            Institutional-grade intelligence for the decentralized frontier. We track organic momentum, analyze technical legitimacy, and score rug probability using multi-chain on-chain signals.
          </p>

          <div className="relative max-w-xl group">
            <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-accent" size={20} />
            <input 
              type="text" 
              placeholder="Search by category, chain, or founder..."
              className="w-full bg-bg-elevated border border-border-dim rounded-xl py-4 pl-12 pr-4 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all placeholder:text-text-muted/30"
            />
          </div>
        </motion.div>
      </section>

      {/* Live Feed Section */}
      <section className="space-y-12">
        <div className="flex justify-between items-end border-b border-border-dim pb-6">
          <div className="space-y-1">
            <h2 className="text-xs font-mono text-text-muted uppercase tracking-[0.3em] flex items-center gap-2">
              <IconActivity size={14} className="text-accent animate-pulse" /> Live Intelligence Feed
            </h2>
            <p className="text-2xl font-bold text-white">Emerging Protocols</p>
          </div>
          <div className="flex gap-4">
            <div className="flex gap-2">
              <Badge variant="outline">AI x Crypto</Badge>
              <Badge variant="outline">Infra</Badge>
              <Badge variant="outline">Solana</Badge>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-[400px] bg-bg-elevated rounded-xl border border-border-dim" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {projects.map((p) => (
              <IntelligenceCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>

      {/* Analytics Visualization Placeholder */}
      <section className="mt-32 pt-20 border-t border-border-dim">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="space-y-6">
            <IconTimeline className="text-accent" size={32} />
            <h3 className="text-xl font-bold text-white">Network Velocity</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Monitoring developer migration patterns across ecosystems. Currently detecting a <span className="text-text-primary underline">14% shift</span> from L2s to SVM-based infrastructure.
            </p>
          </div>
          <div className="space-y-6">
            <IconShieldLock className="text-accent" size={32} />
            <h3 className="text-xl font-bold text-white">Anti-Rug Heuristics</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Our engine identifies wallet clustering and recycled deployer history across 12 chains to protect against coordinated 'slow rugs'.
            </p>
          </div>
          <div className="space-y-6">
            <IconTrophy className="text-accent" size={32} />
            <h3 className="text-xl font-bold text-white">Signal Scorecard</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Projects must exceed a <span className="text-text-primary underline">75% Legitimacy Score</span> before being flagged as a 'Priority Discovery' for early-stage participation.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-40 border-t border-border-dim pt-12 pb-20 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-6 h-6 bg-text-muted rounded flex items-center justify-center text-bg-primary font-bold text-xs">G</div>
            <span className="font-mono text-sm tracking-tighter text-white">GUUGLE INTEL</span>
          </div>
          <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest">© 2024 Intelligence Layer v1.0.4</p>
        </div>
        <div className="flex gap-10 text-[10px] font-mono text-text-muted uppercase tracking-[0.2em]">
          <a href="#" className="hover:text-accent transition-colors">API</a>
          <a href="#" className="hover:text-accent transition-colors">Terms</a>
          <a href="#" className="hover:text-accent transition-colors">Privacy</a>
          <a href="#" className="hover:text-accent transition-colors">Twitter (X)</a>
        </div>
      </footer>
    </main>
  );
}

