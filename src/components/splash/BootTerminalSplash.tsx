import { useState, useEffect, useCallback } from 'react';

export default function BootTerminalSplash() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const passed = sessionStorage.getItem('portfolio_gate_passed');
    if (!passed) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    }

    const handleReopen = () => {
      setIsExiting(false);
      setIsLaunching(false);
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    };

    window.addEventListener('open-splash-gate', handleReopen);
    return () => {
      window.removeEventListener('open-splash-gate', handleReopen);
      document.body.style.overflow = '';
    };
  }, []);

  const triggerLaunch = useCallback(() => {
    if (isLaunching) return;
    setIsLaunching(true);
    sessionStorage.setItem('portfolio_gate_passed', 'true');

    setTimeout(() => {
      setIsExiting(true);
    }, 220);

    setTimeout(() => {
      setIsVisible(false);
      document.body.style.overflow = '';
    }, 500);
  }, [isLaunching]);

  // Global keyboard shortcut: Enter, Space, or Escape
  useEffect(() => {
    if (!isVisible || isLaunching) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        triggerLaunch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, isLaunching, triggerLaunch]);

  if (!mounted || !isVisible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Engineering boot terminal splash gate"
      className={`fixed inset-0 z-50 flex flex-col justify-between bg-bg/95 backdrop-blur-2xl text-text p-6 sm:p-10 md:p-12 overflow-y-auto select-none transition-all duration-300 ease-out ${
        isExiting
          ? 'scale-105 opacity-0 pointer-events-none'
          : 'scale-100 opacity-100'
      }`}
    >
      {/* Top Bar */}
      <header className="w-full max-w-2xl mx-auto flex items-center justify-between pb-6 border-b border-border/60">
        <div className="flex items-center gap-2 font-mono text-xs text-text-muted">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="font-bold text-sm tracking-tight text-text">Marc Balabat</span>
          <span className="text-text-muted/60">/</span>
          <span>Full-Stack CLI Initializer</span>
        </div>

        <button
          type="button"
          onClick={triggerLaunch}
          className="flex items-center gap-2 text-xs font-mono text-text-muted hover:text-text px-3 py-1.5 rounded-lg border border-border/70 hover:border-border bg-surface hover:bg-surface-raised active:scale-[0.96] transition-all cursor-pointer"
        >
          <span>Skip Launch</span>
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-surface-raised border border-border/60 text-text-muted">
            ESC
          </kbd>
        </button>
      </header>

      {/* Centered Terminal Card */}
      <main className="w-full max-w-2xl mx-auto my-auto py-8">
        <div className="rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden font-mono">
          {/* Terminal Titlebar */}
          <div className="px-4 py-3 bg-surface-raised border-b border-border/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <div className="text-xs text-text-muted font-medium">
              marc@edge-workers:~ (zsh)
            </div>
            <div className="text-[11px] text-accent font-medium">
              Astro 5 + Edge
            </div>
          </div>

          {/* Terminal Content Body */}
          <div className="p-6 sm:p-8 space-y-4 text-xs sm:text-sm text-text leading-relaxed">
            <div className="flex items-center gap-2 text-text font-semibold">
              <span className="text-accent">$</span>
              <span>marc-sys --init --env=production</span>
            </div>

            <div className="space-y-1.5 text-text-muted text-xs sm:text-[13px] pl-2 border-l border-accent/40">
              <div className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Edge Runtime: Connected (Cloudflare Workers)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Commercial Work: 6 companies, 150 invoices/day replacing Excel</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Engineering Record: 650+ verified Git commits across 14 months</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Architecture Diff: Interactive schema engine mounted</span>
              </div>
            </div>

            {/* Launch Status Prompt */}
            <div className="pt-3 border-t border-border/60">
              <div className="flex items-center gap-2 text-text font-mono text-xs mb-4">
                <span className="text-accent font-bold">❯</span>
                {isLaunching ? (
                  <span className="text-emerald-400 font-bold animate-pulse">
                    Launching workspace... Done.
                  </span>
                ) : (
                  <span>System ready. Click button or press <kbd className="px-1.5 py-0.5 rounded bg-surface-raised border border-border text-accent font-bold">↵ Enter</kbd> to launch:</span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={triggerLaunch}
                  disabled={isLaunching}
                  className="flex-1 py-3 px-6 rounded-xl bg-accent text-accent-text hover:opacity-90 active:scale-[0.96] transition-all font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <span>Launch Portfolio Workspace</span>
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-black/20">↵ Enter</span>
                </button>

                <button
                  type="button"
                  onClick={triggerLaunch}
                  disabled={isLaunching}
                  className="py-3 px-4 rounded-xl border border-border hover:bg-surface-raised active:scale-[0.96] transition-all text-xs font-mono text-text-muted hover:text-text text-center cursor-pointer"
                >
                  Direct Scan (ESC)
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Telemetry Bar */}
      <footer className="w-full max-w-2xl mx-auto pt-6 border-t border-border/60 flex items-center justify-between text-xs font-mono text-text-muted">
        <span>Cloudflare Workers Runtime • Verified Commit Tree</span>
        <span>Keyboard: Press [Enter] or [Space]</span>
      </footer>
    </div>
  );
}
