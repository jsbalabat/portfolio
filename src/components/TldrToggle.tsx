import { useState, useEffect } from 'react';

export default function TldrToggle() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Check initial state
    const saved = localStorage.getItem('portfolio_tldr_active') === 'true';
    if (saved) {
      setIsActive(true);
      document.body.classList.add('tldr-active');
    }

    const handleExternalChange = () => {
      const active = document.body.classList.contains('tldr-active');
      setIsActive(active);
    };

    window.addEventListener('tldr-state-change', handleExternalChange);
    return () => window.removeEventListener('tldr-state-change', handleExternalChange);
  }, []);

  const toggle = () => {
    const next = !isActive;
    setIsActive(next);
    localStorage.setItem('portfolio_tldr_active', String(next));
    if (next) {
      document.body.classList.add('tldr-active');
    } else {
      document.body.classList.remove('tldr-active');
    }
    window.dispatchEvent(new Event('tldr-state-change'));
  };

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={isActive}
        className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all duration-200 active:scale-[0.96] flex items-center gap-2 shadow-2xs cursor-pointer ${
          isActive
            ? 'bg-accent text-accent-text border-accent ring-1 ring-accent/40'
            : 'bg-surface hover:bg-surface-raised border-border text-text'
        }`}
        title="Toggle TLDR: Highlights key metrics, core stack, and project outcomes while dimming secondary text"
      >
        <span
          className={`w-2 h-2 rounded-full transition-colors ${
            isActive ? 'bg-emerald-500' : 'bg-accent'
          }`}
        />
        <span>TLDR</span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold tabular-nums ${
            isActive
              ? 'bg-black/20 text-accent-text'
              : 'bg-surface-raised text-text-muted border border-border/60'
          }`}
        >
          {isActive ? 'ON' : 'OFF'}
        </span>
      </button>
    </div>
  );
}
