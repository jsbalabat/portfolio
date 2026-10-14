# Portfolio

Personal portfolio and engineering case studies for **Marc Balabat** ([@jsbalabat](https://github.com/jsbalabat)), systems and full-stack software engineer.

- **Live Site:** [marcbalabat.tech](https://marcbalabat.tech)
- **Version:** `v1.0.6`
- **Deployment:** Cloudflare Pages with edge runtime

Built with **Astro 5** (content-first, zero-JS baseline), **React 19** interactive islands, **Tailwind CSS 4** with CSS-first design tokens, **Lenis** smooth wheel scrolling on desktop, and custom GPU-composited micro-interactions.

---

## Architecture & Tech Stack

- **Framework:** [Astro 5](https://astro.build) (static site generation with Cloudflare adapter)
- **Interactive Islands:** [React 19](https://react.dev) (Contact modal with Web3Forms integration)
- **Styling & Tokens:** [Tailwind CSS 4](https://tailwindcss.com) via `@theme` variables and high-contrast monochromatic design tokens in `tokens.css`
- **Typography:** DM Sans (body, natural sans), Alumni Sans (display headlines), JetBrains Mono (metrics, coordinates, telemetry)
- **Smooth Scroll:** [Lenis](https://lenis.darkroom.engineering/) on desktop / fine pointers; hardware momentum scrolling + custom rAF smooth-scroll on mobile
- **Deployment & Edge:** [Cloudflare Pages](https://pages.cloudflare.com/) via `@astrojs/cloudflare` with Cloudflare KV session support
- **Brand Identity:** Custom `M.png` mark across desktop header, mobile drawer, and multi-format vector/raster favicons

---

## Key Features

1. **Mobile-First Inverting Burger Menu:**
   - Minimalist borderless 3-line floating menu revealed on scroll past 120px.
   - Sibling visual architecture with `mix-blend-difference text-white` providing negative contrast inversion over page elements without WebKit touch hit-test interference.
   - Symmetrical X morph with tactile tap scaling (`active:scale-90`).

2. **Jitter-Free Mobile Layout & Smooth Navigation:**
   - Hero section decoupled from dynamic viewport units (`dvh`) on mobile to prevent layout shifts and bottom jitter when browser search/address bars collapse or expand.
   - Custom `requestAnimationFrame` cubic ease-out smooth scrolling for in-page anchors (`#projects`, `#skills`, `#contact`, BackToTop) with instant touch interruption.

3. **Curtain Wipe Splash Transition:**
   - Preserved full-screen splash wipe transition on MARC brand logo clicks.
   - Single-pass non-blocking font initialization preventing flash of unstyled text (FOUT).

4. **TLDR Reading Mode:**
   - Instant toggle that dims long-form narrative paragraphs and spotlights metrics, tech stacks, and project outcomes.
   - State persisted in `localStorage` and synchronized across view transitions.

5. **Contact Modal:**
   - Mobile sheet docking with native iOS safe-area insets (`env(safe-area-inset-bottom)`).
   - Single muted border focus highlight with 16px minimum font size on mobile to prevent iOS Safari auto-zoom.

---

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Typecheck and Astro diagnostics
pnpm check
pnpm typecheck

# Production build
pnpm build

# Preview edge build locally with Wrangler
npx wrangler dev
```

---

## Branch & Release Strategy

- `staging`: Primary integration branch for feature development and verification.
- `main`: Production release branch deployed automatically to Cloudflare Pages.
- Releases are tagged with semantic versioning tags (`v1.0.6`).

---

## Documentation

Full architectural specifications and implementation guides are in [`docs/`](docs/):
- [`docs/DESIGN.md`](DESIGN.md) - Monochromatic design system and typography hierarchy
- [`docs/UI_UX_BEST_PRACTICES.md`](docs/UI_UX_BEST_PRACTICES.md) - Performance, mobile native, and micro-interaction guidelines
- [`docs/CLAUDE.md`](docs/CLAUDE.md) - Project conventions and coding rules

---

## Roadmap

- [ ] Top/bottom sandwich comparison slider for architecture diffs
- [ ] Responsive multi-resolution responsive imagery
- [ ] Command menu (Cmd+K / Ctrl+K) smooth hash navigation without full reload