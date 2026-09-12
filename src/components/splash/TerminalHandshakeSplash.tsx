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

const BOOT_LINES: BootLine[] = [
  {
    id: 1,
    spans: [
      { text: '[sys:boot] ', className: 'text-[#8b949e]' },
      { text: 'booting ', className: 'text-[#c9d1d9]' },
      { text: 'marcbalabat.tech', className: 'text-[#79c0ff] font-semibold' },
      { text: ' on ', className: 'text-[#8b949e]' },
      { text: 'cloudflare:edge', className: 'text-[#e3b341]' },
      { text: ' (v0.1.0)...', className: 'text-[#d2a8ff]' },
    ],
    postDelayMs: 140,
  },
  {
    id: 2,
    spans: [
      { text: '[ 0.014s ] ', className: 'text-[#58a6ff]' },
      { text: 'runtime:v8', className: 'text-[#d2a8ff] font-medium' },
      { text: ' isolate sandbox & wasm memory... ', className: 'text-[#8b949e]' },
      { text: '[ OK ]', className: 'text-[#7ee787] font-bold', pauseBeforeMs: 180 },
    ],
    postDelayMs: 120,
  },
  {
    id: 3,
    spans: [
      { text: '[ 0.061s ] ', className: 'text-[#58a6ff]' },
      { text: 'stack:core', className: 'text-[#d2a8ff] font-medium' },
      { text: ' 3 production apps + schema engine... ', className: 'text-[#8b949e]' },
      { text: '[ OK ]', className: 'text-[#7ee787] font-bold', pauseBeforeMs: 220 },
    ],
    postDelayMs: 130,
  },
  {
    id: 4,
    spans: [
      { text: '[ 0.119s ] ', className: 'text-[#58a6ff]' },
      { text: 'net:edge', className: 'text-[#d2a8ff] font-medium' },
      { text: ' routing via Cloudflare Global Anycast... ', className: 'text-[#8b949e]' },
      { text: '[ 200 ]', className: 'text-[#7ee787] font-bold', pauseBeforeMs: 240 },
    ],
    postDelayMs: 140,
  },
  {
    id: 5,
    spans: [
      { text: '[ 0.190s ] ', className: 'text-[#58a6ff]' },
      { text: 'git:tree', className: 'text-[#d2a8ff] font-medium' },
      { text: ' synced github.com/jsbalabat/portfolio... ', className: 'text-[#8b949e]' },
      { text: '[ OK ]', className: 'text-[#7ee787] font-bold', pauseBeforeMs: 200 },
    ],
    postDelayMs: 120,
  },
  {
    id: 6,
    spans: [
      { text: '[ 0.267s ] ', className: 'text-[#58a6ff]' },
      { text: 'auth:daemon', className: 'text-[#d2a8ff] font-medium' },
      { text: ' interlock safety armed on /dev/interlock0... ', className: 'text-[#8b949e]' },
      { text: '[ ARMED ]', className: 'text-[#7ee787] font-bold', pauseBeforeMs: 190 },
    ],
    postDelayMs: 130,
  },
  {
    id: 7,
    spans: [
      { text: '[  OK  ] ', className: 'text-[#7ee787] font-bold' },
      { text: 'Production environment ready: ', className: 'text-[#c9d1d9]' },
      { text: 'marcbalabat.tech', className: 'text-[#79c0ff] underline decoration-[#79c0ff]/40' },
    ],
    postDelayMs: 180,
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
  const holdTimerRef = useRef<number | null>(null);
  const holdStartTimeRef = useRef<number | null>(null);

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

    // Remove lockout class to reveal background content smoothly
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

  // PC Bootloader animation (pre-CLI program loader: ~650ms)
  useEffect(() => {
    if (!isVisible || splashPhase !== 'pc_boot') return;

    const startTime = Date.now();
    const duration = 500; // ms (fast, responsive simple loader)

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));
      setPcBootProgress(progress);

      if (progress >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          setSplashPhase('cli_terminal');
        }, 120);
      }
    }, 24);

    return () => clearInterval(timer);
  }, [isVisible, splashPhase]);

  // Robotic, crisp letter-by-letter typewriter engine (runs during cli_terminal phase)
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

      if (charIdx === 0 && currentSpan.pauseBeforeMs && currentSpan.pauseBeforeMs > 0) {
        const pauseTime = currentSpan.pauseBeforeMs;
        currentSpan.pauseBeforeMs = 0;
        timeoutId = window.setTimeout(streamNextChar, pauseTime);
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
      }

      timeoutId = window.setTimeout(streamNextChar, 10);
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
    }, 100);

    // Stage 2: Power the slider knob
    const t2 = window.setTimeout(() => {
      setActivationStage('power_knob');
    }, 240);

    // Stage 3: Enable bypass and activate ready status
    const t3 = window.setTimeout(() => {
      setActivationStage('ready');
    }, 380);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [isBootComplete]);

  // Pointer drag physics for slider (button sits inside with 6px padding)
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
    const padding = 6;
    const maxTravel = Math.max(60, rect.width - thumbWidth - padding * 2);
    const pointerOffset = clientX - rect.left - padding - thumbWidth / 2;
    const clampedOffset = Math.max(0, Math.min(maxTravel, pointerOffset));
    const progress = maxTravel > 0 ? clampedOffset / maxTravel : 0;

    setSliderProgress(progress);

    // Slide reached the right edge (>= 96%) -> initiate hold sequence
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

    // If released before hold finishes, snap back to start
    cancelHold();
    setIsAtEnd(false);
    setSliderProgress(0);
  };

  // Hold action: 650ms (balanced between first 450ms and previous 850ms)
  const startHold = () => {
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    holdStartTimeRef.current = Date.now();
    const holdDuration = 650; // ms

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

  // Keyboard shortcut: Escape to bypass anytime
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
  const padding = 6;
  const maxTravel = Math.max(60, trackWidth - thumbWidth - padding * 2);
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
      `}</style>

      {/* STAGE 1: Simple Progress Loader Initializing (Runs before CLI) */}
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

          {/* Subtle Bypass */}
          <button
            type="button"
            onClick={handleBypass}
            className="text-[11px] text-text-muted/50 hover:text-text cursor-pointer transition-colors pt-1"
          >
            Skip (ESC)
          </button>
        </div>
      )}

      {/* STAGE 2: Terminal Window & Handshake Controls */}
      {splashPhase === 'cli_terminal' && (
        <div className="w-full max-w-2xl rounded-2xl border border-border bg-[#0d1117] text-[#c9d1d9] shadow-2xl overflow-hidden font-mono flex flex-col">
          {/* Terminal Titlebar */}
          <div className="px-4 py-3 bg-surface-raised border-b border-border/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block" />
            </div>
            <div className="text-xs text-text-muted font-medium">
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
          <div className="p-5 sm:p-6 space-y-1.5 text-[11px] sm:text-xs min-h-[220px] flex flex-col justify-start overflow-hidden">
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

            {/* Terminal Prompt Line: '>' blinks sharply with zero smooth fade */}
            <div className="pt-2 flex items-center gap-1 text-[11px] sm:text-xs font-mono whitespace-nowrap overflow-hidden text-ellipsis">
              <span className="cli-prompt-blink font-bold text-accent mr-1 shrink-0">&gt;</span>
              {!isBootComplete ? (
                <span className="text-text-muted">
                  System boot sequence in progress...
                </span>
              ) : isUnlocked ? (
                <span className="text-emerald-400 font-bold">
                  Handshake verified. Launching workspace...
                </span>
              ) : (
                <span className="text-text font-medium">
                  Slide right and hold to authenticate:
                </span>
              )}
            </div>
          </div>

          {/* Handshake Controls Panel */}
          <div className="p-4 sm:p-5 bg-surface/50 border-t border-border/80 flex flex-col gap-3">
            {/* Slider Rail: Button sits inside with uniform 6px padding on all sides */}
            <div
              ref={trackRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`h-14 rounded-2xl border relative overflow-hidden flex items-center p-1.5 select-none transition-colors duration-200 ${
                !isRailPowered
                  ? 'opacity-30 border-border/40 bg-surface-raised/30 pointer-events-none cursor-not-allowed'
                  : isUnlocked
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : isFullyReady
                  ? 'border-border bg-surface-raised cursor-grab active:cursor-grabbing hover:border-accent/60'
                  : 'border-border/60 bg-surface-raised/60'
              }`}
            >
              {/* Dynamic Slider Progress Fill: ONLY rendered when pressing or holding (hidden otherwise) */}
              {(isDragging || isAtEnd) && (
                <div
                  className={`absolute border-r transition-none ${
                    isUnlocked
                      ? 'bg-emerald-500/20 border-emerald-500'
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

              {/* Slider Track Prompt Text */}
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

              {/* Slider Knob Button (strictly nested inside track with 6px padding) */}
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm relative z-10 select-none ${
                  !isKnobPowered
                    ? 'bg-border/60 text-text-muted/40 cursor-not-allowed'
                    : isUnlocked
                    ? 'bg-emerald-500 text-white'
                    : isAtEnd
                    ? 'bg-accent text-accent-text brightness-110'
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
                    ? 'Slide to right end and hold to authenticate'
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
      )}
    </div>
  );
}
