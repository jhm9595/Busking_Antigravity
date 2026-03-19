'use client'

import { RefreshCcw, X } from 'lucide-react'

interface DemoBannerProps {
  onReset: () => void
  onDismiss: () => void
  isResetting: boolean
}

export function DemoBanner({ onReset, onDismiss, isResetting }: DemoBannerProps) {
  return (
    <div className="mb-4 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wide text-primary">Demo Mode</p>
          <p className="text-xs text-foreground/70">Sample performances are loaded for review.</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onReset}
            disabled={isResetting}
            aria-busy={isResetting}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            {isResetting ? 'Resetting...' : 'Reset Demo'}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss demo banner"
            className="rounded-full p-1 text-foreground/60 hover:bg-background/70 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
