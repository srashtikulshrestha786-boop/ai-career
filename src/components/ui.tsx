import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export function GlassCard({ children, className = '', glow = '' }: { children: ReactNode; className?: string; glow?: string }) {
  return (
    <div className={`glass rounded-2xl ${glow} ${className}`}>{children}</div>
  );
}

export function ScoreRing({ score, size = 160, label = 'ATS Score' }: { score: number; size?: number; label?: string }) {
  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? '#22c55e' : score >= 55 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-slate-400 mt-1">{label}</span>
      </div>
    </div>
  );
}

export function Badge({ children, variant = 'default' }: { children: ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' | 'purple' }) {
  const styles: Record<string, string> = {
    default: 'bg-electric-500/15 text-electric-400 border-electric-500/30',
    success: 'bg-green-500/15 text-green-400 border-green-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    danger: 'bg-red-500/15 text-red-400 border-red-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[variant]}`}>
      {children}
    </span>
  );
}

export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div className="inline-block animate-spin rounded-full border-2 border-electric-500/30 border-t-electric-500" style={{ width: size, height: size }} />
  );
}

export function Button({ children, onClick, type = 'button', disabled, variant = 'primary', className = '' }: {
  children: ReactNode; onClick?: () => void; type?: 'button' | 'submit';
  disabled?: boolean; variant?: 'primary' | 'ghost' | 'outline'; className?: string;
}) {
  const styles: Record<string, string> = {
    primary: 'bg-gradient-to-r from-electric-600 to-purple-600 hover:from-electric-500 hover:to-purple-500 text-white shadow-lg shadow-electric-500/20',
    ghost: 'bg-white/5 hover:bg-white/10 text-slate-200',
    outline: 'border border-electric-500/40 hover:bg-electric-500/10 text-electric-400',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`px-4 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Input({ label, value, onChange, placeholder, type = 'text', error }: {
  label?: string; value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; error?: string;
}) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full px-4 py-2.5 rounded-xl bg-charcoal-800/60 border text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-electric-500/60 focus:ring-2 focus:ring-electric-500/20 ${error ? 'border-red-500/50' : 'border-white/10'}`} />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

export function Textarea({ label, value, onChange, placeholder, rows = 4, error }: {
  label?: string; value: string; onChange: (v: string) => void; placeholder?: string;
  rows?: number; error?: string;
}) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>}
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className={`w-full px-4 py-2.5 rounded-xl bg-charcoal-800/60 border text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-electric-500/60 focus:ring-2 focus:ring-electric-500/20 resize-none ${error ? 'border-red-500/50' : 'border-white/10'}`} />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

export function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`w-full h-2 rounded-full bg-white/10 overflow-hidden ${className}`}>
      <motion.div
        className="h-full bg-gradient-to-r from-electric-500 to-purple-500 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}
