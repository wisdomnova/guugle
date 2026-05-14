'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className, ...props }: CardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        'bg-bg-card border border-border-dim rounded-xl p-6 backdrop-blur-sm overflow-hidden relative group',
        className
      )}
      {...props}
    >
      {/* Glossy overlay effect inspired by claude ui */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {children}
    </motion.div>
  );
};

export const Badge = ({ children, variant = 'default', className }: { 
  children: React.ReactNode; 
  variant?: 'default' | 'outline' | 'accent' | 'risk-low' | 'risk-high';
  className?: string;
}) => {
  const variants = {
    default: 'bg-white/10 text-text-primary',
    outline: 'border border-border-dim text-text-muted',
    accent: 'bg-accent/20 text-accent border border-accent/30',
    'risk-low': 'bg-green-500/20 text-green-400 border border-green-500/30',
    'risk-high': 'bg-red-500/20 text-red-400 border border-red-500/30',
  };

  return (
    <span className={cn('px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider', variants[variant], className)}>
      {children}
    </span>
  );
};

export const Metric = ({ label, value, trend }: { label: string; value: string; trend?: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">{label}</span>
    <div className="flex items-baseline gap-2">
      <span className="text-xl font-mono font-bold text-text-primary">{value}</span>
      {trend && <span className="text-[10px] text-accent font-mono">{trend}</span>}
    </div>
  </div>
);
