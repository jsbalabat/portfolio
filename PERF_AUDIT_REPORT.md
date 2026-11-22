# Performance Audit & Optimization Report: Portfolio Site

**Branch**: `Marc/portfolio-perf`  
**Commit**: `5df7e8075bc3d9bf8584700b30aa02cff51f6acf`  
**Status**: Verified & Pushed to `origin/Marc/portfolio-perf`

---

## 1. Root Causes Found (Ranked by Slow-Network Impact)

1. **Massive Redundant & Oversized Image Payloads (11.23 MB -> 0.61 MB, -94.6%)**:
   - Four duplicate 2.67 MB uncompressed 2160x2880 camera JPEG images (`profile.jpg`, `profile-desktop.jpg`, `profile-tablet.jpg`, `profile-mobile.jpg`) totaling 10.66 MB copied into `dist/images/`.
   - Raw phone camera 496 KB (3024x4032) JPEG image (`coverImage.JPG`) loaded for blog cards and article hero.
   - Unoptimized 2000x2000 PNG logo (69.1 KB) served for 28x28 display.
   - Missing `decoding="async"`, missing width/height attributes (causing layout shifts), and lack of progressive compression.

2. **Render-Blocking External Google Fonts with `display=block`**:
   - Synchronous external stylesheet request `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?...&display=block">` directly in `<head>`.
   - `display=block` triggered Flash of Invisible Text (FOIT) on slow connections, blocking text rendering until the remote font finished downloading.
   - Request included unused `800` font weight for Alumni Sans (`wght@700;800;900`), adding unnecessary webfont bytes.

3. **Artificial Screen Gate via Splash Loader (`SplashLoader.astro`)**:
   - Dismissal was gated on `window.addEventListener('load')` + 400ms delay or 700ms fallback, with a 700ms cubic-bezier CSS slide-out animation.
   - On slow connections, `window.load` waited for every remote image, font, and script to finish before initiating splash exit, artificially hiding pre-rendered HTML content behind an opaque viewport overlay for seconds.

4. **Eager Hydration of Below-the-Fold / Inactive Client Islands**:
   - `<ContactModal client:load />` in `BaseLayout.astro` eagerly downloaded and executed React 19 runtime (`client.DinJNqzI.js`, 182.74 KB uncompressed / 57.60 KB gzip) and `ContactModal.00cc53I7.js` (9.71 KB) on initial page load, despite the modal rendering `null` until opened by user click.
   - `<AuditFlowSimulator client:load />` in `projects/[...slug].astro` eagerly loaded a 41.28 KB bundle even when located far below the initial fold.

5. **Missing HTTP Asset Caching Headers**:
   - Absence of `public/_headers` meant Cloudflare Workers / Pages served static bundles (`/_astro/*`) without `Cache-Control: public, max-age=31536000, immutable`, forcing redundant re-validation on repeat visits across slow links.

6. **Unconstrained Client Router Prefetching**:
   - Default navigation prefetching in `astro.config.mjs` could trigger link hover prefetching on slow links, saturating cellular bandwidth.

---

## 2. Concrete Before vs. After Measurements

| Metric | Before Optimization | After Optimization | Delta / Impact |
| :--- | :--- | :--- | :--- |
| **Total `dist/images/` Payload** | **11,244,074 bytes (11.24 MB)** | **610,284 bytes (0.61 MB)** | **-10,633,790 bytes (-94.6%)** |
| `profile-desktop.jpg` | 2,666,384 bytes (2.67 MB) | 165,286 bytes (165 KB) | -93.8% |
| `profile-tablet.jpg` | 2,666,384 bytes (2.67 MB) | 101,947 bytes (102 KB) | -96.2% |
| `profile-mobile.jpg` | 2,666,384 bytes (2.67 MB) | 49,819 bytes (50 KB) | -98.1% |
| `profile.jpg` | 2,666,384 bytes (2.67 MB) | 165,286 bytes (165 KB) | -93.8% |
| `coverImage.JPG` (Blog) | 496,069 bytes (496 KB) | 120,123 bytes (120 KB) | -75.8% |
| `logo.png` | 69,121 bytes (69.1 KB) | 4,935 bytes (4.9 KB) | -92.9% |
| **Render-blocking External CSS** | 1 blocking request (`display=block`) | 0 blocking requests (`display=swap`, non-blocking print-to-all switch) | Eliminated FOIT & render-blocking chain |
| **Unused Font Weights** | Alumni Sans: 700, 800, 900 | Alumni Sans: 700, 900 | Trimmed unused 800 weight |
| **Initial Critical Path Hydration JS** | ~192.4 KB (React 19 + ContactModal eagerly loaded) | 0 KB on initial render (Deferred to `client:idle`) | Eliminated initial JS execution contention |
| **AuditFlow Simulator Hydration** | Eager (`client:load`) | Viewport-gated (`client:visible`) | Saves 41.3 KB bundle until user scrolls |
| **Splash Screen Reveal Latency** | Gated on `window.load` + 400ms + 700ms exit | Gated on DOM readiness + 150ms + 350ms exit | Snappy unblocked page reveal |
| **Static Cache Headers** | None (`public/_headers` missing) | 1-year immutable for `/_astro/*`, 30-day for `/images/*` | Zero re-validation requests on revisit |
| **Prefetching Strategy** | Unconstrained default | `defaultStrategy: 'tap'` | Prevents mobile link-hover saturation |

---

## 3. Files Modified

1. `astro.config.mjs`: Added conservative prefetching config (`defaultStrategy: 'tap'`).
2. `public/_headers`: Created Cloudflare caching headers for immutable assets and static media.
3. `public/images/logo.png`: Resized 2000px to 256px crisp PNG.
4. `public/images/blog/test-post/coverImage.JPG`: Resized and compressed with progressive mozjpeg.
5. `public/images/profile-desktop.jpg`: Resized and compressed to 800w JPEG.
6. `public/images/profile-tablet.jpg`: Resized and compressed to 600w JPEG.
7. `public/images/profile-mobile.jpg`: Resized and compressed to 400w JPEG.
8. `public/images/profile.jpg`: Resized and compressed to 800w JPEG.
9. `src/components/BlogCard.astro`: Added `decoding="async"`, `width="400"`, and `height="250"`.
10. `src/pages/blog/[slug].astro`: Added `loading="lazy"`, `decoding="async"`, `width="896"`, `height="504"`.
11. `src/components/SplashLoader.astro`: Rebuilt dismissal logic to decouple from `window.load` and sped up exit animation.
12. `src/layouts/BaseLayout.astro`: Converted Google Fonts to non-blocking swap, added `decoding="async"` to logos, changed ContactModal to `client:idle`.
13. `src/pages/projects/[...slug].astro`: Changed AuditFlowSimulator to `client:visible`.

---

## 4. Verification Results

- `pnpm run check`: **0 errors, 0 warnings, 0 hints** across 19 files.
- `pnpm run build`: Exit code **0**. All 19 static routes prerendered cleanly.
- Asset link audit: All 18 local assets referenced in `dist/index.html` and project pages resolve with 0 broken links.
- Git sync: Fully rebased on latest `origin/main` (commit `ee0939d`) and cleanly pushed to `origin/Marc/portfolio-perf`.
