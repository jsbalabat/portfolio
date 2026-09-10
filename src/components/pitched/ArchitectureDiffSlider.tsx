import { useState, useRef, useEffect } from 'react';

type ScenarioId = 'unitko' | 'ledgerly' | 'tell-health';
type ViewMode = 'split' | 'before' | 'after';

interface CodeLine {
  num: number;
  text: string;
  type?: 'added' | 'removed' | 'comment' | 'normal';
}

interface ScenarioData {
  id: ScenarioId;
  title: string;
  project: string;
  badge: string;
  fileName: string;
  language: string;
  summary: string;
  takeaway: {
    rootCause: string;
    lesson: string;
  };
  before: {
    label: string;
    description: string;
    failureMode: string;
    lines: CodeLine[];
    raw: string;
  };
  after: {
    label: string;
    description: string;
    result: string;
    lines: CodeLine[];
    raw: string;
  };
}

const SCENARIOS: Record<ScenarioId, ScenarioData> = {
  unitko: {
    id: 'unitko',
    project: 'UnitKo',
    title: 'Relational Schema Normalization & Postgres RLS',
    badge: '1NF Violation vs 3NF RLS',
    fileName: '001_schema_normalization.sql',
    language: 'SQL',
    summary: 'Rewriting a non-1NF database to normalized 3NF PostgreSQL tables to enforce tenant-level Row-Level Security.',
    takeaway: {
      rootCause: 'Row-level security can only protect things that are rows.',
      lesson: 'Store multi-tenant allocations as independent entities to prevent waterfall cash disappearance.',
    },
    before: {
      label: 'v1.0 (Flawed): Denormalized JSONB Array',
      description: 'Tenancy occupant objects stored in an unindexed JSONB array column inside units.',
      failureMode: 'Postgres RLS operates on rows. A tenant cannot be granted an RLS policy for an element inside a JSON array. Reads exposed all co-occupants, and waterfall cash allocations disappeared from reconciliation.',
      lines: [
        { num: 1, text: '-- 1. Units table held nested resident data inside an array', type: 'comment' },
        { num: 2, text: 'CREATE TABLE units (', type: 'normal' },
        { num: 3, text: '  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),', type: 'normal' },
        { num: 4, text: '  property_id uuid NOT NULL,', type: 'normal' },
        { num: 5, text: '  unit_number text NOT NULL,', type: 'normal' },
        { num: 6, text: '  residents jsonb[] -- ❌ VIOLATION: First Normal Form broken', type: 'removed' },
        { num: 7, text: ');', type: 'normal' },
        { num: 8, text: '', type: 'normal' },
        { num: 9, text: '-- 2. Problem: Postgres Row-Level Security operates on table rows.', type: 'comment' },
        { num: 10, text: '-- A tenant cannot be granted an isolation policy for an element', type: 'comment' },
        { num: 11, text: '-- inside a JSON array. Any landlord/tenant read exposed all occupants.', type: 'comment' },
      ],
      raw: `-- 1. Units table held nested resident data inside an array\nCREATE TABLE units (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  property_id uuid NOT NULL,\n  unit_number text NOT NULL,\n  residents jsonb[] -- ❌ VIOLATION: First Normal Form broken\n);\n\n-- 2. Problem: Postgres Row-Level Security operates on table rows.\n-- A tenant cannot be granted an isolation policy for an element\n-- inside a JSON array. Any landlord/tenant read exposed all occupants.`,
    },
    after: {
      label: 'v2.0 (Fixed): 3NF Normalization + Postgres RLS',
      description: 'Extracted separate tenancy_residents join table with declarative auth policies.',
      result: 'Row-level isolation enforced at the database engine boundary. Each payment allocation is stored as its own record, preventing excess cash disappearance.',
      lines: [
        { num: 1, text: '-- 1. Fully normalized unit and tenancy entities', type: 'comment' },
        { num: 2, text: 'CREATE TABLE units (', type: 'normal' },
        { num: 3, text: '  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),', type: 'normal' },
        { num: 4, text: '  property_id uuid REFERENCES properties(id),', type: 'normal' },
        { num: 5, text: '  unit_number text NOT NULL', type: 'normal' },
        { num: 6, text: ');', type: 'normal' },
        { num: 7, text: '', type: 'normal' },
        { num: 8, text: 'CREATE TABLE tenancy_residents (', type: 'added' },
        { num: 9, text: '  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),', type: 'added' },
        { num: 10, text: '  unit_id uuid REFERENCES units(id) ON DELETE CASCADE,', type: 'added' },
        { num: 11, text: '  user_id uuid REFERENCES auth.users(id)', type: 'added' },
        { num: 12, text: ');', type: 'added' },
        { num: 13, text: '', type: 'normal' },
        { num: 14, text: '-- 2. Declarative Row-Level Security isolation policy', type: 'comment' },
        { num: 15, text: 'CREATE POLICY tenant_isolation_policy ON units', type: 'added' },
        { num: 16, text: '  FOR SELECT USING (', type: 'added' },
        { num: 17, text: '    id IN (SELECT unit_id FROM tenancy_residents WHERE user_id = auth.uid())', type: 'added' },
        { num: 18, text: '  );', type: 'added' },
      ],
      raw: `-- 1. Fully normalized unit and tenancy entities\nCREATE TABLE units (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  property_id uuid REFERENCES properties(id),\n  unit_number text NOT NULL\n);\n\nCREATE TABLE tenancy_residents (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  unit_id uuid REFERENCES units(id) ON DELETE CASCADE,\n  user_id uuid REFERENCES auth.users(id)\n);\n\n-- 2. Declarative Row-Level Security isolation policy\nCREATE POLICY tenant_isolation_policy ON units\n  FOR SELECT USING (\n    id IN (SELECT unit_id FROM tenancy_residents WHERE user_id = auth.uid())\n  );`,
    },
  },
  ledgerly: {
    id: 'ledgerly',
    project: 'Ledgerly',
    title: 'Idempotent Payment Waterfall vs Client Write Race',
    badge: 'Client Race vs Transactional Ledger',
    fileName: 'process_invoice_waterfall.ts',
    language: 'TypeScript',
    summary: 'Replacing direct client-side Firestore document updates with an idempotent Cloud Function transaction.',
    takeaway: {
      rootCause: 'Financial invariants cannot be trusted to mobile network timing.',
      lesson: 'Always settle multi-line invoice reconciliations at server transaction boundaries with idempotency keys.',
    },
    before: {
      label: 'v1.0 (Flawed): Unbatched Client Firestore Writes',
      description: 'Flutter mobile client read balance, calculated remaining balance locally, and wrote back to Firestore.',
      failureMode: 'If two billing clerks applied payments concurrently or network retried on unstable connection, balance dropped below zero and surplus payment allocations vanished.',
      lines: [
        { num: 1, text: '// ❌ Flawed: Client-side unbatched Firestore writes', type: 'comment' },
        { num: 2, text: 'async function processInvoicePayment(invoiceId: string, amount: number) {', type: 'normal' },
        { num: 3, text: '  // 1. Read balance on client device', type: 'normal' },
        { num: 4, text: '  const invoice = await getDoc(doc(db, "invoices", invoiceId));', type: 'normal' },
        { num: 5, text: '  const currentBalance = invoice.data().remainingBalance;', type: 'normal' },
        { num: 6, text: '', type: 'normal' },
        { num: 7, text: '  // 2. Race condition: Concurrent writes corrupt ledger balance', type: 'removed' },
        { num: 8, text: '  await updateDoc(doc(db, "invoices", invoiceId), {', type: 'removed' },
        { num: 9, text: '    remainingBalance: currentBalance - amount,', type: 'removed' },
        { num: 10, text: '    status: currentBalance - amount <= 0 ? "PAID" : "PARTIAL"', type: 'removed' },
        { num: 11, text: '  });', type: 'removed' },
        { num: 12, text: '}', type: 'normal' },
      ],
      raw: `// ❌ Flawed: Client-side unbatched Firestore writes\nasync function processInvoicePayment(invoiceId: string, amount: number) {\n  // 1. Read balance on client device\n  const invoice = await getDoc(doc(db, "invoices", invoiceId));\n  const currentBalance = invoice.data().remainingBalance;\n\n  // 2. Race condition: Concurrent writes corrupt ledger balance\n  await updateDoc(doc(db, "invoices", invoiceId), {\n    remainingBalance: currentBalance - amount,\n    status: currentBalance - amount <= 0 ? "PAID" : "PARTIAL"\n  });\n}`,
    },
    after: {
      label: 'v2.0 (Fixed): Idempotent Cloud Transaction',
      description: 'Serverless transaction with atomic balance deduction and idempotency deduplication.',
      result: 'Cleared ~150 invoices/day across 6 distribution companies with 100% reconciliation accuracy and zero double-charge anomalies.',
      lines: [
        { num: 1, text: '// ✅ Fixed: Idempotent Cloud Function with database transaction', type: 'comment' },
        { num: 2, text: 'export const processPayment = onCall(async (req) => {', type: 'added' },
        { num: 3, text: '  const { invoiceId, amount, idempotencyKey } = req.data;', type: 'added' },
        { num: 4, text: '  return await db.runTransaction(async (tx) => {', type: 'added' },
        { num: 5, text: '    const ref = db.collection("invoices").doc(invoiceId);', type: 'added' },
        { num: 6, text: '    const snap = await tx.get(ref);', type: 'added' },
        { num: 7, text: '    if (snap.data().processedKeys?.includes(idempotencyKey)) {', type: 'added' },
        { num: 8, text: '      return { status: "DUPLICATE_IGNORED" }; // Deduplicate retry', type: 'added' },
        { num: 9, text: '    }', type: 'added' },
        { num: 10, text: '    const newBal = Math.max(0, snap.data().balance - amount);', type: 'added' },
        { num: 11, text: '    tx.update(ref, {', type: 'added' },
        { num: 12, text: '      balance: newBal,', type: 'added' },
        { num: 13, text: '      status: newBal === 0 ? "PAID" : "PARTIAL",', type: 'added' },
        { num: 14, text: '      processedKeys: FieldValue.arrayUnion(idempotencyKey)', type: 'added' },
        { num: 15, text: '    });', type: 'added' },
        { num: 16, text: '  });', type: 'added' },
        { num: 17, text: '});', type: 'added' },
      ],
      raw: `// ✅ Fixed: Idempotent Cloud Function with database transaction\nexport const processPayment = onCall(async (req) => {\n  const { invoiceId, amount, idempotencyKey } = req.data;\n  return await db.runTransaction(async (tx) => {\n    const ref = db.collection("invoices").doc(invoiceId);\n    const snap = await tx.get(ref);\n    if (snap.data().processedKeys?.includes(idempotencyKey)) {\n      return { status: "DUPLICATE_IGNORED" }; // Deduplicate retry\n    }\n    const newBal = Math.max(0, snap.data().balance - amount);\n    tx.update(ref, {\n      balance: newBal,\n      status: newBal === 0 ? "PAID" : "PARTIAL",\n      processedKeys: FieldValue.arrayUnion(idempotencyKey)\n    });\n  });\n});`,
    },
  },
  'tell-health': {
    id: 'tell-health',
    project: 'TellHealth',
    title: 'Deterministic Schema Guardrails vs Unchecked LLM Output',
    badge: 'Raw Prompt vs Zod Guardrails',
    fileName: 'triage_routing_pipeline.ts',
    language: 'TypeScript',
    summary: 'Replacing unconstrained free-text LLM completions with regex PII sanitization and Zod structured JSON schema guardrails.',
    takeaway: {
      rootCause: 'Clinical workflow engines cannot tolerate stochastic text formats.',
      lesson: 'Deterministic schema parsing with strict validation prevents hallucinations from reaching triage queues.',
    },
    before: {
      label: 'v1.0 (Flawed): Unconstrained LLM Text Prompt',
      description: 'Raw clinical notes directly passed to OpenAI completion endpoint without PII redaction.',
      failureMode: 'The model hallucinated unofficial urgency classifications, produced unparseable markdown formatting, and risked leaking patient PHI into log sinks.',
      lines: [
        { num: 1, text: '// ❌ Flawed: Unconstrained LLM free-text completion', type: 'comment' },
        { num: 2, text: 'async function triageNotes(rawNotes: string) {', type: 'normal' },
        { num: 3, text: '  const prompt = `Assess patient urgency: ${rawNotes}`;', type: 'normal' },
        { num: 4, text: '', type: 'normal' },
        { num: 5, text: '  // Failure Mode: Hallucinated categories & unmasked PII leakage', type: 'removed' },
        { num: 6, text: '  const response = await openai.chat.completions.create({', type: 'removed' },
        { num: 7, text: '    model: "gpt-4o",', type: 'removed' },
        { num: 8, text: '    messages: [{ role: "user", content: prompt }]', type: 'removed' },
        { num: 9, text: '  });', type: 'removed' },
        { num: 10, text: '  return response.choices[0].message.content; // Unpredictable string', type: 'removed' },
        { num: 11, text: '}', type: 'normal' },
      ],
      raw: `// ❌ Flawed: Unconstrained LLM free-text completion\nasync function triageNotes(rawNotes: string) {\n  const prompt = \`Assess patient urgency: \${rawNotes}\`;\n\n  // Failure Mode: Hallucinated categories & unmasked PII leakage\n  const response = await openai.chat.completions.create({\n    model: "gpt-4o",\n    messages: [{ role: "user", content: prompt }]\n  });\n  return response.choices[0].message.content; // Unpredictable string\n}`,
    },
    after: {
      label: 'v2.0 (Fixed): PII Scrub + Zod Schema Guardrails',
      description: 'Client sanitization pass followed by OpenAI Structured Outputs matching strict Zod contract.',
      result: 'Retained in 25 of 58 cohort candidates across 6-day sprint. Hard guardrails prevent non-standard triage tags from entering medical queues.',
      lines: [
        { num: 1, text: '// ✅ Fixed: PII sanitization + Zod structured schema enforcement', type: 'comment' },
        { num: 2, text: 'const TriageSchema = z.object({', type: 'added' },
        { num: 3, text: '  urgency: z.enum(["ROUTINE", "URGENT", "EMERGENCY_ESCALATE"]),', type: 'added' },
        { num: 4, text: '  symptoms: z.array(z.string()),', type: 'added' },
        { num: 5, text: '  redFlag: z.boolean()', type: 'added' },
        { num: 6, text: '});', type: 'added' },
        { num: 7, text: '', type: 'normal' },
        { num: 8, text: 'async function triageNotes(rawNotes: string) {', type: 'added' },
        { num: 9, text: '  const scrubbed = scrubSensitiveIdentifiers(rawNotes);', type: 'added' },
        { num: 10, text: '  const res = await openai.beta.chat.completions.parse({', type: 'added' },
        { num: 11, text: '    model: "gpt-4o",', type: 'added' },
        { num: 12, text: '    messages: [{ role: "system", content: TRIAGE_PROMPT }, { role: "user", content: scrubbed }],', type: 'added' },
        { num: 13, text: '    response_format: zodResponseFormat(TriageSchema, "triage")', type: 'added' },
        { num: 14, text: '  });', type: 'added' },
        { num: 15, text: '  return res.choices[0].message.parsed; // Guaranteed typed object', type: 'added' },
        { num: 16, text: '}', type: 'added' },
      ],
      raw: `// ✅ Fixed: PII sanitization + Zod structured schema enforcement\nconst TriageSchema = z.object({\n  urgency: z.enum(["ROUTINE", "URGENT", "EMERGENCY_ESCALATE"]),\n  symptoms: z.array(z.string()),\n  redFlag: z.boolean()\n});\n\nasync function triageNotes(rawNotes: string) {\n  const scrubbed = scrubSensitiveIdentifiers(rawNotes);\n  const res = await openai.beta.chat.completions.parse({\n    model: "gpt-4o",\n    messages: [{ role: "system", content: TRIAGE_PROMPT }, { role: "user", content: scrubbed }],\n    response_format: zodResponseFormat(TriageSchema, "triage")\n  });\n  return res.choices[0].message.parsed; // Guaranteed typed object\n}`,
    },
  },
};

export default function ArchitectureDiffSlider() {
  const [activeScenario, setActiveScenario] = useState<ScenarioId>('unitko');
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const scenario = SCENARIOS[activeScenario];

  // Global window pointer listeners allowing 0% to 100% sliding smoothly
  useEffect(() => {
    if (!isDragging) return;

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPos(percent);
    };

    const onPointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);

    return () => {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    };
  }, [isDragging]);

  // Click or drag initiation from either side of the container
  const handlePointerDown = (clientX: number) => {
    if (viewMode !== 'split' || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
    setIsDragging(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (viewMode !== 'split') return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSliderPos((prev) => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSliderPos((prev) => Math.min(100, prev + 5));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setSliderPos(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setSliderPos(100);
    }
  };

  const handleCopy = () => {
    const codeToCopy =
      viewMode === 'before'
        ? scenario.before.raw
        : viewMode === 'after'
        ? scenario.after.raw
        : `/* --- BEFORE (v1) --- */\n${scenario.before.raw}\n\n/* --- AFTER (v2) --- */\n${scenario.after.raw}`;

    navigator.clipboard.writeText(codeToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-md overflow-hidden transition-all text-text">
      {/* Top Architecture Scenario Switcher */}
      <div className="p-4 sm:p-5 border-b border-border/70 bg-surface-raised/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[11px] font-bold text-accent uppercase tracking-wider">
              Architecture Playground
            </span>
            <span className="text-text-muted text-xs">•</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-surface border border-border text-accent">
              {scenario.badge}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-text tracking-tight">
            {scenario.project} — {scenario.title}
          </h3>
          <p className="text-xs text-text-muted mt-0.5 max-w-2xl">
            {scenario.summary}
          </p>
        </div>

        {/* Scenario Tab Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl border border-border bg-surface text-xs font-mono self-start lg:self-auto">
          {(['unitko', 'ledgerly', 'tell-health'] as ScenarioId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActiveScenario(id);
                setSliderPos(50);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                activeScenario === id
                  ? 'bg-accent text-accent-text shadow-xs'
                  : 'text-text-muted hover:text-text hover:bg-surface-raised'
              }`}
            >
              {SCENARIOS[id].project}
            </button>
          ))}
        </div>
      </div>

      {/* Editor Window Chrome */}
      <div className="px-4 py-2.5 border-b border-border/60 bg-[#101613] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* File Tab & Window Dots */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 pr-2 border-r border-border/40">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e57373]/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffb74d]/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#81c784]/80"></span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            <span className="font-semibold">{scenario.fileName}</span>
            <span className="text-[10px] text-slate-400 uppercase">({scenario.language})</span>
          </div>
        </div>

        {/* View Mode & Preset Controls (0% to 100%) */}
        <div className="flex items-center gap-2">
          {/* Quick Presets for Split View */}
          {viewMode === 'split' && (
            <div className="hidden sm:flex items-center gap-1 pr-2 border-r border-border/40 text-[11px] text-slate-300">
              <span className="text-[10px] text-slate-400 mr-1">Slide:</span>
              <button
                type="button"
                onClick={() => setSliderPos(0)}
                title="Slide 100% to After (v2)"
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  sliderPos === 0 ? 'bg-emerald-900/60 text-emerald-300 font-bold' : 'hover:text-white'
                }`}
              >
                0%
              </button>
              <button
                type="button"
                onClick={() => setSliderPos(25)}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  sliderPos === 25 ? 'bg-accent/30 text-accent font-bold' : 'hover:text-white'
                }`}
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => setSliderPos(50)}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  sliderPos === 50 ? 'bg-accent/30 text-accent font-bold' : 'hover:text-white'
                }`}
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => setSliderPos(75)}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  sliderPos === 75 ? 'bg-accent/30 text-accent font-bold' : 'hover:text-white'
                }`}
              >
                75%
              </button>
              <button
                type="button"
                onClick={() => setSliderPos(100)}
                title="Slide 100% to Before (v1)"
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  sliderPos === 100 ? 'bg-rose-900/60 text-rose-300 font-bold' : 'hover:text-white'
                }`}
              >
                100%
              </button>
            </div>
          )}

          {/* Mode Tabs */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#18211d] border border-border/40 text-[11px]">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-2 py-0.8 rounded transition-colors cursor-pointer ${
                viewMode === 'split' ? 'bg-accent text-accent-text font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Split
            </button>
            <button
              type="button"
              onClick={() => setViewMode('before')}
              className={`px-2 py-0.8 rounded transition-colors cursor-pointer ${
                viewMode === 'before' ? 'bg-rose-900/70 text-rose-200 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Before
            </button>
            <button
              type="button"
              onClick={() => setViewMode('after')}
              className={`px-2 py-0.8 rounded transition-colors cursor-pointer ${
                viewMode === 'after' ? 'bg-emerald-900/70 text-emerald-200 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              After
            </button>
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-lg border border-border/50 bg-[#18211d] hover:bg-surface-raised text-slate-200 hover:text-white transition-colors cursor-pointer text-[11px] flex items-center gap-1.5"
            title="Copy active code"
          >
            {copied ? (
              <>
                <span className="text-emerald-400">✓</span>
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-accent">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Workspace: Dual-Pane Conforming Diff (Text on BOTH sides conforms to its own pane, never clipped in the middle of a line) */}
      <div
        ref={containerRef}
        onMouseDown={(e) => handlePointerDown(e.clientX)}
        onTouchStart={(e) => handlePointerDown(e.touches[0].clientX)}
        className="relative w-full h-[360px] sm:h-[400px] overflow-hidden select-none bg-[#131a16] text-[#f5e4d7] flex cursor-ew-resize"
        style={{ touchAction: 'none' }}
      >
        {/* BEFORE PANE (Left Column: v1.0 Flawed) */}
        {(viewMode === 'split' || viewMode === 'before') && (
          <div
            className="h-full overflow-y-auto overflow-x-auto p-4 sm:p-5 font-mono text-xs leading-relaxed bg-[#141b17] border-r border-border/40"
            style={{
              width: viewMode === 'before' ? '100%' : `${sliderPos}%`,
              display: viewMode === 'split' && sliderPos === 0 ? 'none' : 'block',
            }}
          >
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-rose-950/80 border border-rose-800/80 text-rose-300 font-semibold text-[11px] mb-3 sticky top-0 z-10 backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              <span>{scenario.before.label}</span>
            </div>

            <div className="space-y-0.5 min-w-max">
              {scenario.before.lines.map((line) => (
                <div
                  key={line.num}
                  className={`flex items-start gap-3 py-0.5 px-1.5 rounded ${
                    line.type === 'removed'
                      ? 'bg-rose-950/50 text-rose-200 border-l-2 border-rose-500'
                      : line.type === 'comment'
                      ? 'text-slate-400'
                      : 'text-slate-200'
                  }`}
                >
                  <span className="w-6 text-right shrink-0 text-slate-500 select-none text-[11px]">
                    {line.num}
                  </span>
                  <span className="font-mono whitespace-pre">{line.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tactile Resizing Divider Handle (Accessible slider) */}
        {viewMode === 'split' && (
          <div
            role="slider"
            tabIndex={0}
            aria-label="Diff comparison slider"
            aria-valuenow={Math.round(sliderPos)}
            aria-valuemin={0}
            aria-valuemax={100}
            onKeyDown={handleKeyDown}
            className="absolute top-0 bottom-0 pointer-events-none z-20"
            style={{ left: `${sliderPos}%` }}
          >
            {/* Divider Line */}
            <div className="absolute top-0 bottom-0 w-1 -ml-0.5 bg-accent shadow-md"></div>

            {/* Handle Grip Center Pill */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-accent text-accent-text shadow-2xl flex items-center justify-center text-xs font-bold ring-4 ring-black/70 pointer-events-auto cursor-ew-resize -translate-x-1/2 hover:scale-110 active:scale-95 transition-transform"
            >
              <span className="select-none">↔</span>
            </div>
          </div>
        )}

        {/* AFTER PANE (Right Column: v2.0 Production Fix) */}
        {(viewMode === 'split' || viewMode === 'after') && (
          <div
            className="h-full overflow-y-auto overflow-x-auto p-4 sm:p-5 font-mono text-xs leading-relaxed bg-[#16201b]"
            style={{
              width: viewMode === 'after' ? '100%' : `${100 - sliderPos}%`,
              display: viewMode === 'split' && sliderPos === 100 ? 'none' : 'block',
            }}
          >
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 font-semibold text-[11px] mb-3 sticky top-0 z-10 backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>{scenario.after.label}</span>
            </div>

            <div className="space-y-0.5 min-w-max">
              {scenario.after.lines.map((line) => (
                <div
                  key={line.num}
                  className={`flex items-start gap-3 py-0.5 px-1.5 rounded ${
                    line.type === 'added'
                      ? 'bg-emerald-950/50 text-emerald-200 border-l-2 border-emerald-500'
                      : line.type === 'comment'
                      ? 'text-slate-400'
                      : 'text-slate-200'
                  }`}
                >
                  <span className="w-6 text-right shrink-0 text-slate-500 select-none text-[11px]">
                    {line.num}
                  </span>
                  <span className="font-mono whitespace-pre">{line.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* High-Contrast Architectural Comparison Callouts */}
      <div className="p-4 sm:p-5 border-t border-border/70 bg-surface-raised/40 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Failure Mode (v1.0) */}
        <div className="p-4 rounded-xl bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 dark:border-rose-700/50 shadow-xs">
          <div className="flex items-center gap-2 mb-2 text-rose-700 dark:text-rose-300 font-bold font-mono text-xs uppercase tracking-wider">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>v1.0 Failure Mode</span>
          </div>
          <p className="text-text font-normal leading-relaxed text-xs">
            {scenario.before.failureMode}
          </p>
        </div>

        {/* Architectural Result (v2.0) */}
        <div className="p-4 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 dark:border-emerald-700/50 shadow-xs">
          <div className="flex items-center gap-2 mb-2 text-emerald-700 dark:text-emerald-300 font-bold font-mono text-xs uppercase tracking-wider">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>v2.0 Architectural Result</span>
          </div>
          <p className="text-text font-normal leading-relaxed text-xs">
            {scenario.after.result}
          </p>
        </div>
      </div>

      {/* Footer Takeaway Callout */}
      <div className="p-4 bg-surface-raised/50 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div>
          <span className="text-accent font-bold uppercase tracking-wider text-xs mr-2">
            Engineering Root Cause:
          </span>
          <span className="text-text font-bold text-xs">{scenario.takeaway.rootCause}</span>
        </div>
        <div className="text-xs text-accent font-semibold shrink-0">
          {scenario.takeaway.lesson}
        </div>
      </div>
    </div>
  );
}
