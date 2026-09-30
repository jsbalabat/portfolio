---
version: alpha
name: marc-portfolio
description: Minimalist, editorial, black/white/grayscale design system inspired by aneshk.design and guided by ui-skills. Enforces high visual contrast, natural human typography without monospace code fonts, tight macro-whitespace, and GPU-composited smooth transitions.
colors:
  bg: '#080808'
  surface: '#121212'
  surface-raised: '#1a1a1a'
  surface-card: '#141414'
  text: '#ffffff'
  text-muted: '#b0b0b0'
  text-dim: '#666666'
  border: '#242424'
  border-subtle: '#181818'
  border-hover: '#444444'
  accent: '#ffffff'
  accent-hover: '#e6e6e6'
  accent-text: '#080808'
typography:
  sans:
    fontFamily: "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
  display:
    fontFamily: "Alumni Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontWeight: 900
rounded:
  base: 0.5rem
spacing:
  base: 0.875rem
---

# DESIGN.md — Marc Portfolio Design System

Minimalist, human, and editorial design system inspired by the visual hierarchy and stark typographic restraint of aneshk.design. Built for a production-grade full-stack software engineer portfolio.

## Overview

A clean, high-contrast, black/white/grayscale aesthetic that replaces computer-terminal/robotic gimmicks with quiet design confidence. The interface relies on natural human typography (no monospace fonts), tighter whitespace pacing, bold display typography, structured bento cards, and responsive GPU-composited transitions.

## Colors

Color is treated as a scarce resource. No bright neon colors, no purple gradients, and no glowing AI accents.

- **Background Canvas**: Deep neutral black (`#080808`) in dark mode; crisp clean white (`#ffffff`) in light mode.
- **Surfaces & Cards**: Slightly raised neutral layers (`#121212`, `#141414`) with hairline borders.
- **Borders & Dividers**: Hairline `1px` borders (`#242424` dark, `#e0e0e0` light) with subtle interactive highlight on hover (`#444444` / `rgba(255,255,255,0.3)`).
- **Typography Scale**: High-contrast white (`#ffffff`) for titles, legible light-gray (`#b0b0b0`) for body copy, and muted gray (`#666666`) for metadata.
- **Accent**: Pure white (`#ffffff` dark) or pure black (`#080808` light) used strictly for primary CTAs, active pills, and focus rings.

## Themes

The system supports automatic system preference with explicit user override (Light / Dark):

| Token | Dark (Default) | Light (Paper / Crisp) |
|---|---|---|
| `--color-bg` | `#080808` | `#ffffff` |
| `--color-surface` | `#121212` | `#fbfbfb` |
| `--color-surface-raised` | `#1a1a1a` | `#f0f0f0` |
| `--color-surface-card` | `#141414` | `#ffffff` |
| `--color-text` | `#ffffff` | `#080808` |
| `--color-text-muted` | `#b0b0b0` | `#555555` |
| `--color-text-dim` | `#666666` | `#888888` |
| `--color-border` | `#242424` | `#e0e0e0` |
| `--color-border-hover` | `#444444` | `#111111` |
| `--color-accent` | `#ffffff` | `#080808` |
| `--color-accent-text` | `#080808` | `#ffffff` |

## Typography

Typographic contrast drives the editorial rhythm using purely natural, human typefaces:

1. **Display Headings**: Tall, condensed, uppercase typography (`Alumni Sans`) with tight tracking (`-0.01em`) and tight line-height (`0.92`). Used for hero titles, section counters, and high-impact statements.
2. **Body, Metadata & UI**: Clean, warm modern sans-serif (`DM Sans`, `-apple-system`, `Segoe UI`), with `text-pretty` and generous line height (`1.55`) for effortless readability. No monospace or code-looking fonts are used for general UI labels, metadata, or navigation.

## Layout & Whitespace

- **Tightened Pacing**: Vertical section rhythm (`py-12` to `py-16`) eliminating dead, empty white space while maintaining clear breathing room.
- **Container Constraint**: Max-width bounded at `max-w-5xl` for cohesive reading and zero stretched empty margins.
- **Asymmetric Bento Grids**: Clean multi-column grids for project highlights, stack categories, and metrics.
- **Zero Horizontal Bleed**: Safe-area insets respected on all viewports (`h-dvh` over `h-screen`).

## Motion & Transitions (Emil Kowalski Philosophy)

1. **GPU-Composited Transitions**:
   - Only `transform` and `opacity` are animated. Layout and paint properties (`width`, `height`, `margin`, `padding`) are strictly never animated.
   - Micro-interaction curve: `cubic-bezier(0.16, 1, 0.3, 1)` with durations between `180ms` and `250ms`.
2. **Scroll Entrance Reveals**:
   - Major blocks smoothly slide up (`translateY(14px)` to `0`) and fade in as they cross the viewport via a lightweight `IntersectionObserver`.
3. **Card Lift**:
   - Cards subtly lift (`translateY(-2px)`) on hover with responsive border contrast shifts.
4. **Reduced Motion Respect**:
   - All animations and transitions are bypassed when `prefers-reduced-motion: reduce` is detected.

## Shapes & Radii

- Container & Card radius: `8px` (`rounded-lg`) or `12px` (`rounded-xl`).
- Buttons & Badges: `6px` (`rounded-md`) to `8px` (`rounded-lg`).
- Status Indicators: Pill shapes (`rounded-full`) reserved strictly for availability status dots and filter tags.
