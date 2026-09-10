import { useState, useRef, useCallback } from 'react';

export default function ArchitectureDiffSlider() {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'before' | 'after'>('split');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(4, Math.min(96, (x / rect.width) * 100));
    setSliderPos(percent);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  };

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
      {/* Header with Tabs and Controls */}
      <div className="p-4 sm:p-5 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-raised/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-accent uppercase tracking-wider">Architecture Case Study</span>
            <span className="text-text-muted text-xs">•</span>
            <span className="text-sm font-semibold text-text">UnitKo Relational Schema Normalization</span>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Comparing the original 1NF violation against the normalized 3NF schema enabling Postgres Row-Level Security.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg border border-border bg-surface text-xs font-mono self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 rounded transition-colors ${
              viewMode === 'split' ? 'bg-accent text-accent-text font-semibold' : 'text-text-muted hover:text-text'
            }`}
          >
            Split Slider
          </button>
          <button
            type="button"
            onClick={() => setViewMode('before')}
            className={`px-2.5 py-1 rounded transition-colors ${
              viewMode === 'before' ? 'bg-accent text-accent-text font-semibold' : 'text-text-muted hover:text-text'
            }`}
          >
            Before (v1)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('after')}
            className={`px-2.5 py-1 rounded transition-colors ${
              viewMode === 'after' ? 'bg-accent text-accent-text font-semibold' : 'text-text-muted hover:text-text'
            }`}
          >
            After (v2)
          </button>
        </div>
      </div>

      {/* File Tab Header */}
      <div className="px-4 py-2 border-b border-border/50 bg-surface-card flex items-center justify-between text-xs font-mono text-text-muted">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-text font-medium">
            <span className="w-2 h-2 rounded-full bg-accent"></span>
            schema-migration.sql
          </span>
          <span className="text-[11px] text-text-muted/70">Supabase / PostgreSQL</span>
        </div>
        <div className="text-[11px]">
          {viewMode === 'split' ? 'Drag slider left/right or tap view tabs' : `${viewMode.toUpperCase()} view active`}
        </div>
      </div>

      {/* Code Workspace Container */}
      <div
        ref={containerRef}
        onMouseDown={() => {
          setViewMode('split');
          setIsDragging(true);
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={() => {
          setViewMode('split');
          setIsDragging(true);
        }}
        onTouchEnd={() => setIsDragging(false)}
        onTouchMove={handleTouchMove}
        className="relative w-full h-[320px] sm:h-[350px] overflow-hidden select-none cursor-ew-resize bg-[#141b18] text-[#f5e4d7]"
      >
        {/* BEFORE VIEW (Background Layer) */}
        {(viewMode === 'split' || viewMode === 'before') && (
          <div className="absolute inset-0 p-5 font-mono text-xs overflow-y-auto leading-relaxed">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-red-950/60 border border-red-800/60 text-red-300 font-semibold text-[11px] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
              v1.0 (Flawed): Denormalized JSONB Array Column
            </div>
            
            <div className="space-y-1 text-slate-300">
              <p className="text-slate-500">-- 1. Units table held nested resident data inside an array</p>
              <p className="text-rose-300 font-medium">CREATE TABLE units (</p>
              <p className="pl-4 text-slate-300">id uuid PRIMARY KEY DEFAULT gen_random_uuid(),</p>
              <p className="pl-4 text-slate-300">property_id uuid NOT NULL,</p>
              <p className="pl-4 text-slate-300">unit_number text NOT NULL,</p>
              <p className="pl-4 text-rose-300 bg-red-950/40 py-0.5 px-1 rounded">
                residents jsonb[] -- ❌ VIOLATION: First Normal Form broken
              </p>
              <p className="text-rose-300">);</p>
              <p className="text-slate-500 pt-2">-- 2. Problem: Postgres Row-Level Security operates on table rows.</p>
              <p className="text-slate-500">-- A tenant cannot be granted a security policy for an element</p>
              <p className="text-slate-500">-- inside a JSON array. Any landlord/tenant read exposed all occupants.</p>
            </div>

            <div className="mt-6 p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-[11px] text-red-200">
              <strong>Failure Mode:</strong> Excess payments in the waterfall could not be ledgered per resident, causing payments to disappear from monthly reconciliation calculations.
            </div>
          </div>
        )}

        {/* AFTER VIEW (Clipped Layer) */}
        {(viewMode === 'split' || viewMode === 'after') && (
          <div
            className="absolute inset-0 p-5 font-mono text-xs overflow-y-auto leading-relaxed bg-[#18211d] text-[#f5e4d7] border-r-2 border-accent"
            style={{ width: viewMode === 'after' ? '100%' : `${sliderPos}%` }}
          >
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 font-semibold text-[11px] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              v2.0 (Fixed): 3NF Normalization + Row-Level Security
            </div>

            <div className="space-y-1 text-slate-300">
              <p className="text-slate-500">-- 1. Fully normalized unit and tenancy entities</p>
              <p className="text-emerald-300 font-medium">CREATE TABLE units (</p>
              <p className="pl-4 text-slate-300">id uuid PRIMARY KEY DEFAULT gen_random_uuid(),</p>
              <p className="pl-4 text-slate-300">property_id uuid REFERENCES properties(id),</p>
              <p className="pl-4 text-slate-300">unit_number text NOT NULL</p>
              <p className="text-emerald-300">);</p>
              
              <p className="text-emerald-300 font-medium pt-2">CREATE TABLE tenancy_residents (</p>
              <p className="pl-4 text-slate-300">id uuid PRIMARY KEY DEFAULT gen_random_uuid(),</p>
              <p className="pl-4 text-emerald-300 bg-emerald-950/40 py-0.5 px-1 rounded">unit_id uuid REFERENCES units(id) ON DELETE CASCADE,</p>
              <p className="pl-4 text-emerald-300 bg-emerald-950/40 py-0.5 px-1 rounded">user_id uuid REFERENCES auth.users(id)</p>
              <p className="text-emerald-300">);</p>

              <p className="text-slate-500 pt-2">-- 2. Real Row-Level Security isolation policy</p>
              <p className="text-emerald-400 font-medium">CREATE POLICY tenant_isolation_policy ON units</p>
              <p className="pl-4 text-slate-300">FOR SELECT USING (</p>
              <p className="pl-8 text-emerald-300">id IN (SELECT unit_id FROM tenancy_residents WHERE user_id = auth.uid())</p>
              <p className="pl-4 text-slate-300">);</p>
            </div>

            <div className="mt-6 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-200">
              <strong>Architectural Result:</strong> Row-level isolation enforced at database engine boundary. Each payment allocation is stored as its own record, preventing excess cash disappearance.
            </div>
          </div>
        )}

        {/* Tactile Handle Slider */}
        {viewMode === 'split' && (
          <div
            className="absolute top-0 bottom-0 w-8 -ml-4 flex items-center justify-center cursor-ew-resize pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="w-7 h-7 rounded-full bg-accent text-accent-text shadow-lg flex items-center justify-center text-xs font-bold ring-4 ring-black/40">
              ↔
            </div>
          </div>
        )}
      </div>

      {/* Footer explanation strip */}
      <div className="p-4 bg-surface-card border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-text-muted">
        <div>
          <span>Root Cause: </span>
          <span className="text-text font-semibold">Row-level security can only protect things that are rows.</span>
        </div>
        <div className="text-[11px] text-accent font-semibold">
          14-Month Engineering Takeaway
        </div>
      </div>
    </div>
  );
}
