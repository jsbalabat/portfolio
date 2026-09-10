import { useState, useEffect, useRef } from 'react';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  action: () => void;
  shortcut?: string;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    {
      id: 'work-ledgerly',
      title: 'Ledgerly — Flutter & Offline-First Invoicing Case Study',
      category: 'Case Studies',
      action: () => (window.location.href = '/work/ledgerly'),
      shortcut: '01',
    },
    {
      id: 'work-unitko',
      title: 'UnitKo — Schema Normalization & PostgreSQL RLS Case Study',
      category: 'Case Studies',
      action: () => (window.location.href = '/work/unitko'),
      shortcut: '02',
    },
    {
      id: 'work-tellhealth',
      title: 'TellHealth — Telehealth Triage & LLM Routing Case Study',
      category: 'Case Studies',
      action: () => (window.location.href = '/work/tell-health'),
      shortcut: '03',
    },
    {
      id: 'section-skills',
      title: 'Jump to Production Tech Stack',
      category: 'Navigation',
      action: () => {
        window.location.href = '/#skills';
        setIsOpen(false);
      },
      shortcut: 'S',
    },
    {
      id: 'toggle-theme',
      title: 'Toggle Light / Dark Color Theme',
      category: 'Appearance',
      action: () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const next = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        setIsOpen(false);
      },
      shortcut: 'T',
    },
    {
      id: 'toggle-tldr',
      title: 'Toggle TLDR Mode (High-Signal Highlights)',
      category: 'View',
      action: () => {
        const active = document.body.classList.contains('tldr-active');
        const next = !active;
        localStorage.setItem('portfolio_tldr_active', String(next));
        if (next) {
          document.body.classList.add('tldr-active');
        } else {
          document.body.classList.remove('tldr-active');
        }
        window.dispatchEvent(new Event('tldr-state-change'));
        setIsOpen(false);
      },
      shortcut: 'TL',
    },
    {
      id: 'external-github',
      title: 'GitHub Profile (@jsbalabat)',
      category: 'External',
      action: () => window.open('https://github.com/jsbalabat', '_blank'),
      shortcut: 'GH',
    },
    {
      id: 'contact-email',
      title: 'Direct Email (johnfelixmarc@gmail.com)',
      category: 'Contact',
      action: () => (window.location.href = 'mailto:johnfelixmarc@gmail.com'),
      shortcut: '@',
    },
  ];

  const filtered = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-raised transition-colors text-xs font-mono text-text-muted shadow-xs"
        aria-label="Open Command Palette"
      >
        <span className="hidden sm:inline">Search</span>
        <kbd className="px-1.5 py-0.5 rounded bg-surface-raised border border-border/80 text-[10px] text-text font-semibold">
          ⌘K
        </kbd>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden font-mono text-sm animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 border-b border-border flex items-center gap-3 bg-surface-raised/30">
              <span className="text-accent text-sm">❯</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyNavigation}
                placeholder="Jump to a project or page..."
                className="flex-1 bg-transparent border-none outline-none text-text placeholder:text-text-muted text-xs font-mono"
              />
              <span className="text-[10px] px-2 py-0.5 rounded bg-surface-raised border border-border text-text-muted font-mono">
                esc
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-xs text-text-muted">
                  No matching results.
                </div>
              ) : (
                filtered.map((cmd, idx) => (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={() => {
                      cmd.action();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-colors ${
                      idx === selectedIndex
                        ? 'bg-accent/15 text-text border border-accent/30'
                        : 'text-text-muted hover:bg-surface-raised'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-accent">#</span>
                      <span className="text-xs text-text font-medium">{cmd.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-muted/70 uppercase">
                        {cmd.category}
                      </span>
                      {cmd.shortcut && (
                        <kbd className="px-1.5 py-0.5 rounded bg-surface-raised border border-border/80 text-[10px] text-text-muted">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="p-2.5 border-t border-border/60 bg-surface-card flex items-center justify-between text-[11px] text-text-muted">
              <span>Navigate with ↑ ↓ and ↵ Enter</span>
              <span>Select action to jump</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
