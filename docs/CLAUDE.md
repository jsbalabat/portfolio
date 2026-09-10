# Portfolio Project Conventions

Read this before doing anything in `D:\Projects\portfolio`.

## The one rule that overrides everything

**John writes all the code for this project.** This is a deliberate learning build. Claude does not
scaffold, implement, refactor, or fix the site's source files.

What Claude does here:

- Explains a concept, an API, or an error message
- Reviews code John has already written and points at problems
- Answers "why is this happening" with a diagnosis, not a patch
- Updates the guide files in `docs/` when a decision changes

What Claude does not do here:

- Write or edit anything under `src/`, `public/`, `astro.config.mjs`, `wrangler.jsonc`, or
  `schema.sql`
- Run `npm`, `npx`, `wrangler`, or `git` commands. Hand them over in a fenced block for John to run
- Offer to "just implement it quickly"

If John asks directly for code, that overrides this file. He will say so explicitly.

## Working style

- **John runs the shell commands.** Every command goes in a fenced PowerShell or bash block, never
  through a tool call.
- **Never create directories without asking.** John manages the folder structure.
- **Root causes, not band-aids.** No `any`, no `@ts-ignore`, no disabled lint rules, no skipped
  migrations, no `sleep` to paper over a race. If a fix is large, say so and propose it.
- **Teach the DevOps steps hands-on.** For anything touching Cloudflare, Wrangler, D1, CI, or DNS:
  state the intent, name the file, walk through it annotated, then cover the failure modes. Do not
  hand over a finished config with no explanation.
- **Comments say why, not what.** Code is self-documenting for the how; comments carry rationale.
- **No AI attribution anywhere.** No `Co-Authored-By` trailer, no mention of Claude or AI in commit
  messages, code comments, the README, or anything on the site.
- **Do not pre-draft commit messages.** Provide one when John is actually committing.

## The guide

`docs/` holds the build guide, phases 0 through 7, plus the README index. It is the plan of record.
If a decision changes mid-build, update the affected phase file and the decisions table in
`docs/README.md` in the same pass, so the guide never disagrees with the site.

## Content rules

The site's writing follows the same standard as `D:\Projects\Resumes\CLAUDE.md`, because the two are
read by the same people and by the same classifiers. Read that file before writing any site copy.
The parts that carry over:

1. **No unverifiable claims.** Every number traces to `resume_master.json` or the GitHub audit. If a
   number cannot be sourced, cut the number, not the sentence.
2. **No em dashes and no en dashes.** Anywhere. Use a comma, a period, a colon, or a plain hyphen.
3. **Banned words:** spearheaded, leveraged, utilized, orchestrated, pivotal, intricate, robust,
   seamless, comprehensive, delve, tapestry, synergy, "passionate about", "proven track record",
   "results-driven", "dynamic professional".
4. **Full technology names.** PostgreSQL not Postgres, JavaScript not JS. Version numbers where they
   signal currency: React 19, Next.js 16, Node.js 22.
5. **One name per project**, matching the live URL, used identically on the site, the resume,
   GitHub, and LinkedIn.
6. **Never attach AI-assisted delivery to a commit count.** Case studies say what was built. The
   Uses page says what he builds with. Different pages.

## Confidentiality

**MyThorneAI (Thorne Consulting) does not appear on this site.** The internship letter signed
30 July 2026 carries a confidentiality clause covering proprietary software, source code, customer
data, and internal business processes. No case study, no client name, no product name, no
architecture, no screenshots, no ticket references, no internal URLs. The About page may say
"currently interning as a software developer" and nothing more.

The invoicing platform is used by six real companies. Every screenshot of it must be scrubbed of
real customer names, email addresses, phone numbers, and company data before it goes near the repo.

## Privacy, for the analytics work in phases 4 and 5

Non-negotiable, and the reason the site needs no cookie banner:

- **No raw IP address is ever written, logged, or included in an error message.** It feeds the hash
  and is discarded.
- **No full user agent is stored.** It feeds the hash and the device bucket, then is discarded.
- The visitor identifier is `SHA-256(daily_salt + domain + ip + user_agent)`, with the salt rotated
  and the old one deleted every 24 hours.
- Referrers are reduced to the host. Never store the path or query string.
- Every D1 query uses bound parameters. Path and referrer are attacker-controlled input.
- `/privacy` must describe what the code actually does. If the code changes, the page changes in the
  same commit.

## Stack facts worth not re-deriving

- **`@astrojs/cloudflare` does not support Cloudflare Pages.** Workers only. Most tutorials are
  stale on this.
- **Cloudflare recommends Workers with static assets over Pages for new projects.**
- The site is `output: 'static'`. Only three routes opt out with `export const prerender = false`:
  `/api/collect`, `/admin`, and the admin stats endpoint. Do not suggest `output: 'server'`.
- **Tailwind 4 has no `tailwind.config.js`.** It configures in CSS with `@theme`. If a suggestion
  involves creating that file, it is Tailwind 3 advice.
- `wrangler dev` runs the real Workers runtime; `npm run dev` does not. Edge-runtime problems only
  show up in the former.
- `--local` and `--remote` D1 are separate databases. Schema changes go to both.
- Cloudflare Access gates `/admin`. There is no hand-rolled auth in this project and none should be
  proposed.
