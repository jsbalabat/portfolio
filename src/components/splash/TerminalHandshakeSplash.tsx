import { useState, useEffect, useRef, useCallback } from 'react';

interface BootLog {
  id: number;
  command?: boolean;
  text: string;
  status?: string;
  delayMs: number;
}

const BOOT_LOGS: BootLog[] = [
  { id: 1, command: true, text: 'marc-sys --init --env=production', delayMs: 120 },
  { id: 2, text: 'Edge runtime: connected (Cloudflare Workers Edge)', status: 'OK', delayMs: 260 },
  { id: 3, text: 'Commercial systems: 3 apps · 6 companies · 150 invoices/day', status: 'OK', delayMs: 280 },
  { id: 4, text: 'Engineering history: 650+ verified commits across 14 months', status: 'OK', delayMs: 260 },
  { id: 5, text: 'Schema engine: relational migrations normalized & online', status: 'OK', delayMs: 240 },
];

export default function TerminalHandshakeSplash() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Boot animation state
  const [displayedLogs, setDisplayedLogs] = useState<BootLog[]>([]);
  const [isBootComplete, setIsBootComplete] = useState(false);

  // Slider state
  const [sliderProgress, setSliderProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  // Hold-to-enter state
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<number | null>(null);

  // Initialize and check sessionStorage
  useEffect(() => {
    setMounted(true);
    const unlocked = sessionStorage.getItem('portfolio_unlocked') === 'true';

    if (!unlocked) {
      setIsVisible(true);
      document.documentElement.classList.add('splash-locked');
    } else {
      document.documentElement.classList.remove('splash-locked');
    }

    const handleReopen = () => {
      setIsExiting(false);
      setIsUnlocked(false);
      setSliderProgress(0);
      setHoldProgress(0);
      setIsVisible(true);
      document.documentElement.classList.add('splash-locked');
    };

    window.addEventListener('open-splash-gate', handleReopen);
    return () => {
      window.removeEventListener('open-splash-gate', handleReopen);
    };
  }, []);

  // Run sequential booting animation
  useEffect(() => {
    if (!isVisible || isBootComplete) return;

    let currentIndex = 0;
    let timeoutId: number;

    const scheduleNextLog = () => {
      if (currentIndex < BOOT_LOGS.length) {
        const nextLog = BOOT_LOGS[currentIndex];
        timeoutId = window.setTimeout(() => {
          setDisplayedLogs((prev) => [...prev, nextLog]);
          currentIndex++;
          scheduleNextLog();
        }, nextLog.delayMs);
      } else {
        // Final transition to ready state
        timeoutId = window.setTimeout(() => {
          setIsBootComplete(true);
        }, 250);
      }
    };

    scheduleNextLog();

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isVisible, isBootComplete]);

  // Unlock sequence
  const triggerUnlock = useCallback(() => {
    if (isUnlocked) return;
    setIsUnlocked(true);
    sessionStorage.setItem('portfolio_unlocked', 'true');

    // Remove lockout class to unveil background content smoothly
    document.documentElement.classList.remove('splash-locked');

    setTimeout(() => {
      setIsExiting(true);
    }, 280);

    setTimeout(() => {
      setIsVisible(false);
    }, 600);
  }, [isUnlocked]);

  // Bypass immediately
  const handleBypass = useCallback(() => {
    triggerUnlock();
  }, [triggerUnlock]);

  // Slider drag mechanics
  const getMaxTravel = () => {
    if (!trackRef.current) return 200;
    return Math.max(100, trackRef.current.clientWidth - 54);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isBootComplete || isUnlocked) return;
    setIsDragging(true);
    startXRef.current = e.clientX - sliderProgress * getMaxTravel();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !isBootComplete || isUnlocked) return;
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
    if (sliderProgress < 0.88) {
      setSliderProgress(0);
    }
  };

  // Hold-to-enter mechanics
  const startHold = () => {
    if (!isBootComplete || isUnlocked) return;
    const startTime = Date.now();
    const duration = 500;

    holdIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(1, elapsed / duration);
      setHoldProgress(p);

      if (p >= 1) {
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
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleBypass();
      } else if (isBootComplete && !isUnlocked) {
        if (e.key === 'Enter') {
          e.preventDefault();
          triggerUnlock();
        } else if (e.key === ' ' && !e.repeat) {
          e.preventDefault();
          startHold();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' && isBootComplete) {
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
  }, [isVisible, isBootComplete, isUnlocked, triggerUnlock, handleBypass]);

  if (!mounted || !isVisible) return null;

  const maxTravel = getMaxTravel();
  const thumbTranslateX = sliderProgress * maxTravel;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Terminal authentication handshake"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-bg p-4 sm:p-6 md:p-8 select-none overflow-hidden transition-all duration-300 ease-out ${
        isExiting
          ? 'scale-105 opacity-0 pointer-events-none'
          : 'scale-100 opacity-100'
      }`}
    >
      {/* Terminal Window */}
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-[#0d1117] text-[#c9d1d9] shadow-2xl overflow-hidden font-mono flex flex-col">
        {/* Terminal Titlebar */}
        <div className="px-4 py-3 bg-surface-raised border-b border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block" />
          </div>
          <div className="text-xs text-text-muted font-medium">
            marc@edge-runtime:~ (zsh)
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            {isUnlocked ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                AUTHORIZED
              </span>
            ) : isBootComplete ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                READY
              </span>
            ) : (
              <span className="text-amber-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                BOOTING...
              </span>
            )}
          </div>
        </div>

        {/* Terminal Log Screen */}
        <div className="p-5 sm:p-6 space-y-2 text-xs sm:text-sm min-h-[190px] flex flex-col justify-start">
          {displayedLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 leading-relaxed">
              {log.command ? (
                <div className="flex items-center gap-2 text-text font-semibold">
                  <span className="text-accent">$</span>
                  <span>{log.text}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-text-muted">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{log.text}</span>
                </div>
              )}
            </div>
          ))}

          {/* Current cursor / prompt state */}
          <div className="pt-2 flex items-center gap-2 text-xs font-mono">
            <span className="text-accent font-bold">❯</span>
            {!isBootComplete ? (
              <span className="text-text-muted animate-pulse flex items-center gap-1">
                <span>Executing boot sequence</span>
                <span className="inline-block w-1.5 h-3 bg-accent animate-pulse" />
              </span>
            ) : isUnlocked ? (
              <span className="text-emerald-400 font-bold animate-pulse">
                Handshake verified. Launching workspace...
              </span>
            ) : (
              <span className="text-text font-medium">
                Boot sequence complete. Slide or press below to authenticate:
              </span>
            )}
          </div>
        </div>

        {/* Handshake Controls Panel */}
        <div className="p-4 sm:p-5 bg-surface/50 border-t border-border/80 flex flex-col gap-3">
          {/* Slide-to-Unlock Rail */}
          <div
            ref={trackRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`h-12 rounded-xl border relative overflow-hidden flex items-center p-1 select-none transition-all duration-300 ${
              !isBootComplete
                ? 'opacity-40 border-border/50 bg-surface-raised/40 pointer-events-none cursor-not-allowed'
                : isUnlocked
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-border bg-surface-raised cursor-grab active:cursor-grabbing hover:border-accent/60'
            }`}
          >
            {/* Dynamic Slider Progress Fill */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-accent/25 border-r border-accent transition-none"
              style={{ width: `${sliderProgress * 100}%` }}
            />

            {/* Slider Text Prompt */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-mono">
              {!isBootComplete ? (
                <span className="text-text-muted/60">
                  [ Initializing CLI... Handshake locked ]
                </span>
              ) : isUnlocked ? (
                <span className="text-emerald-400 font-bold tracking-wider animate-pulse">
                  ✓ HANDSHAKE ACCEPTED
                </span>
              ) : (
                <span className="text-text-muted flex items-center gap-2">
                  <span>Slide right to authenticate</span>
                  <span className="text-accent animate-bounce">➔</span>
                </span>
              )}
            </div>

            {/* Slider Knob */}
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs shadow-md transition-transform duration-75 relative z-10 ${
                !isBootComplete
                  ? 'bg-border text-text-muted/50 cursor-not-allowed'
                  : isUnlocked
                  ? 'bg-emerald-500 text-white'
                  : 'bg-accent text-accent-text'
              }`}
              style={{
                transform: `translateX(${thumbTranslateX}px)`,
              }}
            >
              {isUnlocked ? '✓' : '➔'}
            </div>
          </div>

          {/* Action Row: Hold/Enter Button + Far-Right Bypass Button */}
          <div className="flex items-center gap-3">
            {/* Hold to Enter / Fast Click */}
            <button
              type="button"
              disabled={!isBootComplete || isUnlocked}
              onMouseDown={startHold}
              onMouseUp={endHold}
              onMouseLeave={endHold}
              onTouchStart={startHold}
              onTouchEnd={endHold}
              className={`relative overflow-hidden py-2 px-4 rounded-xl border text-xs font-mono font-medium transition-all text-center cursor-pointer ${
                !isBootComplete || isUnlocked
                  ? 'opacity-40 border-border/50 bg-surface-raised/40 pointer-events-none cursor-not-allowed text-text-muted'
                  : 'border-border bg-surface hover:bg-surface-raised hover:border-accent/60 text-text active:scale-[0.96]'
              }`}
            >
              {/* Hold Progress Bar */}
              <div
                className="absolute inset-0 bg-accent/20 transition-all duration-75 pointer-events-none"
                style={{ width: `${holdProgress * 100}%` }}
              />
              <span className="relative z-10 flex items-center gap-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isBootComplete ? 'bg-accent animate-pulse' : 'bg-text-muted'
                  }`}
                />
                <span>Hold (0.5s)</span>
              </span>
            </button>

            {/* Quick Enter Key Hint */}
            <button
              type="button"
              disabled={!isBootComplete || isUnlocked}
              onClick={triggerUnlock}
              className={`py-2 px-3.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                !isBootComplete || isUnlocked
                  ? 'opacity-40 border-border/50 text-text-muted/50 pointer-events-none cursor-not-allowed'
                  : 'border-border/80 bg-surface hover:bg-surface-raised active:scale-[0.96] text-text-muted hover:text-text'
              }`}
            >
              Press <kbd className="font-semibold text-text">↵ Enter</kbd>
            </button>

            {/* Far-Right Bypass Button */}
            <button
              type="button"
              onClick={handleBypass}
              className="ml-auto px-3.5 py-2 rounded-xl border border-border/70 hover:border-border bg-surface hover:bg-surface-raised active:scale-[0.96] text-xs font-mono text-text-muted hover:text-text transition-all cursor-pointer flex items-center gap-2"
              title="Skip splash gate directly"
            >
              <span>Bypass</span>
              <kbd className="text-[10px] px-1 py-0.5 rounded bg-surface-raised border border-border/60 text-text-muted">
                ESC
              </kbd>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
