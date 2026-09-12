import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Case Studies' | 'Navigation' | 'Actions' | 'Contact';
  action: () => void;
  shortcut?: string;
  icon: 'document' | 'compass' | 'eye' | 'theme' | 'mail' | 'external';
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMac, setIsMac] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isClosingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent));
  }, []);

  const commands: CommandItem[] = [
    {
      id: 'work-ledgerly',
      title: 'Ledgerly',
      subtitle: 'Flutter & Offline-First Invoicing Case Study',
      category: 'Case Studies',
      icon: 'document',
      action: () => (window.location.href = '/work/ledgerly'),
      shortcut: '01',
    },
    {
      id: 'work-unitko',
      title: 'UnitKo',
      subtitle: 'PostgreSQL 3NF Schema Normalization & RLS',
      category: 'Case Studies',
      icon: 'document',
      action: () => (window.location.href = '/work/unitko'),
      shortcut: '02',
    },
    {
      id: 'work-tellhealth',
      title: 'TellHealth',
      subtitle: 'Telehealth Triage & LLM Routing Engine',
      category: 'Case Studies',
      icon: 'document',
      action: () => (window.location.href = '/work/tell-health'),
      shortcut: '03',
    },
    {
      id: 'section-work',
      title: 'Jump to Case Studies',
      subtitle: 'Scroll to shipped commercial projects',
      category: 'Navigation',
      icon: 'compass',
      action: () => {
        window.location.href = '/#work';
        setIsOpen(false);
      },
      shortcut: 'W',
    },
    {
      id: 'section-architecture',
      title: 'Schema Normalization Diff Slider',
      subtitle: 'Interactive side-by-side SQL comparison',
      category: 'Navigation',
      icon: 'compass',
      action: () => {
        window.location.href = '/#architecture';
        setIsOpen(false);
      },
      shortcut: 'D',
    },
    {
      id: 'section-skills',
      title: 'Production Tech Stack',
      subtitle: 'Languages, frontend, backend, databases, and DevOps',
      category: 'Navigation',
      icon: 'compass',
      action: () => {
        window.location.href = '/#skills';
        setIsOpen(false);
      },
      shortcut: 'S',
    },
    {
      id: 'section-about',
      title: 'About Engineering Background',
      subtitle: 'Ownership philosophy and production track record',
      category: 'Navigation',
      icon: 'compass',
      action: () => {
        window.location.href = '/#about';
        setIsOpen(false);
      },
      shortcut: 'A',
    },
    {
      id: 'action-reopen-splash',
      title: 'Replay Boot Terminal Handshake',
      subtitle: 'Re-trigger the engineering bootloader splash gate',
      category: 'Actions',
      icon: 'document',
      action: () => {
        closePalette();
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-splash-gate'));
        }, 150);
      },
      shortcut: 'B',
    },
    {
      id: 'toggle-tldr',
      title: 'Toggle TLDR Mode',
      subtitle: 'Highlight high-signal metrics & outcomes across the page',
      category: 'Actions',
      icon: 'eye',
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
      id: 'toggle-theme',
      title: 'Cycle Color Theme (System / Light / Dark)',
      subtitle: 'Cycle between system auto, light linen, and dark slate',
      category: 'Actions',
      icon: 'theme',
      action: () => {
        const currentPref = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('theme_preference')) || 'system';
        const cycle: Record<string, string> = {
          system: 'light',
          light: 'dark',
          dark: 'system',
        };
        const next = cycle[currentPref] || 'system';
        try { sessionStorage.setItem('theme_preference', next); } catch (e) {}
        document.documentElement.setAttribute('data-theme-preference', next);
        if (next === 'system') {
          const resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', resolved);
        } else {
          document.documentElement.setAttribute('data-theme', next);
        }
        window.dispatchEvent(new CustomEvent('theme-preference-change', { detail: next }));
        closePalette();
      },
      shortcut: 'T',
    },
    {
      id: 'theme-system',
      title: 'Set Theme: System (Auto)',
      subtitle: 'Default: Automatically follow operating system light/dark preference',
      category: 'Actions',
      icon: 'theme',
      action: () => {
        try { sessionStorage.setItem('theme_preference', 'system'); } catch (e) {}
        document.documentElement.setAttribute('data-theme-preference', 'system');
        const resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', resolved);
        window.dispatchEvent(new CustomEvent('theme-preference-change', { detail: 'system' }));
        closePalette();
      },
    },
    {
      id: 'theme-light',
      title: 'Set Theme: Light Mode',
      subtitle: 'Force tranquil linen light theme',
      category: 'Actions',
      icon: 'theme',
      action: () => {
        try { sessionStorage.setItem('theme_preference', 'light'); } catch (e) {}
        document.documentElement.setAttribute('data-theme-preference', 'light');
        document.documentElement.setAttribute('data-theme', 'light');
        window.dispatchEvent(new CustomEvent('theme-preference-change', { detail: 'light' }));
        closePalette();
      },
    },
    {
      id: 'theme-dark',
      title: 'Set Theme: Dark Mode',
      subtitle: 'Force deep slate dark theme',
      category: 'Actions',
      icon: 'theme',
      action: () => {
        try { sessionStorage.setItem('theme_preference', 'dark'); } catch (e) {}
        document.documentElement.setAttribute('data-theme-preference', 'dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        window.dispatchEvent(new CustomEvent('theme-preference-change', { detail: 'dark' }));
        closePalette();
      },
    },
    {
      id: 'contact-modal',
      title: 'Send a Message',
      subtitle: 'Open email modal popup to johnfelixmarc@gmail.com',
      category: 'Contact',
      icon: 'mail',
      action: () => {
        closePalette();
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-contact-modal'));
        }, 150);
      },
      shortcut: 'M',
    },
    {
      id: 'contact-email',
      title: 'Direct Mail Client',
      subtitle: 'Open default desktop/mobile email application',
      category: 'Contact',
      icon: 'mail',
      action: () => {
        window.location.href = 'mailto:johnfelixmarc@gmail.com';
        closePalette();
      },
      shortcut: '@',
    },
    {
      id: 'external-github',
      title: 'GitHub Profile',
      subtitle: 'github.com/jsbalabat',
      category: 'Contact',
      icon: 'external',
      action: () => {
        window.open('https://github.com/jsbalabat', '_blank');
        closePalette();
      },
      shortcut: 'GH',
    },
    {
      id: 'external-linkedin',
      title: 'LinkedIn Profile',
      subtitle: 'linkedin.com/in/marc-balabat',
      category: 'Contact',
      icon: 'external',
      action: () => {
        window.open('https://www.linkedin.com/in/marc-balabat', '_blank');
        closePalette();
      },
      shortcut: 'IN',
    },
  ];

  const filtered = commands.filter((cmd) => {
    const q = query.toLowerCase().trim();
    return (
      cmd.title.toLowerCase().includes(q) ||
      (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q)) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  const closePalette = useCallback(() => {
    if (isClosingRef.current || !isOpen) return;
    isClosingRef.current = true;
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      isClosingRef.current = false;
      setQuery('');
    }, 220);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          closePalette();
        } else {
          isClosingRef.current = false;
          setIsClosing(false);
          setIsOpen(true);
        }
      } else if (e.key === 'Escape' && isOpen && !isClosingRef.current) {
        closePalette();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closePalette]);

  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflowY = 'scroll';
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
      setSelectedIndex(0);
    } else {
      document.documentElement.style.overflowY = '';
      document.body.style.overflow = '';
    }

    return () => {
      document.documentElement.style.overflowY = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Auto-scroll results list to follow actively highlighted item
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const container = listRef.current;
    const item = container.children[selectedIndex] as HTMLElement;
    if (!item) return;

    if (selectedIndex === 0) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const padding = 8; // 8px buffer (matching p-2) to ensure items have breathing room and are never covered by the search bar
    const itemTop = item.offsetTop;
    const itemBottom = itemTop + item.offsetHeight;
    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;

    if (itemTop - padding < containerTop) {
      container.scrollTo({ top: Math.max(0, itemTop - padding), behavior: 'smooth' });
    } else if (itemBottom + padding > containerBottom) {
      container.scrollTo({
        top: Math.min(
          container.scrollHeight - container.clientHeight,
          itemBottom + padding - container.clientHeight
        ),
        behavior: 'smooth',
      });
    }
  }, [selectedIndex, isOpen]);

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

  const renderIcon = (icon: CommandItem['icon']) => {
    switch (icon) {
      case 'document':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        );
      case 'compass':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
        );
      case 'eye':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        );
      case 'theme':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
        );
      case 'mail':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        );
      case 'external':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          </svg>
        );
    }
  };

  return (
    <>
      {/* Trigger Button in Navigation */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/80 bg-surface hover:bg-surface-raised active:scale-[0.96] hover:border-border transition-all duration-200 text-xs font-mono text-text-muted hover:text-text shadow-xs cursor-pointer"
        aria-label="Open Command Palette"
        title="Search projects, navigation, and actions"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3.5 h-3.5 text-accent opacity-80 group-hover:opacity-100"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="px-1.5 py-0.5 rounded bg-surface-raised border border-border/80 text-[10px] text-text-muted font-mono group-hover:text-text transition-colors">
          {isMac ? '⌘K' : 'Ctrl K'}
        </kbd>
      </button>

      {/* Modal Dialog Portaled to document.body */}
      {mounted && isOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="command-palette-input"
          className={`fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs ${
            isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop'
          }`}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closePalette();
            }
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closePalette();
            }
          }}
        >
          <div
            className={`w-full max-w-xl rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden font-mono text-sm text-text ${
              isClosing ? 'animate-modal-content-out' : 'animate-modal-content'
            }`}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="p-3 sm:p-3.5 border-b border-border/70 flex items-center gap-3 bg-surface-raised/40">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-accent shrink-0"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                ref={inputRef}
                id="command-palette-input"
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyNavigation}
                placeholder="Search case studies, jump to sections, or actions..."
                className="flex-1 bg-transparent border-none outline-none text-text placeholder:text-text-muted/60 text-xs sm:text-sm font-mono"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-xs text-text-muted hover:text-text p-1 cursor-pointer"
                  aria-label="Clear search input"
                >
                  ✕
                </button>
              )}
              <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-surface-raised border border-border text-text-muted font-mono shrink-0">
                esc
              </kbd>
            </div>

            {/* Results List (Auto-scrolls to follow highlighted item) */}
            <div ref={listRef} className="relative max-h-80 sm:max-h-96 overflow-y-auto p-2 space-y-1">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-xs text-text-muted space-y-1">
                  <p className="font-semibold text-text">No matching commands found</p>
                  <p className="text-[11px]">Try searching for &quot;ledgerly&quot;, &quot;tldr&quot;, or &quot;contact&quot;.</p>
                </div>
              ) : (
                filtered.map((cmd, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      onClick={() => cmd.action()}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all duration-150 active:scale-[0.98] cursor-pointer relative group border ${
                        isSelected
                          ? 'bg-accent/15 text-text border-accent/40 shadow-xs'
                          : 'text-text-muted hover:bg-surface-raised border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`p-1.5 rounded-md shrink-0 transition-colors border ${
                            isSelected
                              ? 'bg-accent text-accent-text border-accent'
                              : 'bg-surface-raised text-accent border-border/60'
                          }`}
                        >
                          {renderIcon(cmd.icon)}
                        </span>
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm text-text font-medium truncate">
                              {cmd.title}
                            </span>
                            <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-surface border border-border/50 text-text-muted shrink-0">
                              {cmd.category}
                            </span>
                          </div>
                          {cmd.subtitle && (
                            <p className="text-[11px] text-text-muted truncate mt-0.5">
                              {cmd.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      {cmd.shortcut && (
                        <div className="ml-3 shrink-0">
                          <kbd
                            className={`px-2 py-0.5 rounded text-[10px] font-mono tabular-nums transition-colors border font-semibold ${
                              isSelected
                                ? 'bg-accent text-accent-text border-accent shadow-xs'
                                : 'bg-surface-raised border-border text-text-muted'
                            }`}
                          >
                            {cmd.shortcut}
                          </kbd>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Navigation Hints */}
            <div className="px-3.5 py-2.5 border-t border-border/60 bg-surface-raised/40 flex items-center justify-between text-[11px] text-text-muted">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.2 rounded bg-surface border border-border text-[9px]">↑</kbd>
                  <kbd className="px-1 py-0.2 rounded bg-surface border border-border text-[9px]">↓</kbd>
                  <span className="text-[10px]">Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.2 rounded bg-surface border border-border text-[9px]">↵</kbd>
                  <span className="text-[10px]">Select</span>
                </span>
              </div>
              <span className="text-[10px] text-text-muted/80 tabular-nums">
                {filtered.length} {filtered.length === 1 ? 'action' : 'actions'}
              </span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
