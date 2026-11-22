import { useState, useId } from 'react';

// ============================================================================
// Types & Scenario Definitions
// ============================================================================

export type ScenarioId = 'clean_480' | 'tax_mismatch' | 'over_1000' | 'duplicate_replay' | 'low_conf_ocr';
export type PipelineStage = 'idle' | 'ingesting' | 'extracting' | 'validating' | 'deciding' | 'complete';
export type DecisionState = 'approved' | 'awaiting_human' | 'rejected' | 'idempotent_hit';

export interface GuardrailRule {
  id: string;
  name: string;
  description: string;
  codeSnippet: string;
  passed: boolean | 'bypassed';
  latencyMs: number;
  expected: string;
  actual: string;
}

export interface AuditEvent {
  id: string;
  timestampOffset: string;
  name: string;
  actor: 'system' | 'ops_analyst' | 'cache_engine';
  fromState?: string;
  toState?: string;
  details: string;
}

export interface ScenarioData {
  id: ScenarioId;
  name: string;
  badge: string;
  shortDesc: string;
  vendor: string;
  vendorEmail: string;
  invoiceNumber: string;
  poNumber: string;
  idempotencyKey: string;
  sha256Hash: string;
  subtotal: number;
  tax: number;
  total: number;
  confidence: number;
  isIdempotentReplay: boolean;
  requiresHITL: boolean;
  hitlReason?: string;
  extractedPayload: Record<string, unknown>;
  guardrails: GuardrailRule[];
  initialEvents: AuditEvent[];
  emailDraft: {
    to: string;
    subject: string;
    body: string;
  };
}

const SCENARIOS: Record<ScenarioId, ScenarioData> = {
  clean_480: {
    id: 'clean_480',
    name: 'Clean $480',
    badge: 'AUTO-APPROVE',
    shortDesc: 'Valid line math & contract match within autonomous threshold.',
    vendor: 'ACME Industrial Sensors Corp',
    vendorEmail: 'ap@acme-sensors.com',
    invoiceNumber: 'INV-2026-0842',
    poNumber: 'PO-8821',
    idempotencyKey: 'idem_clean_480_a7f9',
    sha256Hash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    subtotal: 480.00,
    tax: 0.00,
    total: 480.00,
    confidence: 0.98,
    isIdempotentReplay: false,
    requiresHITL: false,
    extractedPayload: {
      schema_version: '2026-v2',
      invoice_number: 'INV-2026-0842',
      vendor: {
        name: 'ACME Industrial Sensors Corp',
        tax_id: 'US-84-9910291',
        remit_to: '100 Technology Parkway, Austin TX',
      },
      purchase_order: 'PO-8821',
      currency: 'USD',
      line_items: [
        { item: 'Precision Optical Sensor 24V', quantity: 4, unit_price: '120.00', amount: '480.00' },
      ],
      subtotal: '480.00',
      tax_amount: '0.00',
      total_amount: '480.00',
      extraction_confidence: 0.984,
    },
    guardrails: [
      {
        id: 'idem_check',
        name: 'SHA-256 & Idempotency Key Dedup',
        description: 'Verify no previous run matches idempotency key or SHA-256 payload hash',
        codeSnippet: 'assert db.runs.find_one({"idem_key": key}) is None',
        passed: true,
        latencyMs: 0.42,
        expected: 'Cache miss (unique payload)',
        actual: 'Unique SHA-256: 7f83b165... committed',
      },
      {
        id: 'line_sum',
        name: 'Pure-Python Decimal Line Sum Equality',
        description: 'Sum of line item amounts must match stated subtotal identically',
        codeSnippet: 'Decimal(subtotal) == sum(Decimal(i.amount) for i in items)',
        passed: true,
        latencyMs: 0.18,
        expected: 'Decimal("480.00")',
        actual: 'Decimal("480.00") (Exact match)',
      },
      {
        id: 'tax_calc',
        name: 'Tax Jurisdiction Reconciliation',
        description: 'Applied tax must match expected rate formula for shipping jurisdiction',
        codeSnippet: 'Decimal(tax) == Decimal(subtotal) * Decimal("0.00")',
        passed: true,
        latencyMs: 0.15,
        expected: 'Decimal("0.00") [Tax-Exempt]',
        actual: 'Decimal("0.00") (Verified)',
      },
      {
        id: 'po_match',
        name: 'PO Matching & Remaining Balance',
        description: 'Referenced PO must exist, be open, and have sufficient unbilled balance',
        codeSnippet: 'po.status == "OPEN" and po.unbilled >= Decimal(total)',
        passed: true,
        latencyMs: 0.85,
        expected: 'PO-8821 unbilled >= $480.00',
        actual: 'PO-8821 active ($1,500.00 unbilled remaining)',
      },
      {
        id: 'thresholds',
        name: 'Autonomous Guardrail Gates (<= $1,000 & Conf >= 0.90)',
        description: 'Total must not exceed $1,000 threshold and confidence must be >= 0.90',
        codeSnippet: 'total <= Decimal("1000.00") and confidence >= 0.90',
        passed: true,
        latencyMs: 0.08,
        expected: '<= $1,000.00 & Conf >= 0.90',
        actual: '$480.00 total & 0.984 confidence',
      },
    ],
    initialEvents: [
      { id: 'evt_01', timestampOffset: '+0.000s', name: 'webhook.ingested', actor: 'system', fromState: 'none', toState: 'ingested', details: 'Payload received with Idempotency-Key idem_clean_480_a7f9' },
      { id: 'evt_02', timestampOffset: '+0.001s', name: 'dedup.verified', actor: 'system', fromState: 'ingested', toState: 'ingested', details: 'SHA-256 hash evaluated; unique payload registered' },
      { id: 'evt_03', timestampOffset: '+0.003s', name: 'llm.extracted', actor: 'system', fromState: 'ingested', toState: 'extracted', details: 'Pydantic v2 structured JSON parsed (382 tokens, conf: 0.984)' },
      { id: 'evt_04', timestampOffset: '+0.005s', name: 'guardrails.validated', actor: 'system', fromState: 'extracted', toState: 'validated', details: 'All 5 deterministic Python checks passed in 1.68ms' },
      { id: 'evt_05', timestampOffset: '+0.006s', name: 'state.transitioned', actor: 'system', fromState: 'validated', toState: 'approved', details: 'Total <= $1,000.00 autonomous ceiling met. Auto-approved.' },
    ],
    emailDraft: {
      to: 'ap@acme-sensors.com',
      subject: 'Notice: Payment Approved for Invoice INV-2026-0842',
      body: 'Invoice INV-2026-0842 for $480.00 has been verified against Purchase Order PO-8821 and approved for scheduled disbursement.',
    },
  },

  tax_mismatch: {
    id: 'tax_mismatch',
    name: 'Tax Mismatch',
    badge: 'HITL GATE',
    shortDesc: 'Stated line item math differs by $25 from stated invoice total.',
    vendor: 'Apex Logistics Ltd',
    vendorEmail: 'billing@apexlogistics.com',
    invoiceNumber: 'INV-2026-1194',
    poNumber: 'PO-9402',
    idempotencyKey: 'idem_tax_mismatch_b3c2',
    sha256Hash: '3b49e1029c0182dd8f12a144e0b519ef726a84d284a0c8b91340fa189c45012a',
    subtotal: 500.00,
    tax: 25.00,
    total: 550.00,
    confidence: 0.95,
    isIdempotentReplay: false,
    requiresHITL: true,
    hitlReason: 'Arithmetic Discrepancy: Subtotal ($500.00) + Stated Tax ($25.00) = $525.00, but invoice claims $550.00 total. Pure-Python Decimal validation halted execution.',
    extractedPayload: {
      schema_version: '2026-v2',
      invoice_number: 'INV-2026-1194',
      vendor: {
        name: 'Apex Logistics Ltd',
        tax_id: 'US-91-8841029',
        remit_to: '450 Harbor Boulevard, Long Beach CA',
      },
      purchase_order: 'PO-9402',
      currency: 'USD',
      line_items: [
        { item: 'Intermodal Container Drayage', quantity: 1, unit_price: '500.00', amount: '500.00' },
      ],
      subtotal: '500.00',
      tax_amount: '25.00',
      total_amount: '550.00',
      extraction_confidence: 0.952,
    },
    guardrails: [
      {
        id: 'idem_check',
        name: 'SHA-256 & Idempotency Key Dedup',
        description: 'Verify no previous run matches idempotency key or SHA-256 payload hash',
        codeSnippet: 'assert db.runs.find_one({"idem_key": key}) is None',
        passed: true,
        latencyMs: 0.38,
        expected: 'Cache miss',
        actual: 'Unique SHA-256: 3b49e102... registered',
      },
      {
        id: 'line_sum',
        name: 'Pure-Python Decimal Line Sum Equality',
        description: 'Sum of line item amounts must match stated subtotal identically',
        codeSnippet: 'Decimal(subtotal) == sum(Decimal(i.amount) for i in items)',
        passed: true,
        latencyMs: 0.16,
        expected: 'Decimal("500.00")',
        actual: 'Decimal("500.00") (Passed)',
      },
      {
        id: 'tax_calc',
        name: 'Tax Jurisdiction Reconciliation & Total Math',
        description: 'Subtotal plus tax must equal stated invoice total amount',
        codeSnippet: 'Decimal(subtotal) + Decimal(tax) == Decimal(total)',
        passed: false,
        latencyMs: 0.14,
        expected: 'Decimal("525.00")',
        actual: 'Decimal("550.00") (MISMATCH: +$25.00 delta)',
      },
      {
        id: 'po_match',
        name: 'PO Matching & Remaining Balance',
        description: 'Referenced PO must exist, be open, and have sufficient unbilled balance',
        codeSnippet: 'po.status == "OPEN" and po.unbilled >= Decimal(total)',
        passed: true,
        latencyMs: 0.92,
        expected: 'PO-9402 valid',
        actual: 'PO-9402 found ($800.00 unbilled balance)',
      },
      {
        id: 'thresholds',
        name: 'Autonomous Guardrail Gates (<= $1,000 & Conf >= 0.90)',
        description: 'Total must not exceed $1,000 threshold and confidence must be >= 0.90',
        codeSnippet: 'total <= Decimal("1000.00") and confidence >= 0.90',
        passed: true,
        latencyMs: 0.09,
        expected: '<= $1,000.00 & Conf >= 0.90',
        actual: '$550.00 & 0.952 conf',
      },
    ],
    initialEvents: [
      { id: 'evt_01', timestampOffset: '+0.000s', name: 'webhook.ingested', actor: 'system', fromState: 'none', toState: 'ingested', details: 'Payload received with Idempotency-Key idem_tax_mismatch_b3c2' },
      { id: 'evt_02', timestampOffset: '+0.001s', name: 'dedup.verified', actor: 'system', fromState: 'ingested', toState: 'ingested', details: 'Unique SHA-256 hash committed to database' },
      { id: 'evt_03', timestampOffset: '+0.003s', name: 'llm.extracted', actor: 'system', fromState: 'ingested', toState: 'extracted', details: 'Structured extraction completed (340 tokens, conf: 0.952)' },
      { id: 'evt_04', timestampOffset: '+0.005s', name: 'guardrails.evaluated', actor: 'system', fromState: 'extracted', toState: 'validated', details: 'FAILED: tax_calc rule tripped. Subtotal ($500.00) + Tax ($25.00) != Total ($550.00)' },
      { id: 'evt_05', timestampOffset: '+0.006s', name: 'state.transitioned', actor: 'system', fromState: 'validated', toState: 'awaiting_human', details: 'Arithmetic discrepancy halted pipeline in awaiting_human. Slack alert dispatched.' },
    ],
    emailDraft: {
      to: 'billing@apexlogistics.com',
      subject: 'Clarification Request: Invoice INV-2026-1194 (PO-9402 Arithmetic Discrepancy)',
      body: `Dear Apex Logistics Billing Department,

We received invoice INV-2026-1194 associated with Purchase Order PO-9402. Our automated audit system detected an arithmetic discrepancy in the document figures:

  • Stated Subtotal: $500.00 (Intermodal Container Drayage)
  • Stated Tax (5%): $25.00
  • Calculated Total: $525.00
  • Stated Invoice Total: $550.00 (Unexplained +$25.00 discrepancy)

Under our company financial control policies, invoices with arithmetic mismatches cannot be processed for disbursement. Please provide an updated invoice reflecting the corrected total ($525.00) or provide documentation detailing the additional $25.00 charge.

Thank you,
Accounts Payable Operations Team`,
    },
  },

  over_1000: {
    id: 'over_1000',
    name: 'Over $1,000 Limit',
    badge: 'HITL GATE',
    shortDesc: 'Clean $3,450 hardware invoice exceeds autonomous approval ceiling.',
    vendor: 'CloudCore Systems LLC',
    vendorEmail: 'receivables@cloudcore.io',
    invoiceNumber: 'INV-2026-3390',
    poNumber: 'PO-7110',
    idempotencyKey: 'idem_over_limit_9e11',
    sha256Hash: '9a82cd51e0ff0411a7884bb301fa79e951b1836cb20499e742841029381745ca',
    subtotal: 3450.00,
    tax: 0.00,
    total: 3450.00,
    confidence: 0.97,
    isIdempotentReplay: false,
    requiresHITL: true,
    hitlReason: 'Policy Ceiling Exceeded: Invoice total ($3,450.00) exceeds autonomous threshold ($1,000.00). Deterministic policy requires explicit managerial authorization.',
    extractedPayload: {
      schema_version: '2026-v2',
      invoice_number: 'INV-2026-3390',
      vendor: {
        name: 'CloudCore Systems LLC',
        tax_id: 'US-47-1940219',
        remit_to: '1200 Silicon Avenue, San Jose CA',
      },
      purchase_order: 'PO-7110',
      currency: 'USD',
      line_items: [
        { item: 'Enterprise Edge Blade Server 2U (NVMe 64GB)', quantity: 1, unit_price: '3450.00', amount: '3450.00' },
      ],
      subtotal: '3450.00',
      tax_amount: '0.00',
      total_amount: '3450.00',
      extraction_confidence: 0.976,
    },
    guardrails: [
      {
        id: 'idem_check',
        name: 'SHA-256 & Idempotency Key Dedup',
        description: 'Verify no previous run matches idempotency key or SHA-256 payload hash',
        codeSnippet: 'assert db.runs.find_one({"idem_key": key}) is None',
        passed: true,
        latencyMs: 0.44,
        expected: 'Cache miss',
        actual: 'Unique SHA-256 registered',
      },
      {
        id: 'line_sum',
        name: 'Pure-Python Decimal Line Sum Equality',
        description: 'Sum of line item amounts must match stated subtotal identically',
        codeSnippet: 'Decimal(subtotal) == sum(Decimal(i.amount) for i in items)',
        passed: true,
        latencyMs: 0.17,
        expected: 'Decimal("3450.00")',
        actual: 'Decimal("3450.00") (Exact match)',
      },
      {
        id: 'tax_calc',
        name: 'Tax Jurisdiction Reconciliation',
        description: 'Applied tax must match expected rate formula for shipping jurisdiction',
        codeSnippet: 'Decimal(tax) == Decimal(subtotal) * Decimal("0.00")',
        passed: true,
        latencyMs: 0.14,
        expected: 'Decimal("0.00")',
        actual: 'Decimal("0.00") (Passed)',
      },
      {
        id: 'po_match',
        name: 'PO Matching & Remaining Balance',
        description: 'Referenced PO must exist, be open, and have sufficient unbilled balance',
        codeSnippet: 'po.status == "OPEN" and po.unbilled >= Decimal(total)',
        passed: true,
        latencyMs: 1.05,
        expected: 'PO-7110 unbilled >= $3,450.00',
        actual: 'PO-7110 valid ($10,000.00 budget authorized)',
      },
      {
        id: 'thresholds',
        name: 'Autonomous Guardrail Gates (<= $1,000 & Conf >= 0.90)',
        description: 'Total must not exceed $1,000 threshold and confidence must be >= 0.90',
        codeSnippet: 'total <= Decimal("1000.00") and confidence >= 0.90',
        passed: false,
        latencyMs: 0.08,
        expected: '<= $1,000.00',
        actual: '$3,450.00 (Exceeds threshold ceiling by $2,450.00)',
      },
    ],
    initialEvents: [
      { id: 'evt_01', timestampOffset: '+0.000s', name: 'webhook.ingested', actor: 'system', fromState: 'none', toState: 'ingested', details: 'Payload received with Idempotency-Key idem_over_limit_9e11' },
      { id: 'evt_02', timestampOffset: '+0.001s', name: 'dedup.verified', actor: 'system', fromState: 'ingested', toState: 'ingested', details: 'SHA-256 hash evaluated; unique payload registered' },
      { id: 'evt_03', timestampOffset: '+0.003s', name: 'llm.extracted', actor: 'system', fromState: 'ingested', toState: 'extracted', details: 'Extraction valid (395 tokens, conf: 0.976)' },
      { id: 'evt_04', timestampOffset: '+0.005s', name: 'guardrails.evaluated', actor: 'system', fromState: 'extracted', toState: 'validated', details: 'Line math and PO match passed. High-value rule ($3,450 > $1,000 ceiling) tripped.' },
      { id: 'evt_05', timestampOffset: '+0.006s', name: 'state.transitioned', actor: 'system', fromState: 'validated', toState: 'awaiting_human', details: 'High-value invoice halted in awaiting_human for finance manager sign-off.' },
    ],
    emailDraft: {
      to: 'receivables@cloudcore.io',
      subject: 'In-Review Notice: Invoice INV-2026-3390 (PO-7110)',
      body: `Dear CloudCore Accounts Team,

We acknowledge receipt of invoice INV-2026-3390 for $3,450.00 against PO-7110. Because this transaction exceeds our $1,000 automated approval threshold, it has routed to our Senior Finance Director for final disbursement authorization.

Expected processing time is 1-2 business days.

Thank you,
Accounts Payable Operations`,
    },
  },

  duplicate_replay: {
    id: 'duplicate_replay',
    name: 'Duplicate Replay',
    badge: 'IDEMPOTENT HIT',
    shortDesc: 'Webhook retry with identical SHA-256 & key instantly short-circuits.',
    vendor: 'ACME Industrial Sensors Corp',
    vendorEmail: 'ap@acme-sensors.com',
    invoiceNumber: 'INV-2026-0842 (Retry)',
    poNumber: 'PO-8821',
    idempotencyKey: 'idem_clean_480_a7f9',
    sha256Hash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    subtotal: 480.00,
    tax: 0.00,
    total: 480.00,
    confidence: 0.98,
    isIdempotentReplay: true,
    requiresHITL: false,
    extractedPayload: {
      cached_run_id: 'run_8f2a4c11',
      idempotent_replay: true,
      original_timestamp: '2026-11-22T08:14:02.190Z',
      sha256_hash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      status: 'approved',
      tokens_consumed: 0,
      database_mutations: 0,
      cached_response: {
        invoice_number: 'INV-2026-0842',
        total_amount: '480.00',
        disposition: 'AUTO_APPROVED',
      },
    },
    guardrails: [
      {
        id: 'idem_check',
        name: 'SHA-256 & Idempotency Key Dedup',
        description: 'Verify no previous run matches idempotency key or SHA-256 payload hash',
        codeSnippet: 'if db.runs.find_one({"sha256": hash}) -> return cached_run',
        passed: true,
        latencyMs: 0.22,
        expected: 'Cache miss',
        actual: 'CACHE HIT: Matches run_8f2a4c11 (Short-circuit activated)',
      },
      {
        id: 'line_sum',
        name: 'Pure-Python Decimal Line Sum Equality',
        description: 'Bypassed during idempotent short-circuit',
        codeSnippet: '# Bypassed: Replay returns cached immutable response',
        passed: 'bypassed',
        latencyMs: 0.0,
        expected: 'N/A',
        actual: 'Bypassed (0 tokens, 0 CPU cycles)',
      },
      {
        id: 'tax_calc',
        name: 'Tax Jurisdiction Reconciliation',
        description: 'Bypassed during idempotent short-circuit',
        codeSnippet: '# Bypassed: Replay returns cached immutable response',
        passed: 'bypassed',
        latencyMs: 0.0,
        expected: 'N/A',
        actual: 'Bypassed',
      },
      {
        id: 'po_match',
        name: 'PO Matching & Remaining Balance',
        description: 'Bypassed during idempotent short-circuit (prevents double balance deduction)',
        codeSnippet: '# Bypassed: Prevents double-decrement of PO balance',
        passed: 'bypassed',
        latencyMs: 0.0,
        expected: 'N/A',
        actual: 'Bypassed (Double-decrement prevented)',
      },
      {
        id: 'thresholds',
        name: 'Autonomous Guardrail Gates',
        description: 'Bypassed during idempotent short-circuit',
        codeSnippet: '# Bypassed',
        passed: 'bypassed',
        latencyMs: 0.0,
        expected: 'N/A',
        actual: 'Bypassed',
      },
    ],
    initialEvents: [
      { id: 'evt_01', timestampOffset: '+0.000s', name: 'webhook.received', actor: 'system', fromState: 'none', toState: 'ingested', details: 'Retry webhook with Idempotency-Key idem_clean_480_a7f9' },
      { id: 'evt_02', timestampOffset: '+0.001s', name: 'dedup.cache_hit', actor: 'cache_engine', fromState: 'ingested', toState: 'idempotent_hit', details: 'SHA-256 hash matched existing run run_8f2a4c11. LLM extraction & guardrails bypassed.' },
      { id: 'evt_03', timestampOffset: '+0.001s', name: 'response.replay', actor: 'system', fromState: 'idempotent_hit', toState: 'idempotent_hit', details: 'Dispatched cached HTTP 200 OK (X-Idempotent-Replay: true) in 0.82ms. Zero DB mutations.' },
    ],
    emailDraft: {
      to: 'ap@acme-sensors.com',
      subject: 'Notice: Duplicate Webhook Acknowledged',
      body: 'Duplicate webhook receipt acknowledged. Prior approval decision stands unchanged.',
    },
  },

  low_conf_ocr: {
    id: 'low_conf_ocr',
    name: 'Low-Confidence OCR',
    badge: 'HITL GATE',
    shortDesc: 'Degraded scan yields 0.72 confidence; trips safety gate below 0.90.',
    vendor: 'Apex Industri?s (Uncertain OCR)',
    vendorEmail: 'orders@apex-supplies.com',
    invoiceNumber: 'INV-2026-9021',
    poNumber: 'PO-5518',
    idempotencyKey: 'idem_ocr_blur_4d8a',
    sha256Hash: '4d8ae310fa4922bc983711910283c4819028e37cb01948371902948123985112',
    subtotal: 890.00,
    tax: 0.00,
    total: 890.00,
    confidence: 0.72,
    isIdempotentReplay: false,
    requiresHITL: true,
    hitlReason: 'OCR Model Uncertainty: Token extraction confidence score (0.72) is below safety floor (0.90). Blurred/skewed source scan requires manual review.',
    extractedPayload: {
      schema_version: '2026-v2',
      invoice_number: 'INV-2026-9021',
      vendor: {
        name: 'Apex Industri?s',
        tax_id: 'US-92-??84120',
        remit_to: 'Unreadable address line 2',
      },
      purchase_order: 'PO-5518',
      currency: 'USD',
      line_items: [
        { item: 'Bulk Heavy-Duty Electrical Conduit 50m', quantity: 50, unit_price: '17.80', amount: '890.00' },
      ],
      subtotal: '890.00',
      tax_amount: '0.00',
      total_amount: '890.00',
      extraction_confidence: 0.724,
      model_warnings: [
        'Low OCR resolution (<150 DPI) detected',
        'Vendor name character ambiguity detected at index 14',
      ],
    },
    guardrails: [
      {
        id: 'idem_check',
        name: 'SHA-256 & Idempotency Key Dedup',
        description: 'Verify no previous run matches idempotency key or SHA-256 payload hash',
        codeSnippet: 'assert db.runs.find_one({"idem_key": key}) is None',
        passed: true,
        latencyMs: 0.40,
        expected: 'Cache miss',
        actual: 'Unique SHA-256 registered',
      },
      {
        id: 'line_sum',
        name: 'Pure-Python Decimal Line Sum Equality',
        description: 'Sum of line item amounts must match stated subtotal identically',
        codeSnippet: 'Decimal(subtotal) == sum(Decimal(i.amount) for i in items)',
        passed: true,
        latencyMs: 0.16,
        expected: 'Decimal("890.00")',
        actual: 'Decimal("890.00") (Passed)',
      },
      {
        id: 'tax_calc',
        name: 'Tax Jurisdiction Reconciliation',
        description: 'Applied tax must match expected rate formula for shipping jurisdiction',
        codeSnippet: 'Decimal(tax) == Decimal(subtotal) * Decimal("0.00")',
        passed: true,
        latencyMs: 0.14,
        expected: 'Decimal("0.00")',
        actual: 'Decimal("0.00") (Passed)',
      },
      {
        id: 'po_match',
        name: 'PO Matching & Remaining Balance',
        description: 'Referenced PO must exist, be open, and have sufficient unbilled balance',
        codeSnippet: 'po.status == "OPEN" and po.unbilled >= Decimal(total)',
        passed: true,
        latencyMs: 0.95,
        expected: 'PO-5518 active',
        actual: 'PO-5518 found ($1,200.00 balance)',
      },
      {
        id: 'thresholds',
        name: 'Autonomous Guardrail Gates (<= $1,000 & Conf >= 0.90)',
        description: 'Total must not exceed $1,000 threshold and confidence must be >= 0.90',
        codeSnippet: 'total <= Decimal("1000.00") and confidence >= 0.90',
        passed: false,
        latencyMs: 0.08,
        expected: 'Confidence >= 0.900',
        actual: 'Confidence 0.724 (SAFETY GATE FAILED)',
      },
    ],
    initialEvents: [
      { id: 'evt_01', timestampOffset: '+0.000s', name: 'webhook.ingested', actor: 'system', fromState: 'none', toState: 'ingested', details: 'Payload received with Idempotency-Key idem_ocr_blur_4d8a' },
      { id: 'evt_02', timestampOffset: '+0.001s', name: 'dedup.verified', actor: 'system', fromState: 'ingested', toState: 'ingested', details: 'Unique SHA-256 registered' },
      { id: 'evt_03', timestampOffset: '+0.003s', name: 'llm.extracted', actor: 'system', fromState: 'ingested', toState: 'extracted', details: 'Extraction completed with warnings: token confidence 0.724 < 0.900 floor' },
      { id: 'evt_04', timestampOffset: '+0.005s', name: 'guardrails.evaluated', actor: 'system', fromState: 'extracted', toState: 'validated', details: 'Confidence threshold rule tripped (0.724 < 0.900)' },
      { id: 'evt_05', timestampOffset: '+0.006s', name: 'state.transitioned', actor: 'system', fromState: 'validated', toState: 'awaiting_human', details: 'OCR ambiguity halted pipeline in awaiting_human for document verification.' },
    ],
    emailDraft: {
      to: 'orders@apex-supplies.com',
      subject: 'Legibility Request: Invoice INV-2026-9021 (PO-5518)',
      body: `Dear Apex Supplies Accounts Team,

We received your invoice INV-2026-9021 against Purchase Order PO-5518. However, the document scan uploaded was blurry (<150 DPI) and failed our optical verification threshold (vendor identifier and remittance lines were illegible).

To protect disbursement accuracy, please reply with a clear, high-resolution PDF copy of this invoice.

Thank you,
Accounts Payable Operations Team`,
    },
  },
};

export default function AuditFlowSimulator() {
  const componentId = useId();
  const [selectedScenarioId, setSelectedScenarioId] = useState<ScenarioId>('clean_480');
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('complete');
  const [activeTab, setActiveTab] = useState<'payload' | 'guardrails' | 'audit_log'>('guardrails');
  const [humanDecision, setHumanDecision] = useState<'approved' | 'rejected' | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>(SCENARIOS.clean_480.initialEvents);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const scenario = SCENARIOS[selectedScenarioId];

  // Helper to run pipeline animation
  const runPipelineAnimation = (scenarioData: ScenarioData) => {
    setPipelineStage('ingesting');
    setHumanDecision(null);
    setEvents(scenarioData.initialEvents.slice(0, 2));

    if (scenarioData.isIdempotentReplay) {
      setTimeout(() => {
        setPipelineStage('complete');
        setEvents(scenarioData.initialEvents);
      }, 350);
      return;
    }

    setTimeout(() => {
      setPipelineStage('extracting');
      setEvents(scenarioData.initialEvents.slice(0, 3));
    }, 280);

    setTimeout(() => {
      setPipelineStage('validating');
      setEvents(scenarioData.initialEvents.slice(0, 4));
    }, 560);

    setTimeout(() => {
      setPipelineStage('complete');
      setEvents(scenarioData.initialEvents);
    }, 850);
  };

  const handleSelectScenario = (id: ScenarioId) => {
    setSelectedScenarioId(id);
    setIsEmailModalOpen(false);
    runPipelineAnimation(SCENARIOS[id]);
  };

  const handleHumanApprove = () => {
    setHumanDecision('approved');
    const newEvent: AuditEvent = {
      id: `evt_human_${Date.now()}`,
      timestampOffset: '+0.012s',
      name: 'human.decision',
      actor: 'ops_analyst',
      fromState: 'awaiting_human',
      toState: 'approved',
      details: 'Analyst manual override authorized disbursement. Immutable HTTP 409 decision lock active.',
    };
    setEvents((prev) => [...prev, newEvent]);
  };

  const handleHumanReject = () => {
    setHumanDecision('rejected');
    const newEvent: AuditEvent = {
      id: `evt_human_${Date.now()}`,
      timestampOffset: '+0.012s',
      name: 'human.decision',
      actor: 'ops_analyst',
      fromState: 'awaiting_human',
      toState: 'rejected',
      details: `Analyst rejected invoice. Triggered automated vendor clarification email (${scenario.vendorEmail}).`,
    };
    setEvents((prev) => [...prev, newEvent]);
    setIsEmailModalOpen(true);
  };

  const handleResetDecision = () => {
    setHumanDecision(null);
    setEvents(scenario.initialEvents);
  };

  const handleCopyEmail = () => {
    const emailText = `To: ${scenario.emailDraft.to}\nSubject: ${scenario.emailDraft.subject}\n\n${scenario.emailDraft.body}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(emailText).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };

  // Determine effective current outcome state
  const effectiveState: DecisionState = (() => {
    if (scenario.isIdempotentReplay) return 'idempotent_hit';
    if (!scenario.requiresHITL) return 'approved';
    if (humanDecision === 'approved') return 'approved';
    if (humanDecision === 'rejected') return 'rejected';
    return 'awaiting_human';
  })();

  return (
    <section
      aria-labelledby={`simulator-title-${componentId}`}
      className="rounded-2xl border border-border bg-surface overflow-hidden shadow-xs reveal-on-scroll"
    >
      {/* ====================================================================
          1. Header & Engine Telemetry Banner
          ==================================================================== */}
      <div className="p-5 sm:p-6 border-b border-border bg-surface-raised/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted font-bold">
              LIVE INTERACTIVE SIMULATOR // ZERO BACKEND REQUIRED
            </span>
          </div>
          <h2
            id={`simulator-title-${componentId}`}
            className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-text leading-tight"
          >
            AuditFlow HITL Engine Simulator
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Select a live scenario below to observe idempotent ingestion, deterministic guardrails, and human review gates.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => runPipelineAnimation(scenario)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-raised active:scale-[0.98] transition-all text-xs font-semibold text-text uppercase tracking-wider cursor-pointer shadow-2xs"
            title="Re-run active pipeline"
          >
            <span>↻</span>
            <span>Re-run Flow</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          2. Scenario Selector Buttons (5 Grounded Scenarios)
          ==================================================================== */}
      <div className="p-4 sm:p-5 border-b border-border bg-surface">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted font-bold block">
            Select Test Scenario (5 Realistic Operational Cases)
          </span>
          <span className="text-[11px] font-mono text-text-dim hidden sm:inline">
            Click to test edge cases
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {(Object.keys(SCENARIOS) as ScenarioId[]).map((key) => {
            const sc = SCENARIOS[key];
            const isSelected = selectedScenarioId === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectScenario(key)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[78px] ${
                  isSelected
                    ? 'border-accent bg-surface-raised shadow-xs ring-1 ring-accent/30'
                    : 'border-border bg-surface hover:bg-surface-raised/70 hover:border-text-muted'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-[9px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md ${
                        sc.badge === 'AUTO-APPROVE'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : sc.badge === 'IDEMPOTENT HIT'
                          ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {sc.badge}
                    </span>
                  </div>
                  <span className="font-display font-black text-sm uppercase tracking-tight text-text block leading-snug">
                    {sc.name}
                  </span>
                </div>
                <span className="text-[10px] text-text-muted line-clamp-1 block mt-1">
                  {sc.invoiceNumber}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ====================================================================
          3. Pipeline Flow Diagram (Active Node Animation & Branches)
          ==================================================================== */}
      <div className="p-5 sm:p-6 border-b border-border bg-surface-raised/20 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted font-bold">
              Execution Pipeline
            </span>
            <span className="text-[11px] font-mono text-text-dim">
              p95 latency: <strong className="text-text font-bold">5.75 ms</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-text-muted text-[11px]">Idempotency:</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-surface border border-border text-text font-semibold">
              {scenario.idempotencyKey}
            </span>
          </div>
        </div>

        {/* Node Sequence Container */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
          {/* Node 1: Ingest & Dedup */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              pipelineStage === 'ingesting'
                ? 'border-accent bg-surface-raised shadow-xs'
                : 'border-border bg-surface'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted font-bold">
                01 // Ingest
              </span>
              <span
                className={`size-2 rounded-full ${
                  scenario.isIdempotentReplay ? 'bg-sky-400' : 'bg-emerald-500'
                }`}
              ></span>
            </div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-text mb-1">
              Ingest & Dedup
            </h4>
            <p className="text-[11px] text-text-muted leading-relaxed">
              {scenario.isIdempotentReplay ? (
                <span className="text-sky-400 font-medium">Cache hit: duplicate SHA-256</span>
              ) : (
                'SHA-256 hashed & indexed'
              )}
            </p>
            <div className="mt-2 pt-2 border-t border-border-subtle text-[10px] font-mono text-text-dim truncate">
              {scenario.sha256Hash.slice(0, 18)}...
            </div>
          </div>

          {/* Node 2: Scoped LLM Extract */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              scenario.isIdempotentReplay
                ? 'border-border/50 bg-surface/50 opacity-60'
                : pipelineStage === 'extracting'
                ? 'border-accent bg-surface-raised shadow-xs'
                : 'border-border bg-surface'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted font-bold">
                02 // Parse
              </span>
              <span
                className={`size-2 rounded-full ${
                  scenario.isIdempotentReplay
                    ? 'bg-border'
                    : scenario.confidence < 0.9
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
              ></span>
            </div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-text mb-1">
              Scoped LLM Extract
            </h4>
            <p className="text-[11px] text-text-muted leading-relaxed">
              {scenario.isIdempotentReplay ? (
                <span className="italic">Bypassed on replay (0 tokens)</span>
              ) : (
                <>
                  Pydantic v2 JSON •{' '}
                  <span
                    className={
                      scenario.confidence < 0.9 ? 'text-amber-400 font-bold' : 'text-text font-medium'
                    }
                  >
                    {(scenario.confidence * 100).toFixed(1)}% conf
                  </span>
                </>
              )}
            </p>
            <div className="mt-2 pt-2 border-t border-border-subtle text-[10px] font-mono text-text-dim">
              {scenario.isIdempotentReplay ? 'tokens: 0' : 'tokens: ~380'}
            </div>
          </div>

          {/* Node 3: Deterministic PO Guardrails */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              scenario.isIdempotentReplay
                ? 'border-border/50 bg-surface/50 opacity-60'
                : pipelineStage === 'validating'
                ? 'border-accent bg-surface-raised shadow-xs'
                : 'border-border bg-surface'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted font-bold">
                03 // Guardrails
              </span>
              <span
                className={`size-2 rounded-full ${
                  scenario.isIdempotentReplay
                    ? 'bg-border'
                    : scenario.requiresHITL
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
              ></span>
            </div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-text mb-1">
              PO & Math Gates
            </h4>
            <p className="text-[11px] text-text-muted leading-relaxed">
              {scenario.isIdempotentReplay ? (
                <span className="italic">Bypassed (0 CPU cycles)</span>
              ) : scenario.requiresHITL ? (
                <span className="text-amber-400 font-medium">Validation halted at gate</span>
              ) : (
                <span className="text-emerald-400 font-medium">5/5 Python rules passed</span>
              )}
            </p>
            <div className="mt-2 pt-2 border-t border-border-subtle text-[10px] font-mono text-text-dim">
              pure Python Decimal
            </div>
          </div>

          {/* Node 4: Decision & State Machine Outcome */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              effectiveState === 'approved'
                ? 'border-emerald-500/60 bg-emerald-500/10'
                : effectiveState === 'awaiting_human'
                ? 'border-amber-500/60 bg-amber-500/10'
                : effectiveState === 'rejected'
                ? 'border-rose-500/60 bg-rose-500/10'
                : 'border-sky-500/60 bg-sky-500/10'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted font-bold">
                04 // State
              </span>
              <span
                className={`size-2 rounded-full ${
                  effectiveState === 'approved'
                    ? 'bg-emerald-500 animate-pulse'
                    : effectiveState === 'awaiting_human'
                    ? 'bg-amber-400 animate-pulse'
                    : effectiveState === 'rejected'
                    ? 'bg-rose-500'
                    : 'bg-sky-400'
                }`}
              ></span>
            </div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-text mb-1">
              {effectiveState === 'approved' && 'Auto-Approved'}
              {effectiveState === 'awaiting_human' && 'Awaiting Human'}
              {effectiveState === 'rejected' && 'Rejected by Human'}
              {effectiveState === 'idempotent_hit' && 'Idempotent Replay'}
            </h4>
            <p className="text-[11px] text-text-muted leading-relaxed">
              {effectiveState === 'approved' && 'Committed to ERP & Postgres'}
              {effectiveState === 'awaiting_human' && 'Halted for browser / Slack review'}
              {effectiveState === 'rejected' && 'Discrepancy email auto-drafted'}
              {effectiveState === 'idempotent_hit' && 'Cached response returned in 0.8ms'}
            </p>
            <div className="mt-2 pt-2 border-t border-border-subtle text-[10px] font-mono text-text-dim">
              status: {effectiveState}
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          4. Interactive HITL Decision Strip (Approve or Reject & Draft Email)
          ==================================================================== */}
      {scenario.requiresHITL && (
        <div
          className={`p-5 border-b border-border transition-all ${
            effectiveState === 'awaiting_human'
              ? 'bg-amber-500/10 border-amber-500/40'
              : effectiveState === 'approved'
              ? 'bg-emerald-500/10 border-emerald-500/40'
              : 'bg-rose-500/10 border-rose-500/40'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                    effectiveState === 'awaiting_human'
                      ? 'bg-amber-500 text-black'
                      : effectiveState === 'approved'
                      ? 'bg-emerald-500 text-black'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  {effectiveState === 'awaiting_human'
                    ? 'ACTION REQUIRED // HITL GATE'
                    : effectiveState === 'approved'
                    ? 'RESOLVED // APPROVED BY ANALYST'
                    : 'RESOLVED // REJECTED & CLARIFICATION DRAFTED'}
                </span>
                <span className="text-xs font-mono text-text-muted">
                  HTTP 409 Concurrency Protection Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-text font-medium leading-relaxed">
                {scenario.hitlReason}
              </p>
            </div>

            {/* Interactive Decision Actions */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {effectiveState === 'awaiting_human' ? (
                <>
                  <button
                    type="button"
                    onClick={handleHumanApprove}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black active:scale-[0.98] transition-all text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs"
                  >
                    <span>✓</span>
                    <span>Approve Invoice</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleHumanReject}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white active:scale-[0.98] transition-all text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs"
                  >
                    <span>✕</span>
                    <span>Reject & Draft Email</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted font-mono">
                    Decision recorded in audit log.
                  </span>
                  {effectiveState === 'rejected' && (
                    <button
                      type="button"
                      onClick={() => setIsEmailModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-raised text-xs font-semibold uppercase text-text transition-all cursor-pointer"
                    >
                      View Draft Email
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleResetDecision}
                    className="px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-raised text-xs font-semibold uppercase text-text-muted hover:text-text transition-all cursor-pointer"
                  >
                    Reset Gate
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          5. Inspector Tabs (Guardrails / Extracted JSON / Audit Log)
          ==================================================================== */}
      <div className="border-b border-border bg-surface-raised/40 px-5 pt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('guardrails')}
          className={`pb-3 px-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'guardrails'
              ? 'border-accent text-text'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          Guardrail Rules (5 Checks)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('payload')}
          className={`pb-3 px-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'payload'
              ? 'border-accent text-text'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          Pydantic JSON Schema
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit_log')}
          className={`pb-3 px-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'audit_log'
              ? 'border-accent text-text'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <span>Immutable Audit Log</span>
          <span className="px-1.5 py-0.2 rounded-full bg-surface-raised text-[10px] font-mono">
            {events.length}
          </span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-5 sm:p-6 bg-surface">
        {/* Tab 1: Guardrail Rules */}
        {activeTab === 'guardrails' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-text-muted mb-2">
              <span className="font-mono text-[11px] uppercase tracking-wider">
                Pure-Python Deterministic Evaluation (No LLM in math loop)
              </span>
              <span className="font-mono text-[11px]">
                Total latency: <strong>1.68 ms</strong>
              </span>
            </div>

            <div className="space-y-2">
              {scenario.guardrails.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    rule.passed === false
                      ? 'border-rose-500/40 bg-rose-500/5'
                      : rule.passed === 'bypassed'
                      ? 'border-border/60 bg-surface-raised/30 opacity-70'
                      : 'border-border bg-surface-raised/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                          rule.passed === false
                            ? 'bg-rose-500 text-white'
                            : rule.passed === 'bypassed'
                            ? 'bg-surface border border-border text-text-dim'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {rule.passed === false ? 'FAILED' : rule.passed === 'bypassed' ? 'BYPASSED' : 'PASSED'}
                      </span>
                      <h4 className="font-semibold text-xs text-text">{rule.name}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-text-dim">
                      {rule.latencyMs.toFixed(2)} ms
                    </span>
                  </div>

                  <p className="text-xs text-text-muted mb-2">{rule.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono p-2 rounded-lg bg-surface border border-border-subtle">
                    <div>
                      <span className="text-text-dim text-[10px] block uppercase">Rule Assertion</span>
                      <code className="text-text font-bold">{rule.codeSnippet}</code>
                    </div>
                    <div>
                      <span className="text-text-dim text-[10px] block uppercase">Evaluation Result</span>
                      <span
                        className={
                          rule.passed === false
                            ? 'text-rose-400 font-semibold'
                            : 'text-text-muted'
                        }
                      >
                        {rule.actual}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Extracted Pydantic Payload */}
        {activeTab === 'payload' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span className="font-mono text-[11px] uppercase tracking-wider">
                Strict Pydantic v2 Structured Extraction Object
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                schema: InvoicePayload v2.4
              </span>
            </div>
            <pre className="p-4 rounded-xl border border-border bg-surface-raised overflow-x-auto text-xs font-mono text-text leading-relaxed">
              <code>{JSON.stringify(scenario.extractedPayload, null, 2)}</code>
            </pre>
          </div>
        )}

        {/* Tab 3: Immutable Audit Event Log */}
        {activeTab === 'audit_log' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-text-muted mb-1">
              <span className="font-mono text-[11px] uppercase tracking-wider">
                Append-Only PostgreSQL / SQLite `run_events` Audit Trail
              </span>
              <span className="font-mono text-[10px] text-text-dim">
                Immutable SHA-256 Ledger
              </span>
            </div>

            <div className="divide-y divide-border-subtle rounded-xl border border-border bg-surface-raised/30 overflow-hidden">
              {events.map((evt) => (
                <div key={evt.id} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[10px] text-text-dim tabular-nums">
                      {evt.timestampOffset}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface border border-border text-[10px] font-mono text-text font-semibold uppercase">
                      {evt.name}
                    </span>
                    {evt.fromState && evt.toState && (
                      <span className="text-[10px] font-mono text-text-muted">
                        [{evt.fromState} → <strong className="text-text">{evt.toState}</strong>]
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-text-muted sm:text-right font-normal">
                    {evt.details}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          6. Golden Evaluation Harness Strip
          ==================================================================== */}
      <div className="p-4 sm:p-5 border-t border-border bg-surface-raised/50 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-text-dim block">
              Decision Accuracy
            </span>
            <span className="font-display font-black text-lg text-emerald-400">100.0%</span>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-text-dim block">
              False-Approval Rate
            </span>
            <span className="font-display font-black text-lg text-emerald-400">0.0%</span>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-text-dim block">
              p95 Runtime Latency
            </span>
            <span className="font-display font-black text-lg text-text">5.75 ms</span>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-text-dim block">
              Golden Adversarial Suite
            </span>
            <span className="font-display font-black text-lg text-text">25 / 25 Passing</span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-text-muted">
          Hybrid Stack: FastAPI + Pydantic v2 + Next.js 16 + n8n
        </div>
      </div>

      {/* ====================================================================
          7. Vendor Clarification Email Modal
          ==================================================================== */}
      {isEmailModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-rose-500"></span>
                <h3 className="font-display font-black text-xl uppercase tracking-tight text-text">
                  Automated Vendor Clarification Notice
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="text-text-muted hover:text-text text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-text-dim w-16">To:</span>
                <span className="font-mono text-text font-semibold">{scenario.emailDraft.to}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-text-dim w-16">Subject:</span>
                <span className="font-mono text-text font-semibold">{scenario.emailDraft.subject}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border-subtle bg-surface-raised font-mono text-xs text-text-muted whitespace-pre-wrap leading-relaxed max-h-[260px] overflow-y-auto">
              {scenario.emailDraft.body}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-text-dim font-mono">
                Auto-generated by AuditFlow State Machine
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="px-4 py-2 rounded-xl bg-accent text-accent-text hover:bg-accent-hover text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  {isCopied ? 'Copied to Clipboard!' : 'Copy Email Body'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border bg-surface hover:bg-surface-raised text-xs font-semibold uppercase text-text transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
