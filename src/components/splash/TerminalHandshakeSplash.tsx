import { useState, useEffect, useRef, useCallback } from 'react';

interface TextSpan {
  text: string;
  className?: string;
  pauseBeforeMs?: number;
}

interface BootLine {
  id: number;
  spans: TextSpan[];
  postDelayMs: number;
}

const APP_VERSION = import.meta.env.PUBLIC_APP_VERSION || '0.2.0';

const BOOT_LINES: BootLine[] = [
  {
    id: 1,
    spans: [
      { text: '[sys:boot] ', className: 'text-[#8b949e]' },
      { text: 'booting ', className: 'text-[#c9d1d9]' },
      { text: 'marcbalabat.tech', className: 'text-[#79c0ff] font-semibold' },
      { text: ' on ', className: 'text-[#8b949e]' },
      { text: 'cloudflare:edge', className: 'text-[#e3b341]' },
      { text: ` (v${APP_VERSION})...`, className: 'text-[#d2a8ff]' },
    ],
    postDelayMs: 90,
  },
  {
    id: 2,
    spans: [
      { text: '[ 0.014s ] ', className: 'text-[#58a6ff]' },
      { text: 'runtime:v8', className: 'text-[#d2a8ff] font-medium' },
      { text: ' isolate sandbox & wasm memory... ', className: 'text-[#8b949e]' },
      { text: '[ OK ]', className: 'text-[#7ee787] font-bold', pauseBeforeMs: 110 },
    ],
    postDelayMs: 80,
  },
  {
    id: 3,
    spans: [
      { text: '[ 0.061s ] ', className: 'text-[#58a6ff]' },
      { text: 'stack:core', className: 'text-[#d2a8ff] font-medium' },
      { text: ' 3 production apps + schema engine... ', className: 'text-[#8b949e]' },
      { text: '[ OK ]', className: 'text-[#7ee787] font-bold', pauseBeforeMs: 130 },
    ],
    postDelayMs: 90,
  },
  {
    id: 4,
    spans: [
      { text: '[ 0.119s ] ', className: 'text-[#58a6ff]' },
      { text: 'net:edge', className: 'text-[#d2a8ff] font-medium' },
      { text: ' routing via Cloudflare Global Anycast... ', className: 'text-[#8b949e]' },
      { text: '[ 200 ]', className: 'text-[#7ee787] font-bold', pauseBeforeMs: 140 },
    ],
    postDelayMs: 90,
  },
  {
    id: 5,
    spans: [
      { text: '[ 0.190s ] ', className: 'text-[#58a6ff]' },
      { text: 'git:tree', className: 'text-[#d2a8ff] font-medium' },
      { text: ' synced github.com/jsbalabat/portfolio... ', className: 'text-[#8b949e]' },
      { text: '[ OK ]', className: 'text-[#7ee787] font-bold', pauseBeforeMs: 120 },
    ],
    postDelayMs: 80,
  },
  {
    id: 6,
    spans: [
      { text: '[ 0.267s ] ', className: 'text-[#58a6ff]' },
      { text: 'auth:daemon', className: 'text-[#d2a8ff] font-medium' },
      { text: ' interlock safety armed on /dev/interlock0... ', className: 'text-[#8b949e]' },
      { text: '[ ARMED ]', className: 'text-[#7ee787] font-bold', pauseBeforeMs: 120 },
    ],
    postDelayMs: 90,
  },
  {
    id: 7,
    spans: [
      { text: '[  OK  ] ', className: 'text-[#7ee787] font-bold' },
      { text: 'Production environment ready: ', className: 'text-[#c9d1d9]' },
      { text: 'marcbalabat.tech', className: 'text-[#79c0ff] underline decoration-[#79c0ff]/40' },
    ],
    postDelayMs: 120,
  },
];

type SplashPhase = 'pc_boot' | 'cli_terminal';
type ActivationStage = 'booting' | 'power_rail' | 'power_knob' | 'ready';

export default function TerminalHandshakeSplash() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [mounted, setMounted] = useState(false);

  // PC Bootloader phase before CLI
  const [splashPhase, setSplashPhase] = useState<SplashPhase>('pc_boot');
  const [pcBootProgress, setPcBootProgress] = useState(0);

  // Robotic typewriter state
  const [completedLines, setCompletedLines] = useState<BootLine[]>([]);
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const [activeSpans, setActiveSpans] = useState<TextSpan[]>([]);
  const [isBootComplete, setIsBootComplete] = useState(false);

  // Staggered uneven button activation
  const [activationStage, setActivationStage] = useState<ActivationStage>('booting');

  // Slider & Hold state
  const [sliderProgress, setSliderProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  const trackRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const promptTextRef = useRef<HTMLSpanElement>(null);
  const textLeftOffsetRef = useRef<number | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const holdStartTimeRef = useRef<number | null>(null);
  const grabOffsetRef = useRef<number>(22);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Check initial session storage on mount
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
      try {
        sessionStorage.removeItem('portfolio_unlocked');
      } catch (e) {}
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      setIsExiting(false);
      setIsUnlocked(false);
      setSplashPhase('pc_boot');
      setPcBootProgress(0);
      setSliderProgress(0);
      setIsAtEnd(false);
      setHoldProgress(0);
      setCompletedLines([]);
      setActiveLineIndex(0);
      setActiveSpans([]);
      setIsBootComplete(false);
      setActivationStage('booting');
      setIsVisible(true);
      textLeftOffsetRef.current = null;
      document.documentElement.classList.remove('splash-revealing');
      document.documentElement.classList.add('splash-locked');
    };

    window.addEventListener('open-splash-gate', handleReopen);
    return () => {
      window.removeEventListener('open-splash-gate', handleReopen);
    };
  }, []);

  const isFullyReady = activationStage === 'ready';

  // Finalize splash exit: unmount component and release page scroll lock
  const finishExit = useCallback(() => {
    setIsVisible(false);
    document.documentElement.classList.remove('splash-locked');
  }, []);

  // Unlock sequence: Refined cinematic transition to reveal portfolio
  const triggerUnlock = useCallback((isBypass = false) => {
    if (isUnlocked) return;
    setIsUnlocked(true);
    sessionStorage.setItem('portfolio_unlocked', 'true');

    // Remove lockout class to reveal background content immediately
    document.documentElement.classList.remove('splash-locked');

    const confirmationDelay = isBypass ? 80 : 180;

    setTimeout(() => {
      setIsExiting(true);
    }, confirmationDelay);

    setTimeout(() => {
      finishExit();
    }, confirmationDelay + 580);
  }, [isUnlocked, finishExit]);

  // Measure text position relative to track container when ready and on resize
  useEffect(() => {
    const measureTextPosition = () => {
      if (trackRef.current && promptTextRef.current) {
        const trackRect = trackRef.current.getBoundingClientRect();
        const textRect = promptTextRef.current.getBoundingClientRect();
        if (textRect.width > 0) {
          textLeftOffsetRef.current = textRect.left - trackRect.left;
        }
      }
    };

    measureTextPosition();
    window.addEventListener('resize', measureTextPosition);
    return () => window.removeEventListener('resize', measureTextPosition);
  }, [isFullyReady]);

  // Bypass strictly only allowed when loading finishes
  const handleBypass = useCallback(() => {
    if (!isFullyReady || isUnlocked) return;
    triggerUnlock(true);
  }, [isFullyReady, isUnlocked, triggerUnlock]);

  // PC Bootloader animation (pre-CLI program loader: ~450ms)
  useEffect(() => {
    if (!isVisible || splashPhase !== 'pc_boot') return;

    const startTime = Date.now();
    const duration = 450; // ms

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));
      setPcBootProgress(progress);

      if (progress >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          setSplashPhase('cli_terminal');
        }, 100);
      }
    }, 20);

    return () => clearInterval(timer);
  }, [isVisible, splashPhase]);

  // Fast robotic letter-by-letter typewriter engine (7ms cadence)
  useEffect(() => {
    if (!isVisible || splashPhase !== 'cli_terminal' || isBootComplete) return;

    if (activeLineIndex >= BOOT_LINES.length) {
      setIsBootComplete(true);
      return;
    }

    const currentLine = BOOT_LINES[activeLineIndex];
    let isCancelled = false;
    let spanIdx = 0;
    let charIdx = 0;
    let hasPausedCurrentSpan = false;
    let timeoutId: number;

    const streamNextChar = () => {
      if (isCancelled) return;

      if (spanIdx >= currentLine.spans.length) {
        timeoutId = window.setTimeout(() => {
          if (isCancelled) return;
          setCompletedLines((prev) => [...prev, currentLine]);
          setActiveSpans([]);
          setActiveLineIndex((prev) => prev + 1);
        }, currentLine.postDelayMs);
        return;
      }

      const currentSpan = currentLine.spans[spanIdx];

      if (charIdx === 0 && !hasPausedCurrentSpan && currentSpan.pauseBeforeMs && currentSpan.pauseBeforeMs > 0) {
        hasPausedCurrentSpan = true;
        timeoutId = window.setTimeout(streamNextChar, currentSpan.pauseBeforeMs);
        return;
      }

      charIdx++;

      const renderedSpans: TextSpan[] = [];
      for (let i = 0; i < spanIdx; i++) {
        renderedSpans.push(currentLine.spans[i]);
      }
      renderedSpans.push({
        text: currentSpan.text.slice(0, charIdx),
        className: currentSpan.className,
      });
      setActiveSpans(renderedSpans);

      if (charIdx >= currentSpan.text.length) {
        spanIdx++;
        charIdx = 0;
        hasPausedCurrentSpan = false;
      }

      // Fast robotic 7ms per letter rate
      timeoutId = window.setTimeout(streamNextChar, 7);
    };

    streamNextChar();

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [isVisible, splashPhase, isBootComplete, activeLineIndex]);

  // Staggered uneven activation of buttons once boot completes
  useEffect(() => {
    if (!isBootComplete) return;

    // Stage 1: Power the slider rail
    const t1 = window.setTimeout(() => {
      setActivationStage('power_rail');
    }, 90);

    // Stage 2: Power the slider knob
    const t2 = window.setTimeout(() => {
      setActivationStage('power_knob');
    }, 200);

    // Stage 3: Enable bypass and activate ready status
    const t3 = window.setTimeout(() => {
      setActivationStage('ready');
    }, 320);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [isBootComplete]);

  // Hold action: 400ms hold at the right end to authenticate and unlock
  const startHold = useCallback(() => {
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    holdStartTimeRef.current = Date.now();
    const holdDuration = 400; // ms

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
  }, [triggerUnlock]);

  const cancelHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    holdStartTimeRef.current = null;
    if (!isUnlocked) {
      setHoldProgress(0);
    }
  }, [isUnlocked]);

  const updateSliderPosition = useCallback((clientX: number) => {
    if (!trackRef.current) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    const thumbWidth = 44;
    const padding = 6;
    const maxTravel = Math.max(60, trackRect.width - thumbWidth - padding * 2);

    // Match the horizontal point on the screen where the user is pressing
    const grabOffset = grabOffsetRef.current ?? (thumbWidth / 2);
    const knobX = clientX - trackRect.left - padding - grabOffset;
    const clampedX = Math.max(0, Math.min(maxTravel, knobX));
    const progress = maxTravel > 0 ? clampedX / maxTravel : 0;

    setSliderProgress(progress);

    // When slider reaches the right edge (>= 96%) -> initiate hold sequence
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
  }, [isAtEnd, startHold, cancelHold]);

  // Pointer drag on knob: slider movement is triggered exclusively by pressing/holding the knob button
  const handleKnobPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isFullyReady || isUnlocked) return;
    if (e.button !== 0) return; // Only main button / primary touch

    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);

    if (trackRef.current && knobRef.current) {
      const trackRect = trackRef.current.getBoundingClientRect();
      const knobRect = knobRef.current.getBoundingClientRect();
      const thumbWidth = 44;
      const padding = 6;
      const maxTravel = Math.max(60, trackRect.width - thumbWidth - padding * 2);

      // Record grab offset relative to knob left so knob stays locked to touch point
      const offsetWithinKnob = e.clientX - knobRect.left;
      grabOffsetRef.current = Math.max(0, Math.min(thumbWidth, offsetWithinKnob));

      // Calculate initial position matching where the user is pressing
      const knobX = e.clientX - trackRect.left - padding - grabOffsetRef.current;
      const clampedX = Math.max(0, Math.min(maxTravel, knobX));
      const progress = maxTravel > 0 ? clampedX / maxTravel : 0;
      setSliderProgress(progress);

      if (progress >= 0.96) {
        setIsAtEnd(true);
        startHold();
      }
    }
  };

  // Window-level pointer tracking: ensures slider follows horizontal pressing point across entire screen
  useEffect(() => {
    if (!isDragging || isUnlocked) return;

    const onPointerMove = (e: PointerEvent) => {
      e.preventDefault();
      updateSliderPosition(e.clientX);
    };

    const onPointerUp = () => {
      setIsDragging(false);
      cancelHold();
      setIsAtEnd(false);
      setSliderProgress(0);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [isDragging, isUnlocked, updateSliderPosition, cancelHold]);

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
      }
    };
  }, []);

  // Keyboard navigation & accessibility: Escape to bypass and Tab cyclic focus trap
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isFullyReady && !isUnlocked) {
          handleBypass();
        }
      } else if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length > 0) {
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, isFullyReady, isUnlocked, handleBypass]);

  if (!mounted || !isVisible) return null;

  const trackWidth = trackRef.current ? trackRef.current.clientWidth : 500;
  const thumbWidth = 44;
  const padding = 6;
  const maxTravel = Math.max(60, trackWidth - thumbWidth - padding * 2);
  const currentThumbX = sliderProgress * maxTravel;

  // Knob right edge relative to the track container
  const knobRight = padding + currentThumbX + thumbWidth;

  // Track text left edge relative to track container (measured or fallback)
  const fallbackTextLeft = Math.max(60, (trackWidth - 180) / 2);
  const textLeftBoundary = textLeftOffsetRef.current ?? fallbackTextLeft;

  // Text disappears ONLY when the slider knob physically moves over the text itself
  const isTextOverlapped = knobRight >= (textLeftBoundary - 4);

  const isRailPowered = activationStage === 'power_rail' || activationStage === 'power_knob' || activationStage === 'ready';
  const isKnobPowered = activationStage === 'power_knob' || activationStage === 'ready';

  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target === dialogRef.current && e.propertyName === 'transform' && isExiting) {
      finishExit();
    }
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Engineering boot terminal handshake"
      onTransitionEnd={handleTransitionEnd}
      style={{
        transform: isExiting ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'transform 540ms cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: isExiting ? 'transform' : 'auto',
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-bg p-4 sm:p-6 select-none overflow-hidden border-b border-border/80 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.7)] ${
        isExiting ? 'pointer-events-none' : ''
      }`}
    >
      {/* Precision laser sweep line at the bottom bezel of the retracting visor */}
      <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-accent/50 to-transparent pointer-events-none" />
      {/* CLI Sharp Blink Keyframes (hard step toggle, no smooth transition) */}
      <style>{`
        @keyframes cli-sharp-blink {
          0%, 49% {
            opacity: 1;
            visibility: visible;
          }
          50%, 100% {
            opacity: 0;
            visibility: hidden;
          }
        }
        .cli-prompt-blink {
          display: inline-block;
          animation: cli-sharp-blink 0.75s steps(1, end) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .cli-prompt-blink {
            animation: none !important;
          }
        }
      `}</style>

      {/* STAGE 1: Simple Progress Loader Initializing (Runs before CLI; no bypass allowed during loading) */}
      {splashPhase === 'pc_boot' && (
        <div className="max-w-xs w-full font-mono flex flex-col items-center text-center gap-3.5 px-4 select-none">
          {/* Status line: Initializing... xx% */}
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-text font-medium tracking-wide">Initializing...</span>
            <span className="text-accent font-semibold tabular-nums">{pcBootProgress}%</span>
          </div>

          {/* Simple Minimal Progress Bar */}
          <div className="w-64 sm:w-72 h-1.5 rounded-full bg-surface-raised border border-border/80 overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-75 ease-out"
              style={{ width: `${pcBootProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* STAGE 2: Terminal Window & Handshake Controls */}
      {splashPhase === 'cli_terminal' && (
        <div
          style={{
            transform: isExiting ? 'translateY(-24px) scale(0.98)' : 'translateY(0) scale(1)',
            opacity: isExiting ? 0 : 1,
            transition: 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1), opacity 280ms ease-out',
            willChange: isExiting ? 'transform, opacity' : 'auto',
          }}
          className="w-full max-w-2xl rounded-2xl border border-border/80 bg-[#0d1117] text-[#c9d1d9] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.06)] overflow-hidden font-mono flex flex-col"
        >
          {/* Terminal Titlebar */}
          <div className="px-4 py-3 bg-surface-raised border-b border-border/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block" />
            </div>
            <div className="text-[11px] sm:text-xs text-text-muted font-medium truncate max-w-[120px] xs:max-w-[180px] sm:max-w-none text-center">
              marc@marcbalabat.tech:~ (zsh)
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

          {/* Terminal Log Screen (Strict single line per entry; no wrapping or overflow) */}
          <div className="p-4 sm:p-6 space-y-1.5 text-[11px] sm:text-xs min-h-[200px] sm:min-h-[220px] flex flex-col justify-start overflow-hidden">
            {/* Completed lines */}
            {completedLines.map((line) => (
              <div key={line.id} className="leading-relaxed font-mono whitespace-nowrap overflow-hidden text-ellipsis">
                {line.spans.map((span, sIdx) => (
                  <span key={sIdx} className={span.className}>
                    {span.text}
                  </span>
                ))}
              </div>
            ))}

            {/* Currently typing line (robotic per-letter streaming; strictly one line) */}
            {!isBootComplete && (
              <div className="leading-relaxed font-mono whitespace-nowrap overflow-hidden text-ellipsis">
                {activeSpans.map((span, sIdx) => (
                  <span key={sIdx} className={span.className}>
                    {span.text}
                  </span>
                ))}
              </div>
            )}

            {/* Terminal Prompt Line: '>' blinks sharply with zero smooth fade; updated prompt text */}
            <div className="pt-2 flex items-center gap-1 text-[11px] sm:text-xs font-mono whitespace-nowrap overflow-hidden text-ellipsis">
              <span className="cli-prompt-blink font-bold text-accent mr-1 shrink-0">&gt;</span>
              {!isBootComplete ? (
                <span className="text-text-muted">
                  System boot sequence in progress...
                </span>
              ) : isUnlocked ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Handshake verified [200 OK]. Launching workspace...
                </span>
              ) : (
                <span className="text-text font-medium">
                  Slide right to proceed:
                </span>
              )}
            </div>
          </div>

          {/* Handshake Controls Panel */}
          <div className="p-3.5 sm:p-5 bg-surface/50 border-t border-border/80 flex flex-col gap-2.5 sm:gap-3">
            {/* Slider Rail: Button sits inside with uniform 6px padding on all sides */}
            <div
              ref={trackRef}
              className={`h-14 rounded-2xl border relative overflow-hidden flex items-center p-1.5 select-none touch-none transition-colors duration-200 ${
                !isRailPowered
                  ? 'opacity-30 border-border/40 bg-surface-raised/30 pointer-events-none cursor-not-allowed'
                  : isUnlocked
                  ? 'border-emerald-700/60 dark:border-emerald-500 bg-emerald-900/15 dark:bg-emerald-500/10'
                  : isFullyReady
                  ? 'border-border bg-surface-raised hover:border-accent/60'
                  : 'border-border/60 bg-surface-raised/60'
              }`}
            >
              {/* Dynamic Slider Progress Fill: ONLY rendered when pressing, dragging, or holding */}
              {(isDragging || isAtEnd || sliderProgress > 0) && (
                <div
                  className={`absolute border-r transition-none ${
                    isUnlocked
                      ? 'bg-emerald-900/25 dark:bg-emerald-500/20 border-emerald-700/60 dark:border-emerald-500'
                      : 'bg-accent/25 border-accent'
                  }`}
                  style={{
                    left: '6px',
                    top: '6px',
                    bottom: '6px',
                    width: `${currentThumbX + thumbWidth}px`,
                    borderRadius: '10px',
                  }}
                />
              )}

              {/* Slider Track Prompt Text (Hides ONLY when slider knob physically moves over the text itself) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-mono">
                {!isFullyReady ? (
                  <span className="text-text-muted/50 text-[11px]">
                    [ System initializing... handshake offline ]
                  </span>
                ) : isUnlocked ? (
                  <span className="text-emerald-400 font-bold tracking-wider">
                    ✓ ACCESS GRANTED
                  </span>
                ) : isAtEnd ? (
                  <span className="text-accent font-bold tracking-wide">
                    Hold to proceed (<span className="tabular-nums">{Math.round(holdProgress * 100)}%</span>)
                  </span>
                ) : null}

                {/* Prompt text element: preserved in DOM so bounding box measurements stay accurate */}
                {isFullyReady && !isUnlocked && (
                  <span
                    ref={promptTextRef}
                    className={`text-text-muted flex items-center gap-2 transition-opacity duration-150 ${
                      isAtEnd || isTextOverlapped ? 'opacity-0 pointer-events-none' : 'opacity-100'
                    }`}
                    style={isAtEnd ? { display: 'none' } : undefined}
                  >
                    <span>Slide right to proceed</span>
                    <span className="text-accent">➔</span>
                  </span>
                )}
              </div>

              {/* Slider Knob Button (strictly nested inside track with 6px padding & concentric 10px radius) */}
              <div
                ref={knobRef}
                role="button"
                tabIndex={isKnobPowered && !isUnlocked ? 0 : -1}
                aria-label="Handshake slider button: hold and slide to unlock portfolio"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(sliderProgress * 100)}
                onPointerDown={handleKnobPointerDown}
                onKeyDown={(e) => {
                  if (!isFullyReady || isUnlocked) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsDragging(false);
                    setIsAtEnd(true);
                    setSliderProgress(1);
                    setHoldProgress(1);
                    setTimeout(() => triggerUnlock(), 260);
                  } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    const next = Math.min(1, sliderProgress + 0.25);
                    setSliderProgress(next);
                    if (next >= 0.96 && !isAtEnd) {
                      setIsAtEnd(true);
                      startHold();
                    }
                  } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const next = Math.max(0, sliderProgress - 0.25);
                    setSliderProgress(next);
                    if (next < 0.96 && isAtEnd) {
                      setIsAtEnd(false);
                      cancelHold();
                    }
                  }
                }}
                className={`w-11 h-11 rounded-[10px] flex items-center justify-center font-bold text-xs shadow-sm relative z-10 select-none touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  !isKnobPowered
                    ? 'bg-border/60 text-text-muted/40 cursor-not-allowed'
                    : isUnlocked
                    ? 'bg-emerald-700 dark:bg-emerald-500 text-white'
                    : isAtEnd
                    ? 'bg-accent text-accent-text brightness-110 cursor-grab active:cursor-grabbing'
                    : 'bg-accent text-accent-text hover:brightness-105 active:brightness-95 cursor-grab active:cursor-grabbing'
                }`}
                style={{
                  transform: `translateX(${currentThumbX}px) ${isDragging ? 'scale(0.96)' : 'scale(1)'}`,
                  transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {isUnlocked ? (
                  '✓'
                ) : isAtEnd ? (
                  <span className="tabular-nums">{Math.round(holdProgress * 100)}%</span>
                ) : (
                  <span className="inline-block transform translate-x-[0.5px]">➔</span>
                )}
              </div>
            </div>

            {/* Controls Row: Status indicator on left + Far-right Bypass button */}
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
                    ? 'Hold and slide button to right end to proceed'
                    : 'Awaiting boot sequence'}
                </span>
              </div>

              {/* Far-Right Bypass Button: Strictly disabled & hidden until loading finishes */}
              <button
                type="button"
                disabled={!isFullyReady || isUnlocked}
                onClick={handleBypass}
                aria-label="Bypass splash terminal gate and proceed directly to portfolio"
                className={`ml-auto px-3.5 py-1.5 rounded-xl border text-xs font-mono transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-accent ${
                  isFullyReady
                    ? 'border-border/80 bg-surface hover:bg-surface-raised active:scale-[0.96] text-text-muted hover:text-text cursor-pointer opacity-100'
                    : 'opacity-0 pointer-events-none cursor-not-allowed'
                }`}
                title="Skip splash gate directly"
              >
                <span>Bypass</span>
                <kbd className="text-[10px] px-1.5 py-0.5 rounded-[6px] bg-surface-raised border border-border/60 text-text-muted">
                  ESC
                </kbd>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
