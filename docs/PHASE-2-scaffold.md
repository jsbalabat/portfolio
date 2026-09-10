# Phase 2: Scaffold and Deploy

**Goal:** your real domain serves a deployed page, and a git push updates it. The page can be ugly.

**Prerequisites:** Phase 0 and Phase 1 complete. Domain on Cloudflare nameservers. Node 20 or
newer, and a GitHub account.

**Time:** 3 to 4 hours, most of it Cloudflare configuration rather than code.

---

## Why this phase exists

Deploy on day one, ugly. A live URL you iterate on beats a perfect local build, for three reasons
that all bite later if you skip it:

- Deployment problems found on day one are small. Found in week three, next to a deadline, they are
  not.
- You can send the link to someone the moment a section is worth showing.
- Phase 4 needs the Cloudflare runtime to exist before you can collect anything, because the
  geolocation data comes from the edge, not from your laptop.

Everything in this phase is a command you run. They are written as blocks to copy.

---

## Step 1: Create the project

**Intent.** Get the Astro skeleton in place with the three integrations you decided on.

```powershell
cd D:\Projects\portfolio
npm create astro@latest .
```

Answer the prompts: empty project, TypeScript **strict**, install dependencies yes, git repository
yes. Strict is not optional here. It is doing the work of the tests you are not going to write for
a portfolio, and a content collection with a typed schema plus strict TypeScript means a missing
case-study field is a build error rather than a blank div you notice in three weeks.

The `.` puts it in the existing folder. `docs/` is already there and Astro will leave it alone.

Then the integrations, one at a time so a failure is attributable:

```powershell
npx astro add react
npx astro add tailwind
npx astro add sitemap
npx astro add cloudflare
```

Each one edits `astro.config.mjs` and installs packages. Read the diff it proposes before saying
yes, every time. That habit is worth more here than anywhere else in the build, because
`astro add cloudflare` is the one that changes your output target.

**Verify:**

```powershell
npm run dev
```

You get a page at `localhost:4321`.

**Failure modes.**
- `npm create astro@latest .` refuses to run in a non-empty directory. It should accept `docs/`,
  but if it objects, temporarily move `docs/` up one level and move it back after.
- Tailwind 4 has no `tailwind.config.js`. If you find yourself creating one, you are following a
  Tailwind 3 tutorial. v4 configures in CSS with `@theme`, which is where your Phase 1 tokens go.

---

## Step 2: Wire in the design tokens

**Intent.** Get the Phase 1 system into the project before any component exists, so there is never
a moment where hardcoding a colour is the path of least resistance.

1. Copy `tokens.css` into `src/styles/`.
2. Import it in your base layout, ahead of everything else.
3. Map your semantic tokens into Tailwind's `@theme` block so `bg-surface` and `text-muted` work as
   utilities. This is the part that stops you writing `style="color: var(--color-text-muted)"`
   inline forever.

**Verify:** put a `<div class="bg-surface text-muted">` on the index page and toggle your OS between
light and dark. Both look deliberate, or the token structure from Phase 1 has a gap.

---

## Step 3: Content collections

**Intent.** Your three case studies become typed, validated content. A missing `liveUrl` fails the
build instead of rendering an empty link.

Create `src/content.config.ts` defining a `work` collection with a Zod schema matching the
frontmatter you wrote in Phase 0: `title`, `tagline`, `role`, `timeline`, `stack` (array),
`liveUrl`, `repoUrl` (optional), `featured` (boolean), plus an `order` number so you control which
project reads first.

Then move the three Markdown files from `D:\Projects\portfolio\content\` into
`src/content/work/`.

**Verify:**

```powershell
npm run build
```

A build error naming a missing field is a success: it means the schema is doing its job. Fix the
frontmatter, not the schema.

**Failure mode.** Making every field optional to get past the first error. The strictness is the
entire value. If `liveUrl` is genuinely absent for the invoicing app, model that honestly, for
example a `demoVideo` field, rather than loosening `liveUrl` to optional.

---

## Step 4: Configure for Cloudflare Workers

**Intent.** Set the output target and the runtime bindings.

**Read the adapter docs before writing config:**
https://docs.astro.build/en/guides/integrations-guide/cloudflare/

Two things about this specific step, because they changed recently and most tutorials are stale:

- **`@astrojs/cloudflare` no longer supports Cloudflare Pages.** It targets Workers only. Ignore
  any guide that says otherwise.
- **The wrangler config file is now largely optional** for a basic project, because the adapter
  generates sensible defaults. You still want one, because Phase 4 needs a D1 binding declared in
  it. Take the `main` entrypoint value from the adapter docs rather than from a blog post, since it
  is the field that moved.

Create `wrangler.jsonc` with, at minimum:

- `name`, your worker name
- `compatibility_date`, set to today
- `compatibility_flags: ["nodejs_compat"]`, which the adapter needs for Node built-ins
- the `main` entrypoint the adapter docs specify
- an `assets` block pointing at your build output

Keep `output` static in `astro.config.mjs`. The site is static by default and individual routes opt
into server rendering with `export const prerender = false`. Only three routes will ever do that:
the analytics collector and the two admin routes. Setting `output: 'server'` globally would make
every page dynamic and throw away the reason you chose Astro.

**Verify, against the real runtime rather than the dev server:**

```powershell
npm run build
npx wrangler dev
```

`wrangler dev` runs your built output on the actual Workers runtime locally, which is where you
will catch Node APIs that do not exist at the edge. Get in the habit of checking here before every
deploy.

**Failure modes.**
- A missing `nodejs_compat` flag shows up as `Cannot find module 'node:...'` at runtime, not at
  build time.
- `npm run dev` passing while `wrangler dev` fails is normal and is the point. Vite's dev server is
  not the Workers runtime.

---

## Step 5: First deploy

```powershell
npx wrangler login
npx wrangler deploy
```

This gives you a `*.workers.dev` URL. Open it on your phone right now, not just on your laptop.

**Verify:** the page loads over HTTPS on a device that is not the one you built it on.

**Failure mode.** `wrangler login` opens a browser and needs you to pick the right Cloudflare
account if you have more than one. Picking the wrong one deploys to an account your domain is not
in, and the custom domain step then fails with an unhelpful error.

---

## Step 6: Attach the custom domain

**Intent.** Get off `workers.dev` and onto the domain you bought.

In the Cloudflare dashboard: Workers and Pages, select your worker, Settings, Domains and Routes,
Add custom domain. Enter the apex (`yourdomain.com`), then repeat for `www` if you want it.

Cloudflare creates the DNS records and issues the certificate itself, because the zone is already
on its nameservers. This is the payoff for doing the domain in Phase 0.

**Decide apex or www and redirect the other one.** Two live hostnames serving the same content
splits your analytics in Phase 5 and is a duplicate-content signal to search engines. Pick the
apex, and add a Cloudflare redirect rule from `www` to it.

**Verify:**

```powershell
curl -I https://yourdomain.com
curl -I https://www.yourdomain.com
```

The first returns 200. The second returns a 301 to the first.

**Failure mode.** Certificate provisioning takes a few minutes and shows a TLS error in the
meantime. Wait ten minutes before debugging it.

---

## Step 7: Continuous deployment

**Intent.** Push to `main`, site updates. You will deploy dozens of times in Phase 3 and a manual
`wrangler deploy` each time is friction that makes you deploy less.

Two options:

**Workers Builds** (simplest): in the worker's settings, connect the GitHub repository. Cloudflare
builds and deploys on push. No secrets to manage, no workflow file.

**GitHub Actions** (more visible, and it is the option that demonstrates CI knowledge): a workflow
on push to `main` that runs install, build, then `cloudflare/wrangler-action` to deploy. Needs
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repository secrets. Scope the token to
"Edit Cloudflare Workers" and nothing more.

Take Workers Builds unless you specifically want the Actions workflow as a portfolio artefact.

**Add a build gate either way.** The job should fail on a type error or a broken content schema, so
a bad push cannot reach the domain:

```powershell
npm run build
npx astro check
```

**Verify:** push a visible typo to `main`, watch the build run, see it on the live domain, then push
the fix. Do the whole loop once now so you trust it later.

**Failure mode.** An API token with broader permissions than it needs, committed into a workflow
file instead of stored as a secret. If a token ever lands in git history, roll it in the Cloudflare
dashboard rather than deleting the commit, because the history is already pushed.

---

## Step 8: Repository hygiene

Small things, done now, that cost nothing and read badly if missing when someone opens your repo,
which for a portfolio project they will.

- `.gitignore` covers `dist/`, `node_modules/`, `.wrangler/`, and `.dev.vars`. That last one is the
  local secrets file for Phase 4 and it must never be committed.
- A `README.md` at the repository root: what the site is, the stack, how to run it locally. Three
  paragraphs. This repo is itself a work sample.
- A real `LICENSE` if the repo is public.
- Meaningful commit messages. Someone will read `git log`.

---

## Exit criteria

- [ ] `https://yourdomain.com` serves your deployed site over HTTPS
- [ ] `www` redirects to the apex with a 301
- [ ] A push to `main` deploys automatically, verified end to end once
- [ ] The build fails on a type error or a content-schema violation
- [ ] Design tokens are wired in and both colour themes render deliberately
- [ ] The three case studies exist as a typed content collection
- [ ] `npx wrangler dev` runs the built site locally on the Workers runtime
- [ ] `.dev.vars` and `.wrangler/` are gitignored

**The test for this phase:** open the live domain on your phone on mobile data. If it loads, the
infrastructure is done and everything after this is content and craft.
