import { useState, useEffect, useRef, useCallback } from 'react';

export default function SystemHandshakeSplash() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Slider state
  const [sliderProgress, setSliderProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  // Hold-to-enter state
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const passed = sessionStorage.getItem('portfolio_gate_passed');
    if (!passed) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    }

    const handleReopen = () => {
      setIsExiting(false);
      setIsUnlocked(false);
      setSliderProgress(0);
      setHoldProgress(0);
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    };

    window.addEventListener('open-splash-gate', handleReopen);
    return () => {
      window.removeEventListener('open-splash-gate', handleReopen);
      document.body.style.overflow = '';
    };
  }, []);

  const triggerUnlock = useCallback(() => {
    setIsUnlocked(true);
    sessionStorage.setItem('portfolio_gate_passed', 'true');

    setTimeout(() => {
      setIsExiting(true);
    }, 280);

    setTimeout(() => {
      setIsVisible(false);
      document.body.style.overflow = '';
    }, 650);
  }, []);

  // Pointer drag listeners for slider
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isUnlocked) return;
    setIsDragging(true);
    startXRef.current = e.clientX - (sliderProgress * getMaxTravel());
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const getMaxTravel = () => {
    if (!trackRef.current) return 200;
    // Track width minus thumb width (44px) minus padding (12px)
    return Math.max(100, trackRef.current.clientWidth - 56);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || isUnlocked) return;
    const maxTravel = getMaxTravel();
    const currentDelta = e.clientX - startXRef.current;
    const clampedDelta = Math.max(0, Math.min(maxTravel, currentDelta));
    const progress = clampedDelta / maxTravel;
    setSliderProgress(progress);

    if (progress >= 0.88) {
      setIsDragging(false);
      setSliderProgress(1);
      triggerUnlock();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || isUnlocked) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    // Snap back if threshold not reached
    if (sliderProgress < 0.88) {
      setSliderProgress(0);
    }
  };

  // Hold-to-enter logic
  const startHold = () => {
    if (isUnlocked) return;
    const startTime = Date.now();
    const holdDuration = 550; // ms

    holdIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / holdDuration);
      setHoldProgress(progress);

      if (progress >= 1) {
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        triggerUnlock();
      }
    }, 16);
  };

  const endHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    if (!isUnlocked) {
      setHoldProgress(0);
    }
  };

  // Keyboard accessibility
  useEffect(() => {
    if (!isVisible || isUnlocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        triggerUnlock();
      } else if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        startHold();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        triggerUnlock();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        endHold();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isVisible, isUnlocked, triggerUnlock]);

  if (!mounted || !isVisible) return null;

  const maxTravel = getMaxTravel();
  const thumbTranslateX = sliderProgress * maxTravel;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="System authentication gate"
      className={`fixed inset-0 z-50 flex flex-col justify-between bg-bg/95 backdrop-blur-2xl text-text p-6 sm:p-10 md:p-12 overflow-y-auto select-none transition-all duration-500 ease-in-out ${
        isExiting
          ? '-translate-y-full opacity-0 pointer-events-none'
          : 'translate-y-0 opacity-100'
      }`}
    >
      {/* Top Telemetry Bar */}
      <header className="w-full max-w-2xl mx-auto flex items-center justify-between pb-6 border-b border-border/60">
        <div className="flex items-center gap-2 font-mono text-xs text-text-muted">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="font-bold text-sm tracking-tight text-text">Marc Balabat</span>
          <span className="text-text-muted/60">/</span>
          <span>Systems Architecture</span>
        </div>

        <button
          type="button"
          onClick={triggerUnlock}
          className="flex items-center gap-2 text-xs font-mono text-text-muted hover:text-text px-3 py-1.5 rounded-lg border border-border/70 hover:border-border bg-surface hover:bg-surface-raised active:scale-[0.96] transition-all cursor-pointer"
        >
          <span>Bypass Gate</span>
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-surface-raised border border-border/60 text-text-muted">
            ESC
          </kbd>
        </button>
      </header>

      {/* Main Console Box */}
      <main className="w-full max-w-xl mx-auto my-auto py-8">
        <div className="rounded-2xl border border-border bg-surface shadow-2xl p-6 sm:p-8 relative overflow-hidden">
          {/* Subtle accent border glow */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent" />

          {/* Console Header */}
          <div className="flex items-center justify-between pb-5 border-b border-border/60 mb-6">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-accent font-semibold block">
                Security & Verification Gate
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text mt-1">
                Production System Handshake
              </h1>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>{isUnlocked ? 'AUTHORIZED' : 'READY'}</span>
            </div>
          </div>

          {/* System Telemetry Badges */}
          <div className="grid grid-cols-3 gap-3 mb-6 font-mono">
            <div className="p-3 rounded-xl border border-border/80 bg-surface-raised text-center">
              <span className="text-[10px] uppercase text-text-muted block">Apps Online</span>
              <span className="text-lg font-bold text-text tabular-nums">3 Shipped</span>
            </div>
            <div className="p-3 rounded-xl border border-border/80 bg-surface-raised text-center">
              <span className="text-[10px] uppercase text-text-muted block">Git History</span>
              <span className="text-lg font-bold text-text tabular-nums">650+ Commits</span>
            </div>
            <div className="p-3 rounded-xl border border-border/80 bg-surface-raised text-center">
              <span className="text-[10px] uppercase text-text-muted block">Sole Engineer</span>
              <span className="text-lg font-bold text-text tabular-nums">14 Months</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-text-muted leading-relaxed mb-6">
            Replacing manual Excel workflows with high-integrity distributed systems. Complete the interaction below to initialize the workspace.
          </p>

          {/* Interactive Slide-to-Unlock Component */}
          <div className="space-y-4">
            <div
              ref={trackRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`h-14 rounded-xl border relative overflow-hidden flex items-center p-1.5 touch-none select-none transition-colors cursor-grab active:cursor-grabbing ${
                isUnlocked
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-border/90 bg-surface-raised'
              }`}
            >
              {/* Dynamic Fill Bar */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-accent/25 border-r border-accent transition-none"
                style={{ width: `${sliderProgress * 100}%` }}
              />

              {/* Slider Track Prompt Text */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-mono text-text-muted">
                {isUnlocked ? (
                  <span className="text-emerald-400 font-bold tracking-wider animate-pulse">
                    ✓ ACCESS GRANTED • INITIALIZING...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>Slide to access workspace</span>
                    <span className="text-accent animate-bounce">➔</span>
                  </span>
                )}
              </div>

              {/* Slider Knob Thumb */}
              <div
                className={`w-11 h-11 rounded-lg flex items-center justify-center font-bold text-sm shadow-md transition-transform duration-75 relative z-10 ${
                  isUnlocked
                    ? 'bg-emerald-500 text-white'
                    : 'bg-accent text-accent-text active:scale-95'
                }`}
                style={{
                  transform: `translateX(${thumbTranslateX}px)`,
                }}
              >
                {isUnlocked ? '✓' : '➔'}
              </div>
            </div>

            {/* Alternative Hold-to-Enter Option */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onMouseDown={startHold}
                onMouseUp={endHold}
                onMouseLeave={endHold}
                onTouchStart={startHold}
                onTouchEnd={endHold}
                className="relative overflow-hidden flex-1 py-2.5 px-4 rounded-xl border border-border hover:border-accent/60 bg-surface hover:bg-surface-raised active:scale-[0.96] text-xs font-mono text-text font-medium transition-all text-center cursor-pointer"
              >
                {/* Hold Progress Fill */}
                <div
                  className="absolute inset-0 bg-accent/20 transition-all duration-75"
                  style={{ width: `${holdProgress * 100}%` }}
                />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span>Hold to enter ({Math.round(holdProgress * 100)}%)</span>
                </span>
              </button>

              <button
                type="button"
                onClick={triggerUnlock}
                className="py-2.5 px-4 rounded-xl border border-border/80 hover:border-border bg-surface hover:bg-surface-raised active:scale-[0.96] text-xs font-mono text-text-muted hover:text-text transition-all cursor-pointer"
              >
                Press <kbd className="font-semibold text-text">↵ Enter</kbd>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Telemetry Bar */}
      <footer className="w-full max-w-2xl mx-auto pt-6 border-t border-border/60 flex items-center justify-between text-xs font-mono text-text-muted">
        <span>Cloudflare Workers Runtime • Edge Verified</span>
        <span>Drag slider or press Space/Enter</span>
      </footer>
    </div>
  );
}
