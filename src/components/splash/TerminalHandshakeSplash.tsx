import { useState, useEffect, useRef, useCallback } from 'react';

const BOOT_SCRIPT_LINES = [
  'booting vmlinuz-6.8.0-edge (x86_64)...',
  '[  0.012491] Initializing V8 isolate runtime... OK',
  '[  0.048102] Loading ACPI tables and hardware drivers... OK',
  '[  0.089410] Mounting rootfs /dev/cf-workers0 (read-only)... OK',
  '[  0.134820] Initializing network stack: IPv4/IPv6 socket layer... OK',
  '[  0.189201] Launching systemd-handshake.service: socket listening... OK',
  '[  0.241032] Reached target System Initialization.',
];

type ActivationStage = 'booting' | 'power_rail' | 'power_knob' | 'ready';

export default function TerminalHandshakeSplash() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Typewriter animation state
  const [completedLines, setCompletedLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentLineText, setCurrentLineText] = useState('');
  const [isBootComplete, setIsBootComplete] = useState(false);

  // Staggered uneven activation
  const [activationStage, setActivationStage] = useState<ActivationStage>('booting');

  // Slider & Hold state
  const [sliderProgress, setSliderProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  const trackRef = useRef<HTMLDivElement>(null);
  const holdTimerRef = useRef<number | null>(null);
  const holdStartTimeRef = useRef<number | null>(null);

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
      setIsAtEnd(false);
      setHoldProgress(0);
      setCompletedLines([]);
      setCurrentLineIndex(0);
      setCurrentLineText('');
      setIsBootComplete(false);
      setActivationStage('booting');
      setIsVisible(true);
      document.documentElement.classList.add('splash-locked');
    };

    window.addEventListener('open-splash-gate', handleReopen);
    return () => {
      window.removeEventListener('open-splash-gate', handleReopen);
    };
  }, []);

  // Unlock sequence
  const triggerUnlock = useCallback(() => {
    if (isUnlocked) return;
    setIsUnlocked(true);
    sessionStorage.setItem('portfolio_unlocked', 'true');

    // Remove lockout class to reveal background content
    document.documentElement.classList.remove('splash-locked');

    setTimeout(() => {
      setIsExiting(true);
    }, 280);

    setTimeout(() => {
      setIsVisible(false);
    }, 600);
  }, [isUnlocked]);

  // Bypass directly
  const handleBypass = useCallback(() => {
    triggerUnlock();
  }, [triggerUnlock]);

  // Typewriter streaming effect (left to right character stream)
  useEffect(() => {
    if (!isVisible || isBootComplete) return;

    if (currentLineIndex >= BOOT_SCRIPT_LINES.length) {
      setIsBootComplete(true);
      return;
    }

    const targetLine = BOOT_SCRIPT_LINES[currentLineIndex];

    if (currentLineText.length < targetLine.length) {
      // Stream characters at high terminal cadence
      const charChunk = targetLine.slice(0, currentLineText.length + 3);
      const timer = window.setTimeout(() => {
        setCurrentLineText(charChunk);
      }, 12);
      return () => window.clearTimeout(timer);
    } else {
      // Line complete: add to completed lines, brief pause, advance to next
      const timer = window.setTimeout(() => {
        setCompletedLines((prev) => [...prev, targetLine]);
        setCurrentLineText('');
        setCurrentLineIndex((prev) => prev + 1);
      }, 65);
      return () => window.clearTimeout(timer);
    }
  }, [isVisible, isBootComplete, currentLineIndex, currentLineText]);

  // Staggered / uneven activation of controls once boot completes
  useEffect(() => {
    if (!isBootComplete) return;

    // Stage 1: Power the slider rail
    const t1 = window.setTimeout(() => {
      setActivationStage('power_rail');
    }, 120);

    // Stage 2: Power the slider knob
    const t2 = window.setTimeout(() => {
      setActivationStage('power_knob');
    }, 280);

    // Stage 3: Enable bypass and flip ready status
    const t3 = window.setTimeout(() => {
      setActivationStage('ready');
    }, 440);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [isBootComplete]);

  // Handle pointer drag physics for slider
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activationStage !== 'ready' || isUnlocked) return;
    setIsDragging(true);
    updateSliderPosition(e.clientX);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const updateSliderPosition = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const thumbWidth = 44;
    const padding = 4;
    const maxTravel = rect.width - thumbWidth - padding * 2;
    const pointerOffset = clientX - rect.left - padding - thumbWidth / 2;
    const clampedOffset = Math.max(0, Math.min(maxTravel, pointerOffset));
    const progress = maxTravel > 0 ? clampedOffset / maxTravel : 0;

    setSliderProgress(progress);

    // Check if slider reached the far right (>= 96%)
    if (progress >= 0.96) {
      if (!isAtEnd) {
        setIsAtEnd(true);
        startHold();
      }
    } else {
      if (isAtEnd) {
        setIsAtEnd(false);
        cancelHold();
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || isUnlocked) return;
    updateSliderPosition(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || isUnlocked) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // If released before hold completed, snap back to origin
    cancelHold();
    setIsAtEnd(false);
    setSliderProgress(0);
  };

  // Hold action that takes place strictly after sliding left to right
  const startHold = () => {
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    holdStartTimeRef.current = Date.now();
    const holdDuration = 450; // ms

    holdTimerRef.current = window.setInterval(() => {
      if (!holdStartTimeRef.current) return;
      const elapsed = Date.now() - holdStartTimeRef.current;
      const progress = Math.min(1, elapsed / holdDuration);
      setHoldProgress(progress);

      if (progress >= 1) {
        if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
        triggerUnlock();
      }
    }, 16);
  };

  const cancelHold = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    holdStartTimeRef.current = null;
    if (!isUnlocked) {
      setHoldProgress(0);
    }
  };

  // Keyboard shortcuts (Escape to bypass anytime)
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleBypass();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, handleBypass]);

  if (!mounted || !isVisible) return null;

  const trackWidth = trackRef.current ? trackRef.current.clientWidth : 500;
  const thumbWidth = 44;
  const padding = 4;
  const maxTravel = Math.max(100, trackWidth - thumbWidth - padding * 2);
  const currentThumbX = sliderProgress * maxTravel;

  const isRailPowered = activationStage === 'power_rail' || activationStage === 'power_knob' || activationStage === 'ready';
  const isKnobPowered = activationStage === 'power_knob' || activationStage === 'ready';
  const isFullyReady = activationStage === 'ready';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Engineering boot terminal handshake"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-bg p-4 sm:p-6 select-none overflow-hidden transition-all duration-300 ease-out ${
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
            ) : isFullyReady ? (
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

        {/* Terminal Log Output (Typewriter Left to Right) */}
        <div className="p-5 sm:p-6 space-y-1.5 text-xs min-h-[210px] flex flex-col justify-start">
          {completedLines.map((line, idx) => (
            <div key={idx} className="text-text-muted leading-relaxed font-mono">
              {line}
            </div>
          ))}

          {/* Currently Typing Line with Blinking Cursor */}
          {!isBootComplete && (
            <div className="text-text font-mono leading-relaxed flex items-center gap-0.5">
              <span>{currentLineText}</span>
              <span className="inline-block w-2 h-3.5 bg-accent animate-pulse ml-0.5" />
            </div>
          )}

          {/* Prompt Status Once Boot Sequence Finishes */}
          {isBootComplete && (
            <div className="pt-2 flex items-center gap-2 text-xs font-mono">
              <span className="text-accent font-bold">❯</span>
              {isUnlocked ? (
                <span className="text-emerald-400 font-bold">
                  Handshake verified. Launching workspace...
                </span>
              ) : (
                <span className="text-text flex items-center gap-1">
                  <span>Slide right and hold to authenticate:</span>
                  <span className="inline-block w-2 h-3.5 bg-accent animate-pulse" />
                </span>
              )}
            </div>
          )}
        </div>

        {/* Handshake Panel with Uneven Activation & Slide-then-Hold */}
        <div className="p-4 sm:p-5 bg-surface/50 border-t border-border/80 flex flex-col gap-3">
          {/* Slider Rail */}
          <div
            ref={trackRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`h-12 rounded-xl border relative overflow-hidden flex items-center p-1 select-none transition-colors duration-200 ${
              !isRailPowered
                ? 'opacity-30 border-border/40 bg-surface-raised/30 pointer-events-none cursor-not-allowed'
                : isUnlocked
                ? 'border-emerald-500 bg-emerald-500/10'
                : isFullyReady
                ? 'border-border bg-surface-raised cursor-grab active:cursor-grabbing hover:border-accent/60'
                : 'border-border/60 bg-surface-raised/60'
            }`}
          >
            {/* Dynamic Slider Progress Fill (100% synced with thumb position) */}
            <div
              className={`absolute top-0 bottom-0 left-0 border-r transition-none ${
                isUnlocked
                  ? 'bg-emerald-500/20 border-emerald-500'
                  : 'bg-accent/25 border-accent'
              }`}
              style={{
                width: isDragging || isAtEnd ? `${currentThumbX + thumbWidth / 2}px` : '0px',
                transition: isDragging ? 'none' : 'width 0.25s ease-out',
              }}
            />

            {/* Slider Track Static Prompt Text (No bouncing arrow) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-mono">
              {!isFullyReady ? (
                <span className="text-text-muted/50 text-[11px]">
                  [ System initializing... handshake offline ]
                </span>
              ) : isUnlocked ? (
                <span className="text-emerald-400 font-bold tracking-wider">
                  ✓ HANDSHAKE ACCEPTED
                </span>
              ) : isAtEnd ? (
                <span className="text-accent font-bold tracking-wide">
                  Hold to authenticate ({Math.round(holdProgress * 100)}%)
                </span>
              ) : (
                <span className="text-text-muted flex items-center gap-2">
                  <span>Slide right and hold</span>
                  <span className="text-accent">➔</span>
                </span>
              )}
            </div>

            {/* Slider Knob */}
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs shadow-md relative z-10 select-none ${
                !isKnobPowered
                  ? 'bg-border/60 text-text-muted/40 cursor-not-allowed'
                  : isUnlocked
                  ? 'bg-emerald-500 text-white'
                  : isAtEnd
                  ? 'bg-accent text-accent-text ring-2 ring-accent/60 scale-105'
                  : 'bg-accent text-accent-text hover:brightness-105'
              }`}
              style={{
                transform: `translateX(${currentThumbX}px)`,
                transition: isDragging ? 'none' : 'transform 0.25s ease-out',
              }}
            >
              {isUnlocked ? '✓' : isAtEnd ? `${Math.round(holdProgress * 100)}%` : '➔'}
            </div>
          </div>

          {/* Controls Row: Live Hold State + Far-Right Bypass Button (Enter button removed) */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="text-[11px] font-mono text-text-muted flex items-center gap-2">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isUnlocked
                    ? 'bg-emerald-400'
                    : isAtEnd
                    ? 'bg-accent animate-ping'
                    : isFullyReady
                    ? 'bg-emerald-400'
                    : 'bg-text-muted/40'
                }`}
              />
              <span>
                {isUnlocked
                  ? 'Access authorized'
                  : isAtEnd
                  ? 'Holding latch...'
                  : isFullyReady
                  ? 'Slide to right end to trigger hold'
                  : 'Awaiting boot sequence'}
              </span>
            </div>

            {/* Far-Right Bypass Button */}
            <button
              type="button"
              onClick={handleBypass}
              className={`ml-auto px-3.5 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center gap-2 ${
                isFullyReady
                  ? 'border-border/80 bg-surface hover:bg-surface-raised active:scale-[0.96] text-text-muted hover:text-text'
                  : 'opacity-40 border-border/40 text-text-muted/50 hover:opacity-70'
              }`}
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
