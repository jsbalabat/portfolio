import { useState, useEffect, useCallback } from 'react';

type LensType = 'architecture' | 'product' | 'tldr' | 'standard';

export default function PersonaLensSplash() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user already passed the gate in this session
    const passed = sessionStorage.getItem('portfolio_gate_passed');
    if (!passed) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    }

    const handleReopen = () => {
      setIsExiting(false);
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    };

    window.addEventListener('open-splash-gate', handleReopen);
    return () => {
      window.removeEventListener('open-splash-gate', handleReopen);
      document.body.style.overflow = '';
    };
  }, []);

  const handleSelectLens = useCallback((lens: LensType) => {
    setIsExiting(true);
    sessionStorage.setItem('portfolio_gate_passed', 'true');
    sessionStorage.setItem('portfolio_selected_lens', lens);

    // Apply lens action
    if (lens === 'tldr') {
      localStorage.setItem('portfolio_tldr_active', 'true');
      document.body.classList.add('tldr-active');
      window.dispatchEvent(new Event('tldr-state-change'));
    }

    setTimeout(() => {
      setIsVisible(false);
      document.body.style.overflow = '';

      if (lens === 'architecture') {
        const target = document.getElementById('architecture') || document.getElementById('skills');
        target?.scrollIntoView({ behavior: 'smooth' });
      } else if (lens === 'product') {
        const target = document.getElementById('work');
        target?.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 320);
  }, []);

  // Keyboard accessibility
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') {
        e.preventDefault();
        handleSelectLens('architecture');
      } else if (e.key === '2') {
        e.preventDefault();
        handleSelectLens('product');
      } else if (e.key === '3') {
        e.preventDefault();
        handleSelectLens('tldr');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleSelectLens('standard');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, handleSelectLens]);

  if (!mounted || !isVisible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome and perspective selector"
      className={`fixed inset-0 z-50 flex flex-col justify-between bg-bg/95 backdrop-blur-xl text-text p-6 sm:p-10 md:p-12 overflow-y-auto transition-all duration-300 ${
        isExiting
          ? '-translate-y-8 opacity-0 pointer-events-none'
          : 'translate-y-0 opacity-100'
      }`}
    >
      {/* Top Header Bar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between pb-6 border-b border-border/60">
        <div className="flex items-center gap-2 font-mono text-xs text-text-muted">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="font-bold text-sm tracking-tight text-text">Marc Balabat</span>
          <span className="text-text-muted/60">/</span>
          <span>Full-Stack Systems Engineer</span>
        </div>

        <button
          type="button"
          onClick={() => handleSelectLens('standard')}
          className="group flex items-center gap-2 text-xs font-mono text-text-muted hover:text-text px-3 py-1.5 rounded-lg border border-border/70 hover:border-border bg-surface hover:bg-surface-raised active:scale-[0.96] transition-all cursor-pointer"
        >
          <span>Skip to portfolio</span>
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-surface-raised border border-border/60 text-text-muted">
            ESC
          </kbd>
        </button>
      </header>

      {/* Center Interactive Bento Selection */}
      <main className="w-full max-w-5xl mx-auto my-auto py-8 sm:py-12">
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-border/80 bg-surface text-xs font-mono text-accent mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>Interactive Entry Gate • Select your focus</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-text text-balance">
            How would you like to evaluate my work?
          </h1>
          <p className="mt-3 text-sm sm:text-base text-text-muted max-w-2xl leading-relaxed">
            Choose the perspective that best fits your evaluation goal. This tailors initial highlights and routes you straight to the most relevant engineering proofs.
          </p>
        </div>

        {/* 3 Interactive Persona Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Option 1: Architecture & Systems */}
          <button
            type="button"
            onClick={() => handleSelectLens('architecture')}
            className="group text-left p-6 sm:p-7 rounded-2xl border border-border bg-surface hover:bg-surface-raised hover:border-accent/60 hover:shadow-lg transition-all duration-200 active:scale-[0.96] flex flex-col justify-between cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-accent font-semibold px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
                  Lens 1
                </span>
                <kbd className="text-[10px] font-mono text-text-muted px-1.5 py-0.5 rounded bg-surface-raised border border-border/80">
                  1
                </kbd>
              </div>
              <h2 className="text-lg font-bold text-text mb-2 group-hover:text-accent transition-colors">
                Architecture & Engineering
              </h2>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed mb-6">
                Deep dive into offline-first sync engines, schema normalization migrations, relational integrity, and edge runtimes.
              </p>
            </div>
            <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs font-mono text-accent font-medium">
              <span>Enter Architecture & Stack</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>

          {/* Option 2: Commercial & Product Impact */}
          <button
            type="button"
            onClick={() => handleSelectLens('product')}
            className="group text-left p-6 sm:p-7 rounded-2xl border border-border bg-surface hover:bg-surface-raised hover:border-accent/60 hover:shadow-lg transition-all duration-200 active:scale-[0.96] flex flex-col justify-between cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-accent font-semibold px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
                  Lens 2
                </span>
                <kbd className="text-[10px] font-mono text-text-muted px-1.5 py-0.5 rounded bg-surface-raised border border-border/80">
                  2
                </kbd>
              </div>
              <h2 className="text-lg font-bold text-text mb-2 group-hover:text-accent transition-colors">
                Product & Commercial Impact
              </h2>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed mb-6">
                Sole developer replacing manual Excel billing for 6 companies, clearing 150 invoices/day across 3 shipped applications.
              </p>
            </div>
            <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs font-mono text-accent font-medium">
              <span>Enter Case Studies & ROI</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>

          {/* Option 3: Executive 30s TLDR */}
          <button
            type="button"
            onClick={() => handleSelectLens('tldr')}
            className="group text-left p-6 sm:p-7 rounded-2xl border border-border bg-surface hover:bg-surface-raised hover:border-accent/60 hover:shadow-lg transition-all duration-200 active:scale-[0.96] flex flex-col justify-between cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-accent font-semibold px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
                  Lens 3
                </span>
                <kbd className="text-[10px] font-mono text-text-muted px-1.5 py-0.5 rounded bg-surface-raised border border-border/80">
                  3
                </kbd>
              </div>
              <h2 className="text-lg font-bold text-text mb-2 group-hover:text-accent transition-colors">
                Executive 30s TLDR
              </h2>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed mb-6">
                Fast recruiter scan: 650+ verified Git commits over 14 months, core metrics, and automated high-signal TLDR mode enabled.
              </p>
            </div>
            <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs font-mono text-accent font-medium">
              <span>Initialize TLDR Mode</span>
              <span className="group-hover:translate-x-1 transition-transform">⚡</span>
            </div>
          </button>
        </div>
      </main>

      {/* Bottom Footer Telemetry */}
      <footer className="w-full max-w-5xl mx-auto pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-text-muted">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Session memory active • Choice persisted for this session</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Keyboard shortcuts:</span>
          <span className="text-text font-medium">[1] Stack</span>
          <span className="text-text-muted/40">•</span>
          <span className="text-text font-medium">[2] Case Studies</span>
          <span className="text-text-muted/40">•</span>
          <span className="text-text font-medium">[3] TLDR</span>
          <span className="text-text-muted/40">•</span>
          <span className="text-text font-medium">[ESC] Bypass</span>
        </div>
      </footer>
    </div>
  );
}
