# Portfolio Build Guide

A phased, step-by-step guide for building your personal portfolio site. You write all the code.
These documents tell you what to build, why, how to verify it worked, and what usually breaks.

**Audience of the site:** remote international recruiters and engineering hiring managers.
**Stack:** Astro 5 + React 19 islands + Tailwind 4, deployed to Cloudflare Workers with D1.
**Budget:** about 2 to 3 weeks part-time.

---

## How to use this

Work one phase at a time, in order. Each phase file has the same shape:

- **Goal** in one sentence
- **Prerequisites** so you know if you are ready
- **Steps**, each written as intent, then the thing to build, then how to verify it
- **Failure modes**, the specific ways the step goes wrong
- **Exit criteria**, a checklist you have to clear before moving on

Do not skip ahead to Phase 2 because scaffolding is more fun than writing. Phase 0 is the phase
that determines whether the site has anything worth reading on it.

---

## Phases

| # | Phase | File | Exit criterion |
| --- | --- | --- | --- |
| 0 | Content and positioning | [PHASE-0-content.md](PHASE-0-content.md) | Three case studies drafted in Markdown, every number sourced, domain on Cloudflare nameservers |
| 1 | Design direction | [PHASE-1-design.md](PHASE-1-design.md) | A token set, four wireframes, a written motion budget |
| 2 | Scaffold and deploy | [PHASE-2-scaffold.md](PHASE-2-scaffold.md) | Your real domain serves a deployed page, and a git push updates it |
| 3 | The public site | [PHASE-3-site.md](PHASE-3-site.md) | Three case studies live, keyboard navigable, correct link preview on LinkedIn |
| 4 | Analytics pipeline | [PHASE-4-analytics.md](PHASE-4-analytics.md) | Rows land in D1 from a real phone visit, no raw IP in the schema |
| 5 | Admin dashboard | [PHASE-5-admin.md](PHASE-5-admin.md) | You log in and see your own traffic broken down by country |
| 6 | Hardening | [PHASE-6-hardening.md](PHASE-6-hardening.md) | Lighthouse 100s and passing Core Web Vitals, measured on the deployed site |
| 7 | Launch and iterate | [PHASE-7-launch.md](PHASE-7-launch.md) | Live, distributed, and you have read your own analytics once |

### Progress

- [ ] Phase 0 complete
- [ ] Phase 1 complete
- [ ] Phase 2 complete
- [ ] Phase 3 complete
- [ ] Phase 4 complete
- [ ] Phase 5 complete
- [ ] Phase 6 complete
- [ ] Phase 7 complete

---

## Decisions already locked

Recorded here so you do not relitigate them at 1am in Phase 3.

| Decision | Choice | Why |
| --- | --- | --- |
| Primary audience | Remote international recruiters | Drives every tradeoff below. Speed and scannability beat visual ambition. |
| Framework | Astro 5, static by default | A typical Astro page ships 0 to 15KB of client JavaScript. The same page in Next.js 16 ships 85 to 250KB. Your reader is on a phone on mobile data. |
| Interactivity | React 19 islands | You already know React 19. Islands mean you pay the JavaScript cost only on components that need it. |
| Styling | Tailwind CSS 4 | Already on your resume. CSS-first config, no `tailwind.config.js` to maintain. |
| Host | Cloudflare Workers with static assets | Free tier with unlimited bandwidth, and the site, the analytics API, and the database live in one deploy. |
| Database | Cloudflare D1 | SQLite at the edge, bound directly into the Worker. No connection string, no separate service. |
| Admin gate | Cloudflare Access | Free for 50 users. Google login in front of `/admin` with zero auth code to write or maintain. |
| Case studies at launch | UnitKo, tell-health, invoicing platform | The three with public code, live URLs, and defensible numbers. |
| MyThorneAI | Off the site entirely | The internship letter signed 30 July 2026 carries a confidentiality clause covering source code, architecture, and internal processes. |
| Visual tone & Palette | Tranquil Minimalist (#73877b, #839788, #bdbbb6, #e5d1d0, #f5e4d7) | Calming, accessible, human aesthetic avoiding cold AI-like motifs. Documented in `docs/UI_UX_BEST_PRACTICES.md`. |
| UI/UX Best Practices | Proof-First & Scannable | Integrated TLDR mode, authentic tech stack SVG icons, interactive schema diff slider, and Command Palette. |

### Two things that are true now and were not last year

Both will bite you if you follow an older tutorial.

1. **`@astrojs/cloudflare` does not support Cloudflare Pages any more.** It targets Workers only.
   Any guide that says "deploy your Astro site to Cloudflare Pages" is stale.
2. **Cloudflare recommends Workers with static assets for all new projects.** Pages still works
   and is not being killed, but Workers is where the unified frontend, backend, and bindings story
   lives, which is exactly what Phase 4 and Phase 5 need.

---

## Inspiration

Use these with a purpose, not as an afternoon of scrolling. Phase 1 tells you what to extract from
each one.

**Galleries**

| Site | What it is good for |
| --- | --- |
| [Awwwards, portfolio winners](https://www.awwwards.com/websites/winner_category_portfolio/) | Peak-craft direction. Filter by technology (React, WebGL, Three.js) to see what a stack looks like at the top end. Judged on design, usability, creativity, and content. |
| [Godly](https://godly.website) | The better reference for your goal. More restrained, editorial, typographically considered. Grid discipline and generous whitespace rather than novelty. |
| [Mobbin](https://mobbin.com) | Interaction and UI patterns, mostly mobile. Good for "how should this actually behave". |
| [Typewolf](https://www.typewolf.com) | Type pairing, and it names the fonts. Solves the hardest single decision in Phase 1. |
| [Land-book](https://land-book.com) | Single-page and landing-page structure. |
| [One Page Love](https://onepagelove.com) | Same, with a bias toward smaller personal sites. |
| [SiteInspire](https://www.siteinspire.com) | Clean, minimal, editorial. Filterable by type and style. |

**Engineer-run personal sites, read for structure rather than looks**

- [brittanychiang.com](https://brittanychiang.com) The reference single-page engineer portfolio. Look at how little is on it.
- [joshwcomeau.com](https://www.joshwcomeau.com) How to make technical writing feel warm without being unserious.
- [leerob.com](https://leerob.com) Extreme brevity. The whole site is nearly text.
- [rauno.me](https://rauno.me) Craft in micro-interactions, done without wrecking performance.
- [paco.me](https://paco.me) Minimalism taken further than you will want to, useful as the far end of the range.
- [linear.app](https://linear.app) Not a portfolio, but the current benchmark for dark-mode type, spacing, and restraint.

**What to actually take from them:** structure, information hierarchy, and how much they leave out.
Not colours and not animation. Everyone copies the animation and nobody copies the editing.

---

## Reference material worth keeping open

- [Astro docs](https://docs.astro.build) and the [Cloudflare adapter guide](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Cloudflare Workers static assets](https://developers.cloudflare.com/workers/static-assets/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/) and [IP geolocation](https://developers.cloudflare.com/network/ip-geolocation/)
- [Plausible data policy](https://plausible.io/data-policy), the salted-hash pattern Phase 4 copies
- [web.dev Core Web Vitals](https://web.dev/vitals/)

Your own content sources, both already verified, both of which Phase 0 draws on:

- `D:\Projects\Resumes\resume_master.json` for the canonical numbers and role descriptions
- `D:\Projects\Resumes\CLAUDE.md` for the GitHub audit, the writing rules, and the confidentiality clause
