# UI/UX & Modern Frontend Best Practices

This document establishes the UI/UX and frontend engineering design standards for the portfolio. It overrides and refines earlier phase decisions to ensure the interface is warm, human, tranquil, and radically accessible.

---

## 1. Core Principles

### 1.1 Proof-First & Scannability (The 6-Second Rule)
- Recruiters and engineering managers decide within 6 to 10 seconds whether to proceed.
- The interface answers three questions immediately above the fold:
  1. **What is built?** Production systems that replace manual workflows.
  2. **What was the individual ownership?** Sole engineer across three shipped products in 14 months with 650+ commits.
  3. **What is the outcome?** Replacing Excel billing for six companies; normalizing multi-tenant relational schemas; 6-day sprint triage platform.
- A streamlined **TLDR mode** is available to highlight high-signal metrics and project outcomes on demand.

### 1.2 Human-Centered Tone (Zero AI-isms)
- Counter the cold, synthetic aesthetic of automated code generation.
- **Banned Language & Framing:** No buzzwords (e.g. "orchestrated", "synergy", "paradigm", "cutting-edge", "game-changer", "seamless", "robust").
- **No AI Labels:** Remove robotic badges like "60 FPS WebGL", "Interactive 3D", "Pitched Feature X", or synthetic metrics.
- Code comments and UI copy focus strictly on concrete engineering rationale: constraints, tradeoffs, root causes, and verifiable results.

### 1.3 Minimalist Tranquil Aesthetic
- Palette strictly bound to:
  - Deep Forest Slate: `#73877b`
  - Muted Eucalyptus: `#839788`
  - Warm Stone Grey: `#bdbbb6`
  - Soft Clay Blush: `#e5d1d0`
  - Warm Desert Linen: `#f5e4d7`
- Generous full-width layout without restrictive margins, giving content room to breathe while avoiding sprawling whitespace.
- Soft, organic borders (`border-border/60`) and gentle tonal elevation rather than heavy, harsh drop shadows.

### 1.4 Authentic Tech Stack Visual Identity
- Display genuine, recognizable SVG logos for all tools and technologies (TypeScript, React 19, Astro, Next.js, Node.js, PostgreSQL, Cloudflare, Docker, Supabase, Flutter).
- Avoid abstract or placeholder icons. Tech leads scan for tools they know and trust.

### 1.5 Interactive Depth Without Gimmicks
- Interactive elements must demonstrate real engineering competence rather than decorative novelty.
- **Architecture Time-Machine Diff Slider:** Allows visitors to slide between problematic schemas (e.g. 1NF array-of-objects violation) and normalized relational tables with Row-Level Security.
- **Command Palette (`Ctrl + K`):** Provides instant, keyboard-driven navigation for engineers without intruding on standard web navigation.

---

## 2. Accessibility & Performance (WCAG 2.1 AA)

- **Color Contrast:** All body text meets or exceeds the 4.5:1 WCAG AA contrast ratio against both light linen and dark midnight backdrops.
- **Keyboard Operability:** All interactive components (cards, links, diff slider, command palette) are fully operable via keyboard with high-visibility focus indicators.
- **Motion Budget:** All animations respect `prefers-reduced-motion`.
- **Zero-JS Baseline:** Content is pre-rendered via Astro 5 static rendering. Client-side hydration is isolated strictly to interactive islands.
