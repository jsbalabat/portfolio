import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export function AdminExitNav() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <nav
      style={{
        position: 'fixed',
        bottom: '1.25rem',
        right: '1.25rem',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}
      aria-label="Admin Exit Navigation"
    >
      <a
        href="/blog"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.45rem 0.85rem',
          borderRadius: '9999px',
          background: 'rgba(24, 25, 28, 0.95)',
          color: '#e4e4e7',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          textDecoration: 'none',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#ff5722';
          e.currentTarget.style.color = '#ffffff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          e.currentTarget.style.color = '#e4e4e7';
        }}
      >
        <span>←</span>
        <span>Articles</span>
      </a>

      <a
        href="/#blog"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.45rem 0.85rem',
          borderRadius: '9999px',
          background: 'rgba(24, 25, 28, 0.95)',
          color: '#e4e4e7',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          textDecoration: 'none',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#ff5722';
          e.currentTarget.style.color = '#ffffff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          e.currentTarget.style.color = '#e4e4e7';
        }}
      >
        <span>Portfolio</span>
      </a>
    </nav>,
    document.body
  );
}

export function AdminBrandMark() {
  return (
    <>
      <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#ff5722" />
        <path d="M10 22V10L16 17L22 10V22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <AdminExitNav />
    </>
  );
}
