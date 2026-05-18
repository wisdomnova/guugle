'use client';

import { ReactNode } from 'react';
import { Hexagon } from 'lucide-react';
import { SettingsDrawer } from './settings-drawer';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-bg min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]/80 backdrop-blur-xl">
        <div className="container-app flex items-center justify-between h-14 md:h-16">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-accent-soft)] border border-[rgba(34,211,238,0.25)]">
              <Hexagon size={16} className="text-[var(--color-accent)]" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold tracking-tight text-[var(--color-text-primary)]">
                Guugle
              </span>
              <span className="text-[10px] font-mono text-[var(--color-text-muted)] tracking-wider uppercase">
                Token Intel
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <span className="hidden sm:inline-flex badge badge-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
              Live
            </span>
            <SettingsDrawer />
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-[var(--color-border)] py-6 mt-8">
        <div className="container-app flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--color-text-muted)]">
          <span>Powered by OKX Suite · Etherscan · CoinGecko</span>
          <span className="font-mono">Build with XAgent × OKX</span>
        </div>
      </footer>
    </div>
  );
}
