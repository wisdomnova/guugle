'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Gauge,
  Moon,
  Palette,
  Settings,
  SlidersHorizontal,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function Toggle({
  label,
  description,
  defaultOn = false,
}: {
  label: string;
  description?: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      type="button"
      onClick={() => setOn((v) => !v)}
      className="w-full flex items-center justify-between gap-3 py-2.5 text-left group"
    >
      <motion.div className="min-w-0">
        <p className="text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
          {label}
        </p>
        {description && (
          <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{description}</p>
        )}
      </motion.div>
      <span
        className={cn(
          'relative w-10 h-5 rounded-full shrink-0 transition-colors',
          on ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
            on ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </span>
    </button>
  );
}

export function SettingsDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-ghost text-xs gap-1.5"
        aria-label="Open settings"
      >
        <Settings size={14} />
        <span className="hidden sm:inline">Settings</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-label="Close settings"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 right-0 z-[70] flex h-dvh min-h-0 w-full max-w-md flex-col border-l border-[var(--color-border)] bg-[var(--color-bg-primary)] shadow-2xl sm:max-w-lg"
            >
              <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-[var(--color-accent)]" />
                  <span className="font-bold text-sm">Settings</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-[var(--color-bg-secondary)]"
                >
                  <X size={16} />
                </button>
              </div>

              <motion.div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-5 space-y-7 pb-10">
                <section className="space-y-3">
                  <p className="text-label flex items-center gap-1.5 text-xs">
                    <Sparkles size={14} />
                    Why Guugle?
                  </p>
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 px-5 py-4">
                    <p className="text-[15px] text-[var(--color-text-secondary)] leading-[1.65]">
                      Guugle is your on-chain research agent: paste an Ethereum contract address and
                      it pulls live market, DEX, holder, GitHub, and CoinGecko social signals — then
                      scores rug risk, legitimacy, innovation, and survival in one pass. Built for fast
                      due diligence, not financial advice.
                    </p>
                  </div>
                </section>

                <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                  Controls are not wired yet
                </p>

                <section className="space-y-1">
                  <p className="text-label flex items-center gap-1.5 mb-2">
                    <Palette size={12} />
                    Appearance
                  </p>
                  <div className="card p-3 divide-y divide-[var(--color-border)]">
                    <Toggle label="Dark mode" description="Always on" defaultOn />
                    <Toggle label="Compact cards" description="Denser protocol grid" />
                    <Toggle label="Neon accents" description="Extra glow on scores" defaultOn />
                  </div>
                </section>

                <section className="space-y-1">
                  <p className="text-label flex items-center gap-1.5 mb-2">
                    <Zap size={12} />
                    Data
                  </p>
                  <div className="card p-3 space-y-3">
                    <div>
                      <label className="text-xs text-[var(--color-text-muted)]">Refresh cadence</label>
                      <select
                        className="input-field w-full mt-1 text-sm"
                        defaultValue="30"
                        disabled
                      >
                        <option value="15">Every 15s</option>
                        <option value="30">Every 30s</option>
                        <option value="60">Every 60s</option>
                      </select>
                    </div>
                    <Toggle label="Auto-rescore on load" defaultOn />
                    <Toggle label="Prefer CoinGecko Pro" defaultOn />
                  </div>
                </section>

                <section className="space-y-1">
                  <p className="text-label flex items-center gap-1.5 mb-2">
                    <Bell size={12} />
                    Alerts
                  </p>
                  <div className="card p-3 divide-y divide-[var(--color-border)]">
                    <Toggle label="Rug risk spikes" />
                    <Toggle label="New CEX listings" />
                    <Toggle label="GitHub activity drops" />
                  </div>
                </section>

                <section className="space-y-1">
                  <p className="text-label flex items-center gap-1.5 mb-2">
                    <Gauge size={12} />
                    Scoring
                  </p>
                  <div className="card p-3 divide-y divide-[var(--color-border)]">
                    <Toggle label="Strict contract validation" defaultOn />
                    <Toggle label="Show X risk when on CG" defaultOn />
                    <Toggle label="Minimum rug risk floor" defaultOn />
                  </div>
                </section>
              </motion.div>

              <div className="shrink-0 px-5 py-4 border-t border-[var(--color-border)] flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <Moon size={12} />
                OKX × XAgent hackathon
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
