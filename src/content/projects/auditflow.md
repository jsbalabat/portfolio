---
title: AuditFlow
category: Financial Automation / HITL AI Engine
tagline: Automated invoice and PO audit engine pairing scoped Pydantic extraction with pure-Python deterministic guardrails and human-in-the-loop approvals.
role: Sole Engineer (Architecture & Implementation)
timeline: '2026'
stack:
  - Python
  - FastAPI
  - Pydantic
  - PostgreSQL
  - Next.js
  - n8n
keyOutcome: Achieved 100% decision accuracy and 0% false-approval rate across 25 golden adversarial test cases with sub-6ms p95 latency.
metrics: 100% Accuracy • 0% False Approvals • 5.75ms p95
liveUrl: null
repoUrl: null
featured: true
order: 5
---

Architected an automated invoice and purchase order reconciliation engine that eliminates hallucination risk in financial operations. Scoped the LLM strictly to Pydantic v2 structured JSON extraction and confidence scoring, while delegating all line-item arithmetic, tax validation (via Decimal), PO matching, and approval threshold gates to pure-Python deterministic guardrails. Built with an idempotent webhook ingestion layer, durable state machine with immutable audit logging, and a Human-in-the-Loop review gate for flagged invoices.
