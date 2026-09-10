# Phase 0: Content and Positioning

**Goal:** have everything the site will say, written and sourced, before a framework exists.

**Prerequisites:** none. Start here.

**Time:** 4 to 6 hours, spread over two sittings. Do the writing on one day and the asset capture
on another, because they use different parts of your brain and doing both at once produces bad
versions of each.

---

## Why this phase exists

The single most common way a developer portfolio fails is that the developer builds the site
first, gets it looking good, and then discovers they have three hundred words to put in it. The
site ends up as a beautiful container for "I am a passionate developer who loves clean code".

You are in an unusually strong position here, because the hard part is already done. The commit
counts, the live URLs, the adoption numbers, and the measured before/after figures already exist
in `D:\Projects\Resumes\resume_master.json`, and the GitHub audit crawled on 22 Aug 2026 sits in
`D:\Projects\Resumes\CLAUDE.md`. This phase is mostly transcription and expansion, not invention.

One number is worth internalising before you write: **84% of employers say they want to see working
applications, not repositories.** Every case study in this phase ends in a live link. If a project
does not have one, it is not a launch case study.

---

## Step 1: Write the positioning line

**Intent.** A recruiter lands on your home page and decides in seven seconds whether to keep
reading. That decision is made on one line of text, above the fold, before any project.

**What to write.** One sentence. What you build, for whom, with what evidence. Draft it from the
resume summary, which already survived editing:

> Full-stack engineer who ships production systems that replace manual workflows.
> 650+ commits across three products in 14 months, sole engineer on all three.

Then write four more versions and pick one. Some directions worth trying:

- Lead with the outcome: replacing Excel billing, replacing manual property management.
- Lead with the ownership: sole engineer on three shipped products.
- Lead with the stack, if you are targeting a specific one.

**Test it.** Read your line and ask: could a bootcamp graduate with zero shipped work write the
same sentence about themselves? If yes, it is not a positioning line, it is a greeting. "Passionate
full-stack developer" fails this test. "Sole engineer on three shipped products" passes, because it
is not available to someone who has not done it.

**Failure mode.** Writing a line that is true of you but also true of ten thousand other people.
Specificity is the whole point. The number is what makes it unforgeable.

---

## Step 2: Lock the project names

**Intent.** Hard rule 5 in the resume standard exists because of a real problem: the invoicing app
has been `distribution-app` in the repository, `new_test_store` in the README, and "Mobile
Invoicing Platform" on the resume, and nobody reading all three could tell they were the same
thing.

**What to do.** For each of the three projects, write down one public-facing name, and commit to
using it in five places: the portfolio site, the resume, the GitHub repository name or description,
LinkedIn, and the live URL if you control it.

| Project | Repository | Live URL | Public name |
| --- | --- | --- | --- |
| Rental property platform | `unit-ko` | unitko.vercel.app | (decide) |
| Telehealth platform | `tell-health` | tell-health.vercel.app | (decide) |
| Invoicing platform | `distribution-app` | (mobile app, no public URL) | (decide) |

The first two are easy: the repository, the URL, and the obvious name already agree. The third is
the one to actually decide, and it has a second problem: it is a Flutter mobile app, so there is no
URL to link. See Step 4 for how to handle that.

**Failure mode.** Deciding this in Phase 3 while you are writing the page title, and picking
something different from what the resume says.

---

## Step 3: Draft the three case studies in Markdown

**Intent.** Write the content in plain files, in a text editor, with no styling to hide behind. If
the writing only works once it has a nice font on it, the writing does not work.

**Where.** Create these three files now. They become the content collection in Phase 2 with almost
no editing.

```
D:\Projects\portfolio\content\unitko.md
D:\Projects\portfolio\content\tell-health.md
D:\Projects\portfolio\content\invoicing.md
```

### The template

STAR, adapted for engineering. Copy this structure into each file.

```markdown
---
title:        # the public name from Step 2
tagline:      # one line, what it does and for whom
role:         # "Sole engineer" / "Frontend, 3-dev team"
timeline:     # "Jun 2025 - present, 14 months"
stack:        # 5 to 7 items, no more
liveUrl:      # required, or explain in Step 4 why there isn't one
repoUrl:      # if public
featured:     # true / false
---

## The problem
What was happening before this existed, and what it cost. Business pressure, not technical
curiosity. Two to three sentences.

## What "done" meant
The success criteria, and who set them. This is where you show you understood scope, which is
the thing juniors most visibly lack.

## What I built
The technical work. Every sentence here is a decision with a reason behind it. The tools are
implied by the decisions, not paraded in a list.

## The hard part
One specific problem you solved, in detail. This is the section that separates you from someone
who followed a tutorial, and it is the section an engineer reading your site skips to.

## Results
Numbers first. Adoption, throughput, time saved, measured before and after.

## What I would do differently
Two or three sentences. Optional, but it reads as seniority and costs you nothing.
```

### The numbers you already have

Every figure below is sourced. Do not add any that is not.

**UnitKo**
- 423 commits over 14 months, sole engineer
- TypeScript 76.9%, PL/pgSQL 22.5% of the codebase
- Migrated a Next.js and Supabase monolith to a Turborepo and pnpm workspace: web, API, shared-types, database
- Data layer written as versioned PostgreSQL rather than ORM abstractions: migrations, per-landlord row-level security, atomic RPC functions
- Normalized to third normal form, containerized with Docker Compose
- Live at unitko.vercel.app

**tell-health**
- 89 commits across 6 calendar days, peaking at 44 commits on 30 May
- Selected as 1 of 25 from 58 applicants, then advanced to Round 2
- AI symptom-to-specialist matching on Groq Llama 3.3 70B, with red-flag triage for emergencies
- JWT-authenticated Socket.IO notifications, time-gated video calls
- TypeScript end to end (React 19, Node.js 22, MongoDB Atlas) on Docker Compose behind Traefik
- Live at tell-health.vercel.app

**Invoicing platform**
- 139 commits over 11.5 months, sole developer. Dart 75.9%
- Adopted by 6 companies, clears about 150 invoices per day, replaced Excel billing
- Writes moved into Firebase Cloud Functions so stock decrements and document numbering stay atomic and idempotent
- Offline-first queue on encrypted local storage
- Role-based access control, audit-log export, Excel import, PDF output, one Flutter codebase

### Rules the writing has to follow

These are lifted from `D:\Projects\Resumes\CLAUDE.md`, because the site and the resume have to
sound like the same person and get read by the same classifiers.

1. **Every number traces to something real.** If you cannot source it, cut the number, not the
   sentence. No "improved performance significantly".
2. **No em dashes and no en dashes.** Use a comma, a period, a colon, or a plain hyphen. Recruiters
   and the AI-content classifiers shipped into Workday, Greenhouse, and Lever in late 2025 read
   heavy em-dash use as a marker of generated text.
3. **Banned words**, same list as the resume: spearheaded, leveraged, utilized, orchestrated,
   pivotal, intricate, robust, seamless, comprehensive, delve, tapestry, synergy, "passionate
   about", "proven track record", "results-driven".
4. **Full technology names.** PostgreSQL not Postgres, JavaScript not JS, Kubernetes not K8s.
   Version numbers where they signal currency: React 19, Next.js 16, Node.js 22.
5. **Never attach AI-assisted delivery to a commit count.** "423 commits, built with Claude Code"
   invites the reader to discount the 423. Keep the claims apart: case studies say what was built,
   a separate toolbox page says what you build with.

### What must not appear

**MyThorneAI is off the site entirely.** No case study, no logo, no architecture, no ticket
references, no screenshots, no internal tooling URLs. The internship letter signed 30 July 2026
carries a confidentiality clause covering proprietary software, source code, customer data, and
internal business processes. If you want to signal current employment at all, the About page can
say "currently interning as a software developer" with no client name, no product, and no
technical detail. When in doubt, leave it out: there is no version of this that is worth the risk.

**Failure mode for this whole step.** Writing three case studies that are structurally identical
and read like a form. Vary the opening. Let the "hard part" section be genuinely different in each,
because in reality they were: UnitKo's hard part is the row-level security and 3NF schema work,
tell-health's is shipping a working product in six days, the invoicing platform's is offline-first
correctness under bad connectivity.

---

## Step 4: Solve the mobile app problem

**Intent.** The invoicing platform is a Flutter app with real adoption and no URL a recruiter can
click. That is a content problem, not a design problem, so solve it here.

**Options, roughly in order of effort:**

1. **A screen recording.** 30 to 45 seconds, silent, showing a real invoice created end to end.
   This is the highest-value option and the one that actually substitutes for a live demo.
2. **A Flutter web build**, if the app compiles to web without the native pieces breaking. A demo
   mode with seeded data and writes disabled. High effort, high payoff.
3. **A screenshot walkthrough**, three or four annotated frames.

Do option 1 at minimum. Note in the case study that it is a private commercial deployment, which is
itself a credibility signal rather than an excuse.

**Failure mode.** Shipping a case study whose only visual is the app icon.

---

## Step 5: Capture the assets

**Intent.** Gather everything now so Phase 3 is layout work and not a scavenger hunt.

Per project:

- **Hero screenshot** at 2x device pixel ratio, real data, no lorem ipsum, no visible test records
  named "asdf". Use a browser window with the URL bar visible if the URL is part of the credibility.
- **Two or three detail screenshots** of the parts the case study talks about.
- **A screen recording**, 30 to 45 seconds, no audio. Export as MP4 and plan to serve it as a
  poster image plus a lazy-loaded video, never an autoplaying one.

Sitewide:

- **One architecture diagram**, for UnitKo. This is the single highest-leverage image on the whole
  site, because it is the one thing on a junior portfolio that reads as senior. Draw the Turborepo
  package boundaries, the PostgreSQL layer with row-level security, and where the RPC functions
  sit. Excalidraw or draw.io is fine. Hand-drawn beats absent.
- **A headshot.** A real photo of your face. It measurably increases contact rates and it costs
  you one afternoon.
- **A favicon source**, a single letter or mark, drawn as SVG.

Scrub every screenshot for real customer names, real email addresses, real phone numbers, and real
company data. The invoicing app is used by six real companies, so this is not theoretical. Same
standard as the confidentiality clause: you cannot unpublish a screenshot that has already been
crawled.

**Failure mode.** Capturing screenshots at 1x, then discovering in Phase 6 that they look soft on
every phone made in the last eight years.

---

## Step 6: Buy the domain

**Intent.** Do this first, not last, because DNS propagation is the one part of this build you
cannot compress.

**Choosing.** In rough order of preference:

1. `yourname.com`. Boring, permanent, works when you change specialisms, and every recruiter
   parses it instantly.
2. `yourname.dev`. Signals developer, requires HTTPS by design, slightly harder to say out loud on
   a call.
3. Avoid hyphens, avoid numbers, avoid anything you have to spell out. You will read this domain
   over a bad Zoom connection to someone in a different accent. Test it that way before buying.

Avoid clever TLDs that a recruiter might not recognise as a real website. `.io` is understood,
`.me` is understood, most of the rest are not worth the ambiguity.

**Where.** Cloudflare Registrar sells at cost with no markup at renewal, and since your DNS,
hosting, and admin gate are all Cloudflare, buying there removes an entire integration step.
Namecheap or Porkbun are fine alternatives if you prefer to keep the registrar separate.

**What to do.**

1. Register the domain.
2. If you registered elsewhere, add the site to Cloudflare and change the nameservers at your
   registrar to the two Cloudflare gives you.
3. Wait for Cloudflare to report the zone as active. Usually minutes, occasionally hours.

Verify it resolves:

```powershell
nslookup -type=NS yourdomain.com
```

You want the two Cloudflare nameservers back, not your registrar's.

**Failure mode.** Registering at one provider, forgetting to change nameservers, then spending
Phase 2 debugging a custom domain that was never pointed anywhere. Also: registrars that give a
first-year price of a dollar and renew at forty. Read the renewal price, not the promotional one.

---

## Exit criteria

Do not start Phase 1 until all of these are true.

- [ ] A positioning line that a bootcamp graduate could not truthfully write about themselves
- [ ] One locked public name per project, written down
- [ ] Three case studies drafted in Markdown, each with all six sections filled in
- [ ] Every number in them traceable to `resume_master.json` or the GitHub audit
- [ ] No em dashes, no banned words, no unsourced claims
- [ ] Nothing about MyThorneAI anywhere in the content
- [ ] A screen recording for the invoicing platform
- [ ] Hero and detail screenshots at 2x for all three projects, scrubbed of real customer data
- [ ] One architecture diagram
- [ ] A headshot
- [ ] Domain registered and resolving to Cloudflare nameservers

**The test for this phase:** hand the three Markdown files to someone non-technical and ask them
what you do for a living. If they can answer, the content works and the rest is presentation.
