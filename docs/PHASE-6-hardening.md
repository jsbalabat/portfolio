# Phase 6: Hardening

**Goal:** Lighthouse 100s and passing Core Web Vitals, measured on the deployed site, on a phone.

**Prerequisites:** Phases 3 to 5 complete. All content in place.

**Time:** 3 to 5 hours.

---

## Why this phase exists

Your audience is recruiters, mostly on phones, on connections you do not control. Past roughly
three seconds you are gone, and it does not matter how good the case studies are.

There is also a second-order effect: for a frontend or full-stack candidate, the portfolio *is* a
work sample. A slow portfolio is a slow site you built and shipped, which says something about your
work regardless of what the case studies claim.

Astro has done most of this for you. This phase is about not having undone it.

---

## The targets

| Metric | Target | What fails it |
| --- | --- | --- |
| Lighthouse Performance | 100 | Unoptimised images, render-blocking fonts, a hero that animates in |
| Lighthouse Accessibility | 100 | Contrast, missing alt text, heading order, unlabelled links |
| Lighthouse Best Practices | 100 | Console errors, missing image dimensions, insecure requests |
| Lighthouse SEO | 100 | Missing meta description, non-crawlable links |
| **LCP** (loading) | under 2.5s | The hero. Almost always the hero |
| **INP** (responsiveness) | under 200ms | Heavy JavaScript on the main thread. Replaced FID |
| **CLS** (stability) | under 0.1 | Images without dimensions, fonts swapping, late-injected content |

Lighthouse 100 on desktop is easy and means little. **Run every audit on mobile emulation with
throttling.** That is the number that reflects your reader.

---

## Step 1: Images

Almost always the largest win, because screenshots are the heaviest thing on the site.

- Everything through `astro:assets`, so you get AVIF and WebP with fallbacks and automatic
  dimensions. A raw `<img src>` anywhere is a bug.
- **Explicit `width` and `height` on every image.** Fixes CLS and is an accessibility improvement in
  one line.
- `loading="eager"` and `fetchpriority="high"` on the single above-the-fold hero image only.
  Everything else lazy. Getting this backwards is the most common self-inflicted LCP wound.
- `sizes` on responsive images so a phone downloads a phone-sized file, not the 2x desktop one.
- Video: `preload="none"`, poster image, no autoplay. Consider hosting the invoicing demo on a video
  host and embedding it lazily rather than serving 20MB from your own Worker.

**Verify:** DevTools Network, disable cache, throttle to Fast 3G, reload. Sort by size. Nothing
should be surprising, and the total for a case study page should be a few hundred kilobytes, not
several megabytes.

---

## Step 2: Fonts

The classic invisible LCP killer.

- **Self-host.** A `@import` from Google Fonts costs a DNS lookup, a connection, a stylesheet, and
  only then the font files, all before text renders. Download the files and serve them from your
  own origin.
- **`font-display: swap`** so text is visible immediately in the fallback.
- **Subset to Latin.** Often a 70% size reduction for nothing.
- **`<link rel="preload">` the one or two faces used above the fold.** Not all of them; preloading
  everything is the same as preloading nothing.
- **Pick a fallback with similar metrics** and use `size-adjust` in the `@font-face` so the swap
  does not shift layout. This is where a stubborn CLS number usually lives.
- **Two families maximum**, from Phase 1. Each family in each weight is another file.

---

## Step 3: JavaScript

Astro ships close to zero by default. Confirm you have not added any.

- Audit every `client:` directive. Each one is a hydration boundary shipping React to the browser.
  For most of these components the honest answer is that they did not need to be React.
- Prefer `client:visible` over `client:load` for anything below the fold.
- No animation library, per the Phase 1 motion budget.
- Check the console on every page. Zero errors, zero warnings. A console error costs a Best
  Practices point and reads as carelessness to anyone who opens DevTools, which on a developer
  portfolio is a real fraction of visitors.

**Verify:** DevTools Coverage panel. It shows how much of the JavaScript you shipped actually ran.

---

## Step 4: Accessibility audit

Lighthouse catches maybe a third of accessibility problems. Do all four of these.

**Automated:** the axe DevTools extension on every page type. Fix everything it reports.

**Keyboard only:** unplug the mouse. Tab through each page. Focus always visible, order matches
visual order, nothing trapped, skip link works, no interactive element unreachable.

**Screen reader:** NVDA on Windows is free. Twenty minutes on your home page and one case study.
This is uncomfortable the first time and it will find things nothing else does, usually links that
announce as "click here" and images whose alt text describes the file rather than the content.

**Zoom:** browser zoom to 200%. Nothing should overlap or get cut off. Then 400%, where content
must reflow to a single column rather than requiring horizontal scrolling.

Also check: contrast in both themes including muted text on tinted surfaces, `prefers-reduced-motion`
actually honoured, and every form control (your contact link, the admin date switch) labelled.

---

## Step 5: Measure on the real thing

**Lighthouse in Chrome DevTools**, mobile mode, on the deployed URL, not localhost. Localhost has no
network and no CPU contention, so it flatters everything.

**PageSpeed Insights** on the live URL. It gives you a lab score and, once you have traffic, real
field data from actual visitors. The field data is what Google uses, and it can disagree with your
lab score. Trust the field data.

**Your actual phone, on mobile data, not on your home wifi.** This is the real condition and it is
the only test that counts. Roughly 93% of recruiter browsing is mobile.

Test on both mobile Safari and Chrome. Safari is where CSS you were sure about turns out to behave
differently.

**Failure mode.** Optimising against desktop Lighthouse on localhost, scoring 100 everywhere, and
shipping a site that takes six seconds on a phone in a train station.

---

## Step 6: The last pass

- **Every link clicked.** Every one. Broken links are the single most common portfolio defect and
  the cheapest to prevent.
- **`/admin` and `/api/collect` do not appear in `sitemap.xml`**, and `/admin` is disallowed in
  `robots.txt`. It is gated anyway, but there is no reason to advertise it.
- **HTTPS everywhere.** No mixed content, no `http://` in any src or href.
- **Security headers** via a Cloudflare Transform Rule or your Worker: `Strict-Transport-Security`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a
  Content-Security-Policy. CSP is fiddly on a site with inline scripts, and yours has the analytics
  beacon, so either give it a nonce or accept a looser policy. Do not skip the other three, they are
  free.
- **404 page works**, and is reached by a genuinely wrong URL rather than only in dev.
- **Print stylesheet.** Someone will print a case study. Ten minutes.

---

## Exit criteria

- [ ] Lighthouse 100 on all four categories, mobile emulation, on the deployed URL
- [ ] LCP under 2.5s, INP under 200ms, CLS under 0.1
- [ ] axe DevTools clean on every page type
- [ ] Full keyboard pass, no traps, focus always visible
- [ ] Twenty minutes with a screen reader, findings fixed
- [ ] 200% and 400% zoom both usable
- [ ] Fonts self-hosted, subset, preloaded, with a metric-matched fallback
- [ ] Every `client:` directive justified
- [ ] Zero console errors on every page
- [ ] Tested on a real phone on mobile data, Safari and Chrome
- [ ] Every link clicked
- [ ] Security headers present; `/admin` out of the sitemap and disallowed in robots.txt

**The test for this phase:** hand your unlocked phone to someone, on mobile data, with the site
already closed. Ask them to find out what you do and which project you are proudest of. Watch where
they hesitate. That is your remaining work.
